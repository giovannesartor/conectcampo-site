'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';
import { CreditSimulator } from './CreditSimulator';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-pattern opacity-5 dark:opacity-10" />
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-agro-gold/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/20"
          >
            <Zap className="h-4 w-4" />
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
            <Link href="/register" className="btn-primary text-base px-8 py-4">
              Solicitar Crédito
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="#como-funciona" className="btn-secondary text-base px-8 py-4">
              Como Funciona
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8"
          >
            {[
              { icon: TrendingUp, label: 'Volume transacionado', prefix: 'R$ ', end: 500, suffix: 'M+' },
              { icon: Shield, label: 'Parceiros financeiros', end: 50, suffix: '+' },
              { icon: Zap, label: 'Tempo médio de aprovação', end: 48, suffix: 'h' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <stat.icon className="h-8 w-8 text-brand-500 mb-2" />
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
