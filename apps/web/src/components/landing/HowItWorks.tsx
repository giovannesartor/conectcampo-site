'use client';

import { UserPlus, FileText, BarChart3, Handshake, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: UserPlus,
    title: 'Crie sua conta',
    description: 'Cadastre-se gratuitamente e defina o perfil da sua propriedade ou empresa.',
  },
  {
    icon: FileText,
    title: 'Envie documentos',
    description: 'Faça upload dos documentos no data room inteligente. Seguro e organizado.',
  },
  {
    icon: BarChart3,
    title: 'Score automático',
    description: 'Nosso motor analisa receita, garantias, fluxo de caixa e gera seu Risk Score.',
  },
  {
    icon: Handshake,
    title: 'Match com parceiros',
    description: 'O algoritmo cruza seu perfil com bancos, FIDCs e securitizadoras compatíveis.',
  },
  {
    icon: CheckCircle2,
    title: 'Receba propostas',
    description: 'Compare condições, taxas e prazos. Aceite a melhor oferta diretamente na plataforma.',
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 bg-gray-50 dark:bg-dark-card/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title">Como funciona</h2>
          <p className="section-subtitle">
            Em 5 passos simples, conectamos você ao crédito ideal para sua operação.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-8 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-brand-500/20 via-brand-500 to-brand-500/20" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/25">
                <step.icon className="h-8 w-8" />
              </div>
              <span className="mt-2 text-xs font-bold text-brand-600 dark:text-brand-400">
                Passo {index + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {step.description}
              </p>

              {index < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-4 top-12 h-5 w-5 text-brand-500 -translate-y-1/2" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
