'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

function SproutSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <ellipse cx="32" cy="52" rx="18" ry="4" fill="currentColor" opacity="0.15" />
      <path d="M32 52 Q31 38 32 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 36 Q18 28 20 16 Q20 16 32 26 Z" fill="currentColor" opacity="0.8" />
      <path d="M32 28 Q46 20 44 8 Q44 8 32 18 Z" fill="currentColor" opacity="0.6" />
      <circle cx="32" cy="18" r="3" fill="currentColor" />
      <path d="M16 52 Q32 49 48 52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function BankSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M8 22 L32 8 L56 22 Z" fill="currentColor" opacity="0.9" />
      <line x1="6" y1="22" x2="58" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {[16, 32, 48].map((x) => (
        <rect key={x} x={x - 3} y="24" width="6" height="22" rx="1.5" fill="currentColor" opacity="0.75" />
      ))}
      <rect x="8" y="46" width="48" height="5" rx="2" fill="currentColor" opacity="0.9" />
      <rect x="4" y="51" width="56" height="4" rx="2" fill="currentColor" opacity="0.5" />
      <circle cx="32" cy="14" r="2.5" fill="white" opacity="0.6" />
    </svg>
  );
}

function ArrowSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

export function AudienceSplit() {
  return (
    <section className="relative py-12 pb-20 bg-warm-50 dark:bg-dark-bg">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-8"
        >
          Para quem é o ConectCampo?
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Card: Borrower ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-8 lg:p-10 shadow-lg shadow-brand-900/20"
          >
            <div className="relative flex-1">
              <div className="flex items-start justify-between mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <SproutSVG className="h-8 w-8 text-white" />
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
                  Tomadores de crédito
                </span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                Preciso de{' '}
                <span className="text-agro-gold">crédito</span>{' '}
                para o meu negócio
              </h2>
              <p className="mt-3 text-brand-200/80 text-sm leading-relaxed">
                Produtor rural, empresa do agronegócio ou cooperativa. Conecte-se a dezenas de
                instituições e encontre as melhores condições do mercado.
              </p>

              <ul className="mt-6 space-y-3">
                {BORROWER_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-brand-200/80">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                      <CheckSVG className="h-3 w-3 text-agro-gold" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex gap-2 flex-wrap">
                {['Produtor Rural', 'Empresa Agro', 'Cooperativa'].map((tag) => (
                  <span key={tag} className="rounded-full bg-white/8 px-3 py-1 text-xs text-brand-200/70 ring-1 ring-white/8">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/#planos"
              className="relative mt-8 flex items-center justify-between rounded-xl bg-white px-6 py-4 font-semibold text-brand-700 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 group/btn"
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
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 p-8 lg:p-10 shadow-lg shadow-black/20"
          >
            <div className="relative flex-1">
              <div className="flex items-start justify-between mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <BankSVG className="h-8 w-8 text-white" />
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/25">
                  Acesso gratuito
                </span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                Quero{' '}
                <span className="text-slate-200">oferecer crédito</span>{' '}
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

              <div className="mt-5 flex gap-2 flex-wrap">
                {['Banco', 'FIDC', 'Securitizadora', 'FIAGRO'].map((tag) => (
                  <span key={tag} className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-400 ring-1 ring-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/register?plan=CORPORATE"
              className="relative mt-8 flex items-center justify-between rounded-xl bg-white/10 px-6 py-4 font-semibold text-white ring-1 ring-white/15 transition-all hover:bg-white/15 hover:-translate-y-0.5 group/btn"
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
