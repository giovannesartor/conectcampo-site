'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Clock, Network, ShieldCheck, Star } from 'lucide-react';
import { CreditSimulator } from './CreditSimulator';

const HIGHLIGHTS = [
  { icon: Clock, value: '48h', label: 'Pré-análise' },
  { icon: Network, value: '+50', label: 'Financiadores' },
  { icon: ShieldCheck, value: '100%', label: 'Digital' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 bg-gradient-to-b from-terra-900 via-terra-800 to-terra-700">
      {/* Crop rows — sulcos de plantio como fundo */}
      <div className="pointer-events-none absolute inset-0 crop-rows-dark opacity-30" />

      {/* Soil grain texture */}
      <div className="soil-grain absolute inset-0" />

      {/* Gradiente de luz vindo do topo */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-terra-50/8 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* ── Left: copy ── */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-1.5 text-sm font-medium text-white/90"
            >
              <Zap className="h-3.5 w-3.5 text-palha-400" />
              Pré-análise em 48h · 7 dias grátis
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl [text-wrap:balance] font-serif"
            >
              O crédito que o campo{' '}
              <span className="text-palha-400">merece</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-6 text-lg leading-8 text-terra-200 sm:text-xl max-w-xl mx-auto lg:mx-0 [text-wrap:pretty]"
            >
              Conectamos sua operação a bancos, cooperativas, FIDCs, securitizadoras e ao
              mercado de capitais — com gestão da fazenda, satélite, cotações e marketplace na mesma plataforma.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
            >
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-palha-500 px-7 py-3.5 text-base font-semibold text-terra-900 transition-all hover:bg-palha-400 shadow-md shadow-black/20">
                Simular meu crédito
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/register?plan=CORPORATE"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 hover:border-white/30"
              >
                Sou instituição financeira
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="mt-5 flex items-center justify-center lg:justify-start gap-2 text-xs text-terra-200"
            >
              <span className="inline-flex items-center gap-0.5 text-palha-500">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </span>
              Comece com <span className="font-semibold text-palha-400">7 dias grátis</span> · PIX, cartão ou boleto
            </motion.div>

            {/* Mini highlights */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0"
            >
              {HIGHLIGHTS.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-4 text-center"
                >
                  <Icon className="h-5 w-5 mx-auto text-palha-400" />
                  <p className="mt-2 text-xl font-extrabold text-white leading-none">{value}</p>
                  <p className="mt-1 text-[11px] text-terra-200 leading-tight">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: simulator ── */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
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
