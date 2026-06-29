'use client';

import { Landmark, Users2, Layers, FileText, Sprout, Clock, ShieldCheck, Network } from 'lucide-react';

/**
 * Faixa de confiança + métricas.
 * Observação: os números abaixo são posicionamento/ilustrativos — substituir por
 * métricas reais (GMV intermediado, operações fechadas, parceiros ativos) assim
 * que houver tração.
 */

const PARTNERS = [
  { icon: Landmark, label: 'Bancos' },
  { icon: Users2, label: 'Cooperativas' },
  { icon: Layers, label: 'FIDCs' },
  { icon: FileText, label: 'Securitizadoras' },
  { icon: Sprout, label: 'FIAGROs' },
];

const METRICS = [
  { icon: Clock, value: '48h', label: 'Pré-análise média' },
  { icon: Network, value: 'Centenas', label: 'de instituições no match' },
  { icon: Layers, value: '4 faixas', label: 'do pequeno ao agroindustrial' },
  { icon: ShieldCheck, value: '100%', label: 'digital, da CPR ao crédito' },
];

export function SocialProof() {
  return (
    <section className="border-y border-gray-200 dark:border-dark-border bg-gray-50/60 dark:bg-dark-card/40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        {/* Trust strip */}
        <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
          Conectando produtores às principais fontes de crédito do agro
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {PARTNERS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="reveal inline-flex items-center gap-2 text-gray-500 dark:text-gray-400"
            >
              <Icon className="h-5 w-5 text-brand-600 dark:text-brand-500" aria-hidden="true" />
              <span className="text-sm font-bold tracking-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* Metrics band */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {METRICS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="reveal card card-hover flex flex-col items-center text-center"
            >
              <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {value}
              </span>
              <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
