'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

// ─── SVG: Sprout / Borrower icon ─────────────────────────────────────────────

function SproutSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Soil */}
      <ellipse cx="32" cy="52" rx="18" ry="4" fill="currentColor" opacity="0.15" />
      {/* Stem */}
      <path d="M32 52 Q31 38 32 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left leaf */}
      <path
        d="M32 36 Q18 28 20 16 Q20 16 32 26 Z"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Right leaf */}
      <path
        d="M32 28 Q46 20 44 8 Q44 8 32 18 Z"
        fill="currentColor"
        opacity="0.6"
      />
      {/* Tip bud */}
      <circle cx="32" cy="18" r="3" fill="currentColor" />
      {/* Soil line */}
      <path d="M16 52 Q32 49 48 52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// ─── SVG: Bank / Lender icon ──────────────────────────────────────────────────

function BankSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Pediment roof */}
      <path d="M8 22 L32 8 L56 22 Z" fill="currentColor" opacity="0.9" />
      {/* Fronton line */}
      <line x1="6" y1="22" x2="58" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* 3 columns */}
      {[16, 32, 48].map((x) => (
        <rect key={x} x={x - 3} y="24" width="6" height="22" rx="1.5" fill="currentColor" opacity="0.75" />
      ))}
      {/* Base */}
      <rect x="8" y="46" width="48" height="5" rx="2" fill="currentColor" opacity="0.9" />
      {/* Bottom step */}
      <rect x="4" y="51" width="56" height="4" rx="2" fill="currentColor" opacity="0.5" />
      {/* Star / coin */}
      <circle cx="32" cy="14" r="2.5" fill="white" opacity="0.6" />
    </svg>
  );
}

// ─── Arrow SVG ────────────────────────────────────────────────────────────────

function ArrowSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Check SVG ────────────────────────────────────────────────────────────────

function CheckSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BORROWER_FEATURES = [
  'Matching inteligente com centenas de instituições',
  'Score ConectCampo exclusivo',
  'Gestão de documentos e operações',
  'Acompanhamento em tempo real',
];

const LENDER_FEATURES = [
  'Base de tomadores qualificados e verificados',
  'Filtros avançados de risco e perfil',
  'API completa de integração',
  'Dashboards de portfólio e compliance',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AudienceSplit() {
  return (
    <section className="relative py-8 pb-20 overflow-hidden">
      {/* Subtle divider at top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-200 dark:via-brand-800 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 dark:text-brand-400 mb-6"
        >
          Para quem é o ConectCampo?
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Card: Borrower ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="group relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 lg:p-10 shadow-2xl shadow-brand-900/30"
          >
            {/* Noise texture overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
            />
            {/* Glow orb */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl transition-transform duration-700 group-hover:scale-125" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-agro-gold/10 blur-2xl" />

            <div className="relative flex-1">
              {/* Icon + badge */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                  <SproutSVG className="h-8 w-8 text-white" />
                </div>
                <span className="rounded-full bg-agro-gold/20 px-3 py-1 text-xs font-semibold text-agro-gold ring-1 ring-agro-gold/30">
                  Tomadores de crédito
                </span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                Preciso de{' '}
                <span className="text-agro-gold">crédito</span>{' '}
                para o meu negócio
              </h2>
              <p className="mt-3 text-brand-100 text-sm leading-relaxed">
                Produtor rural, empresa do agronegócio ou cooperativa. Conecte-se a dezenas de
                instituições e encontre as melhores condições do mercado.
              </p>

              <ul className="mt-6 space-y-3">
                {BORROWER_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-brand-100">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
                      <CheckSVG className="h-3 w-3 text-white" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex gap-2 flex-wrap">
                {['Produtor Rural', 'Empresa Agro', 'Cooperativa'].map((tag) => (
                  <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-brand-100 ring-1 ring-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/#planos"
              className="relative mt-8 flex items-center justify-between rounded-2xl bg-white px-6 py-4 font-semibold text-brand-700 shadow-lg shadow-brand-900/20 transition-all hover:shadow-xl hover:shadow-brand-900/30 hover:-translate-y-0.5 group/btn"
            >
              <span>Ver planos e preços</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 transition-transform group-hover/btn:translate-x-1">
                <ArrowSVG className="h-4 w-4 text-white" />
              </span>
            </Link>
          </motion.div>

          {/* ── Card: Lender ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="group relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-900 dark:to-black p-8 lg:p-10 shadow-2xl shadow-black/40"
          >
            {/* Noise */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
            />
            {/* Glow */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-slate-500/10 blur-3xl transition-transform duration-700 group-hover:scale-125" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-brand-600/10 blur-2xl" />

            {/* Grid lines overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            <div className="relative flex-1">
              <div className="flex items-start justify-between mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15">
                  <BankSVG className="h-8 w-8 text-white" />
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                  Acesso gratuito
                </span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                Quero{' '}
                <span className="bg-gradient-to-r from-slate-200 to-white bg-clip-text text-transparent">
                  oferecer crédito
                </span>{' '}
                ao agronegócio
              </h2>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                Bancos, FIDCs, securitizadoras e FIAGROs. Acesse uma base de tomadores
                qualificados, verificados e com score detalhado — sem pagar nada.
              </p>

              <ul className="mt-6 space-y-3">
                {LENDER_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                      <CheckSVG className="h-3 w-3 text-emerald-400" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex gap-2 flex-wrap">
                {['Banco', 'FIDC', 'Securitizadora', 'FIAGRO'].map((tag) => (
                  <span key={tag} className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-400 ring-1 ring-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/register?plan=CORPORATE"
              className="relative mt-8 flex items-center justify-between rounded-2xl bg-white/10 px-6 py-4 font-semibold text-white backdrop-blur-sm ring-1 ring-white/15 transition-all hover:bg-white/15 hover:-translate-y-0.5 group/btn"
            >
              <span>Cadastre-se gratuitamente</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20 transition-transform group-hover/btn:translate-x-1">
                <ArrowSVG className="h-4 w-4 text-white" />
              </span>
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
