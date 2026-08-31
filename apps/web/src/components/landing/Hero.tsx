'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Clock, Network, ShieldCheck } from 'lucide-react';
import { CreditSimulator } from './CreditSimulator';

const HIGHLIGHTS = [
  { icon: Clock, value: 'Online', label: 'envio e acompanhamento' },
  { icon: Network, value: 'Rede', label: 'fontes de crédito' },
  { icon: ShieldCheck, value: 'LGPD', label: 'consentimento e controle' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-warm-200/70 bg-warm-50 pb-20 pt-28 dark:border-dark-border dark:bg-dark-bg sm:pt-36">
      {/* Grain texture overlay */}
      <div className="grain-overlay absolute inset-0" />

      {/* Contour pattern — subtle agricultural reference */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05] contour-pattern" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* ── Left: copy ── */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-dark-card border border-warm-200 dark:border-dark-border px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400 shadow-sm"
            >
              <Zap className="h-3.5 w-3.5 text-agro-gold" />
              Pré-análise digital · 7 dias grátis
            </motion.div>

            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl [text-wrap:balance]"
            >
              Crédito rural com{' '}
              <span className="text-brand-600 dark:text-brand-400">menos burocracia</span>
              {' '}e{' '}
              <span className="text-agro-gold">mais clareza</span>.
            </motion.h1>

            <motion.p
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400 sm:text-xl max-w-xl mx-auto lg:mx-0 [text-wrap:pretty]"
            >
              Organize sua operação, documentos e garantias, acompanhe a análise e compare
              propostas de fontes de crédito compatíveis em um só lugar.
            </motion.p>

            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
            >
              <Link href="/register" className="btn-primary text-base px-7 py-3.5">
                Simular meu crédito
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/register?plan=CORPORATE"
                className="btn-secondary px-7 py-3.5 text-base"
              >
                Sou instituição financeira
              </Link>
            </motion.div>

            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="mt-5 flex items-center justify-center lg:justify-start gap-2 text-xs text-gray-500 dark:text-gray-400"
            >
              <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              Simulação sem compromisso · <span className="font-semibold text-brand-600 dark:text-brand-400">7 dias grátis</span>
            </motion.div>

            {/* Mini highlights */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0"
            >
              {HIGHLIGHTS.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-warm-200/90 bg-white px-3 py-4 text-center shadow-[var(--shadow-soft)] dark:border-dark-border dark:bg-dark-card"
                >
                  <Icon className="h-5 w-5 mx-auto text-brand-600 dark:text-brand-400" />
                  <p className="mt-2 text-xl font-extrabold text-gray-900 dark:text-white leading-none">{value}</p>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: simulator ── */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative">
              <CreditSimulator embedded />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
