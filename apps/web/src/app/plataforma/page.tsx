'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { PublicLayout } from '@/components/landing/PublicLayout';
import { PLATFORM_TOOLS } from '@/components/landing/Platform';

const JOURNEYS = [
  {
    title: 'Crédito e instrumentos',
    items: ['Operações e propostas', 'Score e analytics', 'CPR completa', 'Documentos inteligentes'],
  },
  {
    title: 'Produção e monitoramento',
    items: ['Fazendas e talhões', 'Satélite, clima e risco', 'Diário de safra', 'Crédito de carbono'],
  },
  {
    title: 'Financeiro e mercado',
    items: ['Fluxo de caixa e calendário', 'Cotações e alertas', 'Marketplace em custódia', 'Contratos e barter'],
  },
];

export default function PlataformaPage() {
  return (
    <PublicLayout>
      <section className="border-b border-warm-200 bg-warm-50 px-6 py-20 text-center dark:border-dark-border dark:bg-dark-card lg:px-8">
        <span className="section-kicker">Plataforma ConectCampo</span>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
          Uma jornada conectada, do campo à decisão de crédito
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-400">
          Conheça os módulos disponíveis e como eles organizam dados, documentos, produção,
          finanças e comercialização sem tirar de você o controle das decisões.
        </p>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_TOOLS.map(({ icon: Icon, title, desc, badge }) => (
              <article key={title} className="card flex min-h-[150px] gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-400">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-950 dark:text-white">{title}</h2>
                    {badge && <span className="rounded-full bg-agro-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase text-agro-gold">{badge}</span>}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-warm-50 px-6 py-20 dark:bg-dark-card lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {JOURNEYS.map((journey) => (
              <article key={journey.title} className="card">
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">{journey.title}</h2>
                <ul className="mt-5 space-y-3">
                  {journey.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-brand-600" /> {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/register" className="btn-primary">
              Começar agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
