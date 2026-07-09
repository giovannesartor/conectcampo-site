'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, LayoutDashboard, GitCompareArrows, FolderLock, TrendingUp, ArrowUpRight, Satellite, DollarSign, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: LayoutDashboard, title: 'KPIs em tempo real', desc: 'Score, propostas, operações e documentos num só painel.' },
  { icon: GitCompareArrows, title: 'Comparador de propostas', desc: 'Compare taxas e prazos lado a lado e escolha a melhor.' },
  { icon: FolderLock, title: 'Data room seguro', desc: 'Controle de acesso granular (RBAC) por instituição.' },
];

function Bars() {
  const heights = [42, 64, 52, 80, 68, 92, 76];
  return (
    <div className="flex h-28 items-end gap-1.5 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/70 dark:bg-dark-bg/60 p-3">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md bg-gradient-to-t from-brand-700 to-brand-400"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function ProductShowcase() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 mesh-glow opacity-70" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
              Painel de controle
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white [text-wrap:balance]">
              Seu painel de comando do agro
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-lg">
              Dashboards por perfil — produtor, empresa, cooperativa e instituição financeira.
              Crédito, satélite, clima, cotações e marketplace integrados num único lugar.
            </p>

            <div className="mt-8 space-y-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/register" className="btn-primary mt-9 inline-flex">
              Explorar a plataforma
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>

          {/* Device mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-brand-500/15 to-agro-gold/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-2xl shadow-brand-900/15">
              {/* window bar */}
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border bg-gray-50/80 dark:bg-dark-bg/60 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="ml-3 text-xs font-medium text-gray-400">app.conectcampo.digital/dashboard</span>
              </div>
              {/* body */}
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Operações ativas', value: '12', delta: '+3' },
                    { label: 'Score', value: '742', delta: '+18 pts' },
                    { label: 'Propostas', value: 'R$ 8,4M', delta: '+24%' },
                  ].map((k) => (
                    <div key={k.label} className="rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/70 dark:bg-dark-bg/60 p-3">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{k.label}</p>
                      <p className="mt-1 text-xl font-extrabold text-gray-900 dark:text-white leading-none">{k.value}</p>
                      <p className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                        <ArrowUpRight className="h-3 w-3" /> {k.delta}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Bars />
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/70 dark:bg-dark-bg/60 p-3 flex flex-col justify-center">
                    <TrendingUp className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Portfólio</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Aprovadas, em análise e match</p>
                  </div>
                </div>

                {/* Módulos da plataforma */}
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    { icon: Satellite, label: 'Satélite NDVI', value: 'Vigor 0,78' },
                    { icon: DollarSign, label: 'Cotações', value: 'Soja R$128' },
                    { icon: ShieldCheck, label: 'Marketplace', value: 'Custódia' },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/70 dark:bg-dark-bg/60 p-2.5">
                      <m.icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      <p className="mt-1.5 text-[11px] font-semibold text-gray-900 dark:text-white leading-none">{m.value}</p>
                      <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
