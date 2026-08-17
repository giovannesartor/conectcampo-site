'use client';

import { Landmark, Users2, Layers, FileText, Sprout, Clock, ShieldCheck, Network } from 'lucide-react';

/** Capacidades e tipos de fonte atendidos, sem métricas comerciais inventadas. */

const PARTNERS = [
  { icon: Landmark, label: 'Bancos' },
  { icon: Users2, label: 'Cooperativas' },
  { icon: Layers, label: 'FIDCs' },
  { icon: FileText, label: 'Securitizadoras' },
  { icon: Sprout, label: 'FIAGROs' },
];

const METRICS = [
  { icon: Clock, value: 'Online', label: 'envio e acompanhamento' },
  { icon: Network, value: '5', label: 'tipos de fonte mapeados' },
  { icon: Layers, value: 'CPR', label: 'emissão e assinatura digital' },
  { icon: ShieldCheck, value: 'LGPD', label: 'consentimento e controle' },
];

export function SocialProof() {
  return (
    <section className="border-y border-gray-200 dark:border-dark-border bg-warm-100/50 dark:bg-dark-card/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        {/* Trust strip */}
        <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
          Estrutura preparada para diferentes fontes de crédito do agro
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
              <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-warm-100 dark:bg-warm-900/20 text-brand-600 dark:text-brand-400">
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
