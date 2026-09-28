import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { fetchJson } from '../../common/http/fetch-json';

export interface Quote {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  changePct: number | null;
  estimated?: boolean;
  observedAt?: string | null;
  history: number[];
  source: string;
}

// Preços de referência (estimados). Commodities agrícolas em BRL não têm API
// pública gratuita em tempo real (CEPEA/B3 são pagos), então usamos referências.
// O dólar (USD/BRL) é obtido em tempo real via open.er-api.com.
const BASE_QUOTES: Omit<Quote, 'price' | 'changePct' | 'history'>[] = [
  { symbol: 'SOJA', name: 'Soja', unit: 'R$/saca 60kg', source: 'Referência estimada' },
  { symbol: 'MILHO', name: 'Milho', unit: 'R$/saca 60kg', source: 'Referência estimada' },
  { symbol: 'BOI', name: 'Boi Gordo', unit: 'R$/arroba', source: 'Referência estimada' },
  { symbol: 'CAFE', name: 'Café Arábica', unit: 'R$/saca 60kg', source: 'Referência estimada' },
  { symbol: 'ALGODAO', name: 'Algodão', unit: 'R$/@ pluma', source: 'Referência estimada' },
  { symbol: 'TRIGO', name: 'Trigo', unit: 'R$/ton', source: 'Referência estimada' },
  { symbol: 'DOLAR', name: 'Dólar Comercial', unit: 'R$', source: 'open.er-api.com (tempo real)' },
  { symbol: 'ACUCAR', name: 'Açúcar Cristal', unit: 'R$/saca 50kg', source: 'Referência estimada' },
];

const BASE_PRICE: Record<string, number> = {
  SOJA: 128.5, MILHO: 62.3, BOI: 245.0, CAFE: 1420.0,
  ALGODAO: 148.0, TRIGO: 1350.0, DOLAR: 5.42, ACUCAR: 128.0,
};

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);
  private cache: { day: number; data: { quotes: Quote[]; updatedAt: string } } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async fetchUsdBrl(): Promise<{ price: number; observedAt: string } | null> {
    try {
      const json = await fetchJson<{ rates?: { BRL?: number }; time_last_update_unix?: number }>('https://open.er-api.com/v6/latest/USD', {
        timeoutMs: 6000, retries: 2,
      });
      const rate = json?.rates?.BRL;
      const timestamp = json?.time_last_update_unix;
      if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0 && typeof timestamp === 'number' && Number.isFinite(timestamp)) {
        const observedAt = new Date(timestamp * 1000);
        const age = Date.now() - observedAt.getTime();
        if (age >= -300000 && age < 48 * 60 * 60 * 1000) return { price: rate, observedAt: observedAt.toISOString() };
      }
    } catch { /* Never present an estimated fallback as a live observation. */ }
    return null;
  }

  async getQuotes(): Promise<{ quotes: Quote[]; updatedAt: string }> {
    const day = Math.floor(Date.now() / 3600000);
    if (this.cache && this.cache.day === day) return this.cache.data;
    const usd = await this.fetchUsdBrl();
    const quotes: Quote[] = BASE_QUOTES.map((q) => ({
      ...q,
      price: q.symbol === 'DOLAR' && usd ? usd.price : BASE_PRICE[q.symbol],
      // No invented price movements or artificial historical chart.
      changePct: null,
      history: [],
      estimated: !(q.symbol === 'DOLAR' && usd),
      observedAt: q.symbol === 'DOLAR' && usd ? usd.observedAt : null,
      source: q.symbol === 'DOLAR' && usd ? 'ExchangeRate-API (referência diária)' : 'Estimativa sem data de mercado; não usar para negociar',
    }));
    const data = { quotes, updatedAt: new Date().toISOString() };
    this.cache = { day, data };
    return data;
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    const found = (await this.getQuotes()).quotes.find(
      (q) => q.symbol === symbol.toUpperCase(),
    );
    return found ?? null;
  }

  // ─── Conversão área → valor da produção ───────────────────────────────────────

  private cropToSymbol(crop: string): string | null {
    const map: Record<string, string> = {
      SOJA: 'SOJA', MILHO: 'MILHO', CAFE: 'CAFE', ALGODAO: 'ALGODAO',
      CANA: 'ACUCAR', TRIGO: 'TRIGO', PECUARIA_CORTE: 'BOI',
    };
    return map[crop] ?? null;
  }

  /** Estima o valor da produção dos talhões do usuário a preço de mercado. */
  async getProductionValue(userId: string) {
    const plots = await this.prisma.plot.findMany({
      where: { deletedAt: null, farm: { userId, deletedAt: null } },
      select: { name: true, crop: true, areaHa: true, expectedYield: true, farm: { select: { name: true } } },
    });
    const quotes = (await this.getQuotes()).quotes;
    const priceOf = (sym: string) => quotes.find((q) => q.symbol === sym)?.price ?? 0;

    let totalValue = 0;
    const items = plots.map((p) => {
      const symbol = this.cropToSymbol(p.crop);
      const yieldPerHa = Number(p.expectedYield ?? 0);
      const estProduction = yieldPerHa * Number(p.areaHa); // sacas/arrobas totais
      const unitPrice = symbol ? priceOf(symbol) : 0;
      const value = estProduction * unitPrice;
      totalValue += value;
      return {
        plot: p.name,
        farm: p.farm.name,
        crop: p.crop,
        areaHa: Number(p.areaHa),
        estProduction: Number(estProduction.toFixed(0)),
        unitPrice,
        value: Number(value.toFixed(2)),
      };
    });
    return { totalValue: Number(totalValue.toFixed(2)), items };
  }

  // ─── Alertas de preço ─────────────────────────────────────────────────────────

  async createAlert(userId: string, dto: { symbol: string; direction: string; target: number }) {
    if (typeof dto.symbol !== 'string' || !['ABOVE', 'BELOW'].includes(dto.direction) || !Number.isFinite(dto.target) || dto.target <= 0) {
      throw new BadRequestException('Informe produto, direção e preço-alvo válidos.');
    }
    const quote = await this.getQuote(dto.symbol);
    if (!quote || quote.estimated || !quote.observedAt) {
      throw new BadRequestException('Alertas exigem uma fonte de preços observados. Estimativas não geram alertas.');
    }
    return this.prisma.priceAlert.create({
      data: {
        userId,
        symbol: dto.symbol.toUpperCase(),
        direction: dto.direction === 'BELOW' ? 'BELOW' : 'ABOVE',
        target: dto.target,
      },
    });
  }

  async listAlerts(userId: string) {
    return this.prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAlert(id: string, userId: string) {
    await this.prisma.priceAlert.deleteMany({ where: { id, userId } });
    return { success: true };
  }

  /** Verifica os alertas de preço ativos e notifica quando atingidos (a cada hora). */
  @Cron(CronExpression.EVERY_HOUR)
  async checkPriceAlerts() {
    const alerts = await this.prisma.priceAlert.findMany({ where: { active: true } });
    if (alerts.length === 0) return;
    const quotes = (await this.getQuotes()).quotes;

    for (const alert of alerts) {
      const quote = quotes.find((q) => q.symbol === alert.symbol);
      if (!quote || quote.estimated || !quote.observedAt) continue;
      const target = Number(alert.target);
      const hit = alert.direction === 'ABOVE' ? quote.price >= target : quote.price <= target;
      if (!hit) continue;

      await this.prisma.priceAlert.update({
        where: { id: alert.id },
        data: { active: false, triggeredAt: new Date() },
      });
      this.notifications
        .notify({
          userId: alert.userId,
          type: 'QUOTES',
          title: `Alerta de preço: ${quote.name}`,
          message: `${quote.name} atingiu ${quote.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${alert.direction === 'ABOVE' ? 'acima' : 'abaixo'} de ${target.toFixed(2)}).`,
          link: '/dashboard/quotes',
        })
        .catch(() => null);
    }
  }
}
