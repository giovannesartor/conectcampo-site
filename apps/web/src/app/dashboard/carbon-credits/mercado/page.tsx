'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe, ChevronRight, TrendingUp, Info, ExternalLink, Leaf } from 'lucide-react';
import { api } from '@/lib/api';

interface PriceEntry {
  standard: string;
  type: string;
  priceUSD: number;
  priceBRL: number;
  projects?: number;
}

interface MarketData {
  updatedAt: string;
  note: string;
  source?: string;
  usdBrl?: number;
  prices: PriceEntry[];
}

const MARKET_INFO = [
  {
    title: 'Mercado Voluntário vs. Regulatório',
    content: 'O Brasil ainda não possui um mercado regulatório de carbono em plena operação. O mercado voluntário (VCM) permite que empresas comprem créditos para compensar emissões voluntariamente. Com o avanço do SBCE (Sistema Brasileiro de Comércio de Emissões), o mercado regulatório deve ser implementado nos próximos anos.',
  },
  {
    title: 'Preço dos Créditos',
    content: 'Os preços variam conforme padrão, tipo de projeto, localização e vintage. Projetos com co-benefícios socioambientais (REDD+, comunidades indígenas) tendem a ter prêmio sobre os preços de referência.',
  },
  {
    title: 'Compradores Típicos',
    content: 'Grandes empresas com metas net-zero (ESG), exportadores sujeitos ao CBAM europeu, empresas que precisam compensar emissões residuais e fundo de investimento em ativos verdes.',
  },
];

const RESOURCES = [
  { label: 'Verra – Verified Carbon Standard', url: 'https://verra.org/programs/verified-carbon-standard/' },
  { label: 'Gold Standard Registry', url: 'https://registry.goldstandard.org/' },
  { label: 'Protocolo Cerrado', url: 'https://www.protocolocerrado.com.br/' },
  { label: 'REDD+ Brasil – MCTI', url: 'https://redd.mma.gov.br/' },
  { label: 'Programa ABC+ – MAPA', url: 'https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/recuperacao-de-areas-degradadas/programa-abc' },
];

export default function MercadoCarbonoPage() {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/carbon-credits/market-prices')
      .then((r) => setMarket(r.data))
      .catch(() => setMarket(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/carbon-credits" className="hover:text-emerald-600">Carbono</Link>
          <ChevronRight className="h-4 w-4" />
          <span>Mercado</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mercado de Carbono</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Referências de preço, padrões e recursos para comercialização de créditos.
        </p>
      </div>

      {/* Aviso */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Dados Ilustrativos</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Os preços abaixo são referências de mercado para fins de planejamento. Para negociações reais, consulte registros oficiais (Verra, Gold Standard) e corretoras especializadas.
          </p>
        </div>
      </div>

      {/* Tabela de Preços */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Preços de Referência por Padrão</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Padrão</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Tipo de Projeto</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">USD/tCO₂e</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">BRL/tCO₂e</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                {(market?.prices ?? []).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">{row.standard.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{row.type}</td>
                    <td className="py-3 px-3 text-right font-medium text-emerald-600">
                      $ {row.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white">
                      R$ {row.priceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {market?.updatedAt && (
          <p className="text-xs text-gray-400 mt-3">
            {market.source ? `Fonte: ${market.source} · ` : ''}
            Atualizado em {new Date(market.updatedAt).toLocaleDateString('pt-BR')}
            {market.usdBrl ? ` · câmbio USD→BRL ${market.usdBrl.toFixed(2)}` : ''}
          </p>
        )}
      </div>

      {/* Calculadora rápida */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Leaf className="h-5 w-5 text-emerald-600" />
          Calculadora de Receita
        </h2>
        <QuickCalc marketPrices={market?.prices ?? []} />
      </div>

      {/* Info boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MARKET_INFO.map((info) => (
          <div key={info.title} className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{info.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{info.content}</p>
          </div>
        ))}
      </div>

      {/* Recursos externos */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recursos e Registros Oficiais</h2>
        <div className="space-y-2">
          {RESOURCES.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">{r.label}</span>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickCalc({ marketPrices }: { marketPrices: PriceEntry[] }) {
  const [tons, setTons] = useState('');
  const [price, setPrice] = useState('');

  const revenue = tons && price ? Number(tons) * Number(price) : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Créditos (tCO₂e)</label>
          <input
            type="number" min="0" step="0.01"
            value={tons}
            onChange={(e) => setTons(e.target.value)}
            className="input text-sm mt-1"
            placeholder="Ex: 1000"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Preço (R$/tCO₂e)</label>
          <div className="flex gap-2 mt-1">
            <input
              type="number" min="0" step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input text-sm flex-1"
              placeholder="Ex: 60"
            />
            {marketPrices.length > 0 && (
              <select
                onChange={(e) => setPrice(e.target.value)}
                className="input text-xs w-auto"
                defaultValue=""
              >
                <option value="" disabled>Ref.</option>
                {marketPrices.map((p, i) => (
                  <option key={i} value={p.priceBRL}>{p.standard.slice(0, 10)} R${p.priceBRL}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
      {revenue !== null && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-center">
          <p className="text-xs text-emerald-600">Receita Estimada</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-emerald-500 mt-1">{tons} tCO₂e × R$ {price}/crédito</p>
        </div>
      )}
    </div>
  );
}
