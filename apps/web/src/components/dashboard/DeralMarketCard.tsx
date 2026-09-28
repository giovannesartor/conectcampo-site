'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Sprout } from 'lucide-react';
import { api } from '@/lib/api';

interface Market {
  prices: { symbol: string; name: string; price: number; observedOn: string; unit: string }[];
  source: string;
  sourceUrl: string;
  stale: boolean;
}

export function DeralMarketCard() {
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api.get<Market>('/widgets/market').then(({ data }) => { if (active) setMarket(data); })
      .catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const sourceUrl = market?.sourceUrl?.startsWith('https://www.agricultura.pr.gov.br/')
    ? market.sourceUrl : 'https://www.agricultura.pr.gov.br/Cotacao-Diaria-SIMA';
  return (
    <section className="card min-w-0" aria-label="Cotações oficiais do Paraná">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white"><Sprout className="h-5 w-5 shrink-0 text-emerald-600" /> Mercado de grãos</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Paraná · média estadual · referência diária DERAL/SEAB-PR</p>
        </div>
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">Ver fonte <ExternalLink className="h-3.5 w-3.5" /></a>
      </div>
      {loading ? <p role="status" className="mt-4 text-sm text-gray-500">Consultando a referência publicada…</p> : market?.prices?.length ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {market.prices.map(price => (
            <div key={price.symbol} className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{price.name}</p>
              <p className="mt-1 break-words text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{price.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Saca de 60 kg · {price.observedOn.split('-').reverse().join('/')}</p>
            </div>
          ))}
        </div>
      ) : <p className="mt-4 text-sm text-gray-500">A fonte está indisponível no momento. Nenhum preço estimado será exibido.</p>}
      {market?.stale && !!market.prices.length && <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">Última referência disponível; confira a data antes de utilizar.</p>}
      <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">Intenção de compra dos atacadistas paranaenses. Não representa preço nacional, oferta de negociação ou cotação em tempo real. Esta é a mesma fonte do widget do iPhone.</p>
    </section>
  );
}
