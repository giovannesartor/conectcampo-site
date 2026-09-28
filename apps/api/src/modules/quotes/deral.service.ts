import { Injectable, Logger } from '@nestjs/common';
import { GrainPrice, parseSima } from './deral-reader';

const ORIGIN = 'https://www.agricultura.pr.gov.br';
const INDEX = `${ORIGIN}/Cotacao-Diaria-SIMA`;
@Injectable()
export class DeralService {
  private readonly logger = new Logger(DeralService.name);
  private cache: { prices: GrainPrice[]; sourceUrl: string; checkedAt: string } | null = null;
  private retryAfter = 0;
  private inFlight: Promise<void> | null = null;

  private async download(url: string) {
    const parsed = new URL(url);
    if (parsed.origin !== ORIGIN) throw new Error('Invalid source origin');
    const response = await fetch(url, { signal: AbortSignal.timeout(3000), redirect: 'error' });
    if (!response.ok || Number(response.headers.get('content-length') ?? 0) > 2_000_000 || !response.body) throw new Error('Source unavailable');
    const chunks: Uint8Array[] = []; let size = 0;
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.length; if (size > 2_000_000) throw new Error('Source too large');
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    return Buffer.concat(chunks);
  }

  private async refresh() {
    this.retryAfter = Date.now() + 15 * 60_000;
    try {
      const index = (await this.download(INDEX)).toString('utf8');
      const page = index.match(/href="(\/Pagina\/Cotacao-Diaria-SIMA-\d+)"/i)?.[1];
      if (!page) throw new Error('Missing source page');
      const detail = (await this.download(ORIGIN + page)).toString('utf8');
      const file = detail.match(/href="((?:https:\/\/www\.agricultura\.pr\.gov\.br)?\/sites\/default\/arquivos_restritos\/files\/documento\/[^"<>]+\/(\d{2}-\d{2}-\d{4})-impressao\.xlsx)"/i);
      if (!file) throw new Error('Missing daily spreadsheet');
      const url = new URL(file[1], ORIGIN).href;
      const prices = parseSima(await this.download(url), file[2]);
      const date = Date.parse(prices[0].observedOn + 'T12:00:00-03:00');
      if (!Number.isFinite(date) || date > Date.now() + 86400000 || date < Date.now() - 14 * 86400000) throw new Error('Invalid observation date');
      this.cache = { prices, sourceUrl: ORIGIN + page, checkedAt: new Date().toISOString() };
      this.retryAfter = Date.now() + 60 * 60_000;
    } catch { this.logger.warn('Cotação DERAL indisponível; nenhum valor estimado foi gerado.'); }
  }

  async getMarket() {
    if (!this.inFlight && Date.now() >= this.retryAfter) this.inFlight = this.refresh().finally(() => { this.inFlight = null; });
    // Serve published cached data immediately while refreshing in the background.
    // A cold start performs at most three bounded (3 s) downloads.
    const hasUsableCache = this.cache && Date.now() - Date.parse(this.cache.prices[0].observedOn + 'T12:00:00-03:00') < 7 * 86400000;
    if (!hasUsableCache && this.inFlight) await this.inFlight;
    const recent = this.cache && Date.now() - Date.parse(this.cache.prices[0].observedOn + 'T12:00:00-03:00') < 7 * 86400000;
    return {
      prices: recent ? this.cache!.prices : [],
      source: 'DERAL/SEAB-PR', sourceUrl: this.cache?.sourceUrl ?? INDEX,
      checkedAt: this.cache?.checkedAt ?? null,
      stale: !recent || Date.now() - Date.parse(this.cache!.checkedAt) > 3 * 3600000
        || Date.now() - Date.parse(this.cache!.prices[0].observedOn + 'T12:00:00-03:00') > 4 * 86400000,
      methodology: 'Intenção de compra dos atacadistas paranaenses. Média estadual publicada; não representa preço nacional ou oferta de negociação.',
    };
  }
}
