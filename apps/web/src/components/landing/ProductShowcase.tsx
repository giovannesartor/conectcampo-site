'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, LayoutDashboard, GitCompareArrows, FolderLock, Satellite, DollarSign, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: LayoutDashboard, title: 'Painel unificado', desc: 'Score, propostas, operações e documentos num só lugar.' },
  { icon: GitCompareArrows, title: 'Comparador de propostas', desc: 'Compare taxas e prazos lado a lado e escolha a melhor.' },
  { icon: FolderLock, title: 'Data room seguro', desc: 'Controle de acesso granular por instituição financeira.' },
];

const MODULES = [
  { icon: Satellite, label: 'Satélite NDVI', desc: 'Saúde da lavoura' },
  { icon: DollarSign, label: 'Cotações', desc: 'Soja, milho, boi' },
  { icon: ShieldCheck, label: 'Marketplace', desc: 'Pagamento em custódia' },
];

export function ProductShowcase() {
  return (
    <section className="relative overflow-hidden py-24 bg-white dark:bg-dark-bg">
      {/* Subtle contour lines only — no mesh-glow */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04] contour-pattern" />
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
              Toda sua operação em um só lugar
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-lg">
              Dashboards por perfil — produtor, empresa, cooperativa e instituição financeira.
              Crédito, satélite, clima, cotações e marketplace integrados.
            </p>

            <div className="mt-8 space-y-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-warm-100 dark:bg-warm-900/20 text-brand-600 dark:text-brand-400">
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

          {/* Device mockup — cleaner, simplified */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-lg">
              {/* window bar */}
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border bg-gray-50/80 dark:bg-dark-bg/60 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="ml-3 text-xs font-medium text-gray-400">app.conectcampo.digital</span>
              </div>
              {/* body */}
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Operações ativas', value: '12', sub: 'Em andamento' },
                    { label: 'Score', value: '742', sub: 'Excelente' },
                    { label: 'Propostas', value: 'R$8,4M', sub: 'Em análise' },
                  ].map((k) => (
                    <div key={k.label} className="rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/70 dark:bg-dark-bg/60 p-3">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{k.label}</p>
                      <p className="mt-1 text-xl font-extrabold text-gray-900 dark:text-white leading-none">{k.value}</p>
                      <p className="mt-1 text-[11px] font-medium text-brand-600 dark:text-brand-400">{k.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Modules */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {MODULES.map((m) => (
                    <div key={m.label} className="rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/70 dark:bg-dark-bg/60 p-3">
                      <m.icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                      <p className="mt-2 text-xs font-semibold text-gray-900 dark:text-white">{m.label}</p>
                      <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{m.desc}</p>
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
