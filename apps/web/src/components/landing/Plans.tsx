'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Plano Produtor Rural',
    price: 'R$ 299',
    period: '/mês',
    description: 'Para produtores rurais pessoa física que buscam crédito com agilidade.',
    features: [
      'Perfil completo na plataforma',
      'Score ConectCampo',
      'Até 2 operações simultâneas',
      'Matching automático',
      'Gestão de documentos',
      'Suporte por e-mail',
    ],
    cta: 'Começar agora',
    highlighted: false,
    href: '/register',
  },
  {
    name: 'Plano Empresa',
    price: 'R$ 799',
    period: '/mês',
    description: 'Para empresas do agronegócio que buscam o melhor crédito.',
    features: [
      'Tudo do Plano Produtor Rural',
      'Operações ilimitadas',
      'Score Premium com análise detalhada',
      'Prioridade no matching',
      'Gestão de documentos avançada',
      'Relatórios e analytics',
      'Suporte prioritário',
    ],
    cta: 'Assinar agora',
    highlighted: false,
    href: '/register',
  },
  {
    name: 'Plano Cooperativa',
    price: 'R$ 2.890',
    period: '/mês',
    description: 'Para cooperativas agropecuárias que desejam oferecer crédito aos seus cooperados.',
    features: [
      'Tudo do Plano Empresa',
      'Gestão multi-CNPJ de cooperados',
      'Painel de gestão coletiva',
      'API completa de integração',
      'Relatórios consolidados',
      'Suporte dedicado com gerente de conta',
    ],
    cta: 'Assinar agora',
    highlighted: true,
    href: '/register',
  },
  {
    name: 'Instituição Financeira',
    price: 'Grátis',
    description: 'Para bancos, FIDCs, securitizadoras e FIAGROs que fornecem crédito aos produtores.',
    features: [
      'Acesso à base de tomadores qualificados',
      'Filtros avançados de risco e perfil',
      'API completa de integração',
      'Dashboards de portfólio',
      'Gestão de propostas',
      'Compliance e rastreabilidade',
      'SLA garantido + gerente dedicado',
    ],
    cta: 'Cadastre-se grátis',
    highlighted: false,
    href: '/register',
  },
];

export function Plans() {
  return (
    <section id="planos" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title">Planos que cabem na sua operação</h2>
          <p className="section-subtitle">
            Escolha o plano ideal para o seu perfil. Instituições financeiras entram grátis. Além da assinatura, cobramos apenas uma comissão sobre operações fechadas.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
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
                href={plan.href}
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
