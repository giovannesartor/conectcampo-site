'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Start',
    price: 'Grátis',
    description: 'Para quem está começando a buscar crédito.',
    features: [
      '1 operação ativa',
      'Score básico',
      'Match com parceiros',
      'Data room simplificado',
      'Suporte por email',
    ],
    cta: 'Começar Grátis',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'R$ 299',
    period: '/mês',
    description: 'Para produtores com múltiplas operações.',
    features: [
      'Até 10 operações ativas',
      'Score avançado',
      'Match prioritário',
      'Data room completo',
      'Relatórios personalizados',
      'Suporte prioritário',
      'Versionamento de documentos',
    ],
    cta: 'Assinar Pro',
    highlighted: true,
  },
  {
    name: 'Corporate',
    price: 'R$ 999',
    period: '/mês',
    description: 'Para agroindústrias e grupos.',
    features: [
      'Operações ilimitadas',
      'Multi-CNPJ',
      'Data room avançado',
      'API de integração',
      'Relatórios customizados',
      'Gerente de conta dedicado',
      'SLA garantido',
      'Governança e auditoria',
    ],
    cta: 'Falar com Vendas',
    highlighted: false,
  },
];

export function Plans() {
  return (
    <section id="planos" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title">Planos que cabem na sua operação</h2>
          <p className="section-subtitle">
            Comece grátis e escale conforme sua necessidade. Além da assinatura, cobramos apenas uma comissão sobre operações fechadas.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`card relative ${
                plan.highlighted
                  ? 'ring-2 ring-brand-500 shadow-xl shadow-brand-500/10 scale-105'
                  : ''
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-bold text-white">
                  Mais Popular
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Check className="h-4 w-4 text-brand-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`mt-8 block w-full text-center ${
                  plan.highlighted ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
