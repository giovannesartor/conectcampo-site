'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Plano Produtor Rural',
    price: 'R$ 299',
    period: '/mês',
    description: 'Para o produtor rural (pessoa física) que quer gerir a propriedade e acessar crédito com agilidade.',
    features: [
      'Perfil e gestão da propriedade (talhões e safras)',
      'Score ConectCampo de crédito',
      'Monitoramento por satélite (NDVI) e alertas de clima',
      'Cotações de mercado em tempo real',
      'Até 2 operações de crédito simultâneas',
      'Matching automático com financiadores',
      'Gestão de documentos',
      'Suporte por e-mail',
    ],
    cta: 'Começar 7 dias grátis',
    highlighted: false,
    href: '/register?plan=START',
  },
  {
    name: 'Plano Empresa',
    price: 'R$ 799',
    period: '/mês',
    description: 'Para empresas do agronegócio que buscam as melhores condições de crédito em escala.',
    features: [
      'Tudo do Plano Produtor Rural',
      'Operações de crédito ilimitadas',
      'Score Premium com análise detalhada',
      'Prioridade no matching com financiadores',
      'Emissão de CPR e contratos digitais',
      'Gestão de documentos avançada',
      'Relatórios e analytics da operação',
      'Suporte prioritário',
    ],
    cta: 'Começar 7 dias grátis',
    highlighted: false,
    href: '/register?plan=PRO',
  },
  {
    name: 'Plano Cooperativa',
    price: 'R$ 2.890',
    period: '/mês',
    description: 'Para cooperativas agropecuárias que querem oferecer crédito e gestão aos seus cooperados.',
    features: [
      'Tudo do Plano Empresa',
      'Gestão multi-CNPJ de cooperados',
      'Painel de gestão coletiva da carteira',
      'API completa de integração',
      'Relatórios consolidados por cooperado',
      'Suporte dedicado com gerente de conta',
    ],
    cta: 'Começar 7 dias grátis',
    highlighted: true,
    href: '/register?plan=COOPERATIVE',
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
    href: '/register?plan=CORPORATE',
  },
];

export function Plans() {
  return (
    <section id="planos" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title">Planos que cabem na sua operação</h2>
          <p className="section-subtitle">
            Comece com <span className="font-semibold text-brand-600 dark:text-brand-400">7 dias grátis</span> em qualquer plano pago. Instituições financeiras entram grátis. Além da assinatura, cobramos apenas uma comissão sobre operações fechadas.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`card relative flex flex-col h-full ${
                plan.highlighted
                  ? 'ring-2 ring-brand-500 shadow-xl shadow-brand-500/10'
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
              {plan.period && (
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-950/20 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
                  7 dias grátis
                </p>
              )}
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3 flex-1">
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

        {/* Opções de pagamento */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pague como preferir — escolha entre dois checkouts seguros no momento da assinatura:
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-brand-500 bg-brand-50 dark:bg-brand-950/20 px-4 py-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
              ValsaPay
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Recomendado
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-dark-border px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
              Asaas
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            7 dias grátis · depois PIX, cartão ou boleto · cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
}
