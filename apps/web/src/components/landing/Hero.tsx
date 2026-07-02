'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Clock, Network, ShieldCheck, Star } from 'lucide-react';
import { CreditSimulator } from './CreditSimulator';
import { AgroBackground } from './AgroBackground';

const HIGHLIGHTS = [
  { icon: Clock, value: '48h', label: 'Pré-análise' },
  { icon: Network, value: 'Multi', label: 'Vários financiadores' },
  { icon: ShieldCheck, value: '100%', label: 'Digital' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 mesh-glow">
      {/* Animated agro background */}
      <AgroBackground className="absolute inset-0 h-full w-full text-brand-600/10 dark:text-brand-400/10" />

      {/* Radial glows */}
      <div className="pointer-events-none absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-[680px] h-[680px] bg-brand-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[520px] h-[520px] bg-agro-gold/10 rounded-full blur-3xl" />

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #008c3c 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* ── Left: copy ── */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400 ring-1 ring-brand-500/20"
            >
              <Zap className="h-3.5 w-3.5" />
              Marketplace de crédito agro multi-financiador
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl [text-wrap:balance]"
            >
              O crédito que o agro merece —{' '}
              <span className="text-gradient-brand">sem burocracia, sem balcão.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400 sm:text-xl max-w-xl mx-auto lg:mx-0 [text-wrap:pretty]"
            >
              Conectamos sua operação a bancos, cooperativas, FIDCs, securitizadoras e ao
              mercado de capitais — com gestão da fazenda, satélite, cotações e marketplace na mesma plataforma.
              Pré-análise em 48h, 100% digital.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm px-7 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-200 transition-all hover:border-brand-400 hover:-translate-y-0.5"
              >
                Sou instituição financeira
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="mt-5 flex items-center justify-center lg:justify-start gap-2 text-xs text-gray-500 dark:text-gray-400"
            >
              <span className="inline-flex items-center gap-0.5 text-agro-gold">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </span>
              Instituições financeiras entram <span className="font-semibold text-brand-600 dark:text-brand-400">gratuitamente</span> · PIX, cartão ou boleto
            </motion.div>

            {/* Mini highlights */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              className="mt-10 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0"
            >
              {HIGHLIGHTS.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white/60 dark:bg-dark-card/60 backdrop-blur-sm px-3 py-3 text-center"
                >
                  <Icon className="h-5 w-5 mx-auto text-brand-600 dark:text-brand-400" />
                  <p className="mt-1.5 text-lg font-extrabold text-gray-900 dark:text-white leading-none">{value}</p>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: floating simulator ── */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="relative"
          >
            {/* soft pedestal glow */}
            <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-500/15 to-agro-gold/10 blur-2xl" />
            <div className="relative">
              <CreditSimulator embedded />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
