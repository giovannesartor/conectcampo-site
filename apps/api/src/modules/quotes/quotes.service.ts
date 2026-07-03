import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface Quote {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  changePct: number;
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

  private daySeed(symbol: string, offset = 0): () => number {
    const day = Math.floor(Date.now() / 86400000) - offset;
    let seed = day;
    for (const ch of symbol) seed = (seed * 31 + ch.charCodeAt(0)) % 1000000;
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };
  }

  private priceFor(symbol: string, dayOffset = 0): number {
    const base = BASE_PRICE[symbol] ?? 100;
    const rand = this.daySeed(symbol, dayOffset);
    // Variação diária de ±3%
    const variation = (rand() - 0.5) * 0.06;
    return Number((base * (1 + variation)).toFixed(2));
  }

  private async fetchUsdBrl(): Promise<number | null> {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (res.ok) {
        const json = (await res.json()) as { rates?: { BRL?: number } };
        const rate = json?.rates?.BRL;
        if (typeof rate === 'number' && rate > 0) return rate;
      }
    } catch {
      /* usa referência */
    }
    return null;
  }

  async getQuotes(): Promise<{ quotes: Quote[]; updatedAt: string }> {
    // Cache (as cotações são estáveis por dia). Trocável por Redis se necessário.
    const day = Math.floor(Date.now() / 86400000);
    if (this.cache && this.cache.day === day) return this.cache.data;

    const usdBrl = await this.fetchUsdBrl();

    const quotes: Quote[] = BASE_QUOTES.map((q) => {
      let price = this.priceFor(q.symbol, 0);
      const prev = this.priceFor(q.symbol, 1);
      const history: number[] = [];
      for (let d = 13; d >= 0; d--) history.push(this.priceFor(q.symbol, d));

      // Dólar em tempo real (quando disponível)
      if (q.symbol === 'DOLAR' && usdBrl) {
        price = Number(usdBrl.toFixed(2));
        history[history.length - 1] = price;
      }
      const changePct = Number((((price - prev) / prev) * 100).toFixed(2));
      return { ...q, price, changePct, history };
    });
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
      if (!quote) continue;
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
