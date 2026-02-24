'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';
import { CreditSimulator } from './CreditSimulator';
import { AgroBackground } from './AgroBackground';

// ─── Inline SVGs ──────────────────────────────────────────────────────────────

function ArrowSVG() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="ml-2 h-5 w-5" aria-hidden="true">
      <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendSVG() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-brand-500 mb-2" aria-hidden="true">
      <polyline points="2,18 8,12 13,17 22,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16,6 22,6 22,13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldSVG() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-brand-500 mb-2" aria-hidden="true">
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.5C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2.5 2.5L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ZapSVG({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockSVG() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-brand-500 mb-2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <polyline points="12,7 12,12 15,15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-0 sm:pt-40">
      {/* ── Animated Agro Background ── */}
      <AgroBackground className="absolute inset-0 h-full w-full text-brand-600/10 dark:text-brand-400/10" />

      {/* Radial glows */}
      <div className="pointer-events-none absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[700px] h-[700px] bg-brand-500/8 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-agro-gold/8 rounded-full blur-3xl" />

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #16a34a 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/20"
          >
            <ZapSVG />
            Marketplace de Crédito Agro #1 do Brasil
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl"
          >
            Crédito certo para o{' '}
            <span className="bg-gradient-to-r from-brand-500 to-agro-gold bg-clip-text text-transparent">
              agro crescer
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400 sm:text-xl"
          >
            Conectamos produtores rurais e empresas do agronegócio a bancos,
            cooperativas, FIDCs, securitizadoras e o mercado de capitais.
            Do pequeno ao grande produtor.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="btn-primary text-base px-8 py-4 flex items-center shadow-lg shadow-brand-600/30 hover:shadow-xl hover:shadow-brand-600/40 hover:-translate-y-0.5 transition-all"
            >
              Buscar Crédito
              <ArrowSVG />
            </Link>
            <Link
              href="/register?plan=CORPORATE"
              className="group inline-flex items-center justify-center rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm px-8 py-4 text-base font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:border-slate-400 dark:hover:border-slate-500 hover:-translate-y-0.5 hover:shadow-md"
            >
              Oferecer Crédito
              <ArrowSVG />
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-5 text-xs text-gray-400 dark:text-gray-500"
          >
            Instituições financeiras entram{' '}
            <span className="font-semibold text-emerald-500">gratuitamente</span>
            {' '}· PIX, cartão ou boleto via Asaas
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8"
          >
            {[
              { icon: <TrendSVG />, label: 'Volume transacionado', prefix: 'R$ ', end: 500, suffix: 'M+' },
              { icon: <ShieldSVG />, label: 'Parceiros financeiros', end: 50, suffix: '+' },
              { icon: <ClockSVG />, label: 'Tempo médio de aprovação', end: 48, suffix: 'h' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                {stat.icon}
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter
                    end={stat.end}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    duration={2000}
                  />
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Credit Simulator */}
          <CreditSimulator />
        </div>
      </div>
    </section>
  );
}

