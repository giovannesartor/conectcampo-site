'use client';

import { useState } from 'react';
import { Wheat, ExternalLink } from 'lucide-react';

const markets = { soja: { id: 127, label: 'Soja' }, milho: { id: 130, label: 'Milho' } };

/** Official publisher embed, isolated from app cookies, DOM and credentials. */
export function MarketWidget() {
  const [market, setMarket] = useState<keyof typeof markets>('soja');
  const [enabled, setEnabled] = useState(false);
  const current = markets[market];
  const url = `https://www.noticiasagricolas.com.br/widgets/cotacoes?id=${current.id}&fonte=Arial%2C%20Helvetica%2C%20sans-serif&tamanho=10pt&largura=100%25&cortexto=333333&corcabecalho=EAF5ED&corlinha=F7FAF8&imagem=true&output=js`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src https://www.noticiasagricolas.com.br; style-src 'unsafe-inline'; img-src https://www.noticiasagricolas.com.br https://images.noticiasagricolas.com.br"><style>body{margin:0;font:14px Arial,sans-serif;background:white}table{max-width:100%;width:100%;table-layout:fixed;overflow-wrap:anywhere}td,th{padding:8px 4px!important}img{max-width:100%;height:auto}</style></head><body><script src="${url}"></script></body></html>`;
  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Wheat className="h-4 w-4 text-brand-600" /> Mercado de grãos</h3>
        <div className="flex gap-1" aria-label="Produto">
          {(Object.keys(markets) as (keyof typeof markets)[]).map((key) => <button type="button" key={key} aria-pressed={market === key} onClick={() => setMarket(key)} className={`min-h-11 rounded-xl px-3 text-sm font-semibold ${market === key ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-200' : 'text-gray-500 dark:text-gray-400'}`}>{markets[key].label}</button>)}
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Preços por praça, em R$/saca de 60 kg. Confira a data de fechamento no rodapé da tabela; não são preços em tempo real.</p>
      {enabled ? <iframe key={market} title={`Cotações de ${current.label} — Notícias Agrícolas`} srcDoc={html} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" className="mt-4 h-80 w-full rounded-xl border border-gray-200 bg-white" /> : (
        <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-900/60">
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">Consulte as cotações publicadas pelo Notícias Agrícolas, com fonte e fechamento preservados.</p>
          <button type="button" onClick={() => setEnabled(true)} className="btn-secondary mt-3 w-full">Carregar cotações</button>
          <p className="mt-2 text-xs leading-5 text-gray-500">Ao carregar, seu navegador se conecta ao provedor externo. Nenhum dado da sua conta é enviado pelo ConectCampo.</p>
        </div>
      )}
      <a href="https://www.noticiasagricolas.com.br/cotacoes/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300">Fonte: Notícias Agrícolas · abrir no site <ExternalLink className="h-3.5 w-3.5" /></a>
      {enabled && <p className="text-xs leading-5 text-gray-500">Se a tabela não carregar, consulte o site da fonte. Use a rolagem dentro da tabela para ver todas as praças e o fechamento.</p>}
    </div>
  );
}
