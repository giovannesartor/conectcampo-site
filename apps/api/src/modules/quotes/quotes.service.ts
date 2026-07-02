import { Injectable } from '@nestjs/common';

export interface Quote {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  changePct: number;
  history: number[];
  source: string;
}

// Preços de referência (base) — atualizados por variação diária determinística.
const BASE_QUOTES: Omit<Quote, 'price' | 'changePct' | 'history'>[] = [
  { symbol: 'SOJA', name: 'Soja', unit: 'R$/saca 60kg', source: 'CEPEA/ESALQ' },
  { symbol: 'MILHO', name: 'Milho', unit: 'R$/saca 60kg', source: 'CEPEA/ESALQ' },
  { symbol: 'BOI', name: 'Boi Gordo', unit: 'R$/arroba', source: 'CEPEA/B3' },
  { symbol: 'CAFE', name: 'Café Arábica', unit: 'R$/saca 60kg', source: 'CEPEA/ESALQ' },
  { symbol: 'ALGODAO', name: 'Algodão', unit: 'R$/@ pluma', source: 'CEPEA/ESALQ' },
  { symbol: 'TRIGO', name: 'Trigo', unit: 'R$/ton', source: 'CEPEA/ESALQ' },
  { symbol: 'DOLAR', name: 'Dólar Comercial', unit: 'R$', source: 'B3' },
  { symbol: 'ACUCAR', name: 'Açúcar Cristal', unit: 'R$/saca 50kg', source: 'CEPEA/ESALQ' },
];

const BASE_PRICE: Record<string, number> = {
  SOJA: 128.5, MILHO: 62.3, BOI: 245.0, CAFE: 1420.0,
  ALGODAO: 148.0, TRIGO: 1350.0, DOLAR: 5.42, ACUCAR: 128.0,
};

@Injectable()
export class QuotesService {
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

  getQuotes(): { quotes: Quote[]; updatedAt: string } {
    const quotes: Quote[] = BASE_QUOTES.map((q) => {
      const price = this.priceFor(q.symbol, 0);
      const prev = this.priceFor(q.symbol, 1);
      const changePct = Number((((price - prev) / prev) * 100).toFixed(2));
      const history: number[] = [];
      for (let d = 13; d >= 0; d--) history.push(this.priceFor(q.symbol, d));
      return { ...q, price, changePct, history };
    });
    return { quotes, updatedAt: new Date().toISOString() };
  }

  getQuote(symbol: string): Quote | null {
    const found = this.getQuotes().quotes.find(
      (q) => q.symbol === symbol.toUpperCase(),
    );
    return found ?? null;
  }
}
