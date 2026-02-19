import { PublicLayout } from '@/components/landing/PublicLayout';
import { Check, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Produtor Starter',
    description: 'Para pequenos produtores iniciando sua jornada de crédito rural.',
    price: 'Grátis',
    period: '',
    highlight: false,
    cta: 'Criar conta',
    href: '/register',
    features: [
      'Perfil básico na plataforma',
      'Score ConectCampo',
      'Até 2 operações simultâneas',
      'Matching automático',
      'Suporte por e-mail',
    ],
  },
  {
    name: 'Produtor Pro',
    description: 'Para produtores e empresas do agro que buscam o melhor crédito.',
    price: 'R$ 149',
    period: '/mês',
    highlight: true,
    cta: 'Começar agora',
    href: '/register',
    features: [
      'Tudo do plano Starter',
      'Operações ilimitadas',
      'Score Premium com análise detalhada',
      'Prioridade no matching',
      'Gestão de documentos avançada',
      'Relatórios e analytics',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Instituição Financeira',
    description: 'Para bancos, FIDCs, cooperativas e securitizadoras.',
    price: 'Sob consulta',
    period: '',
    highlight: false,
    cta: 'Falar com especialista',
    href: '/contato',
    features: [
      'Acesso à base de tomadores qualificados',
      'Filtros avançados de risco e perfil',
      'API completa de integração',
      'Dashboards de portfólio',
      'Gestão de propostas',
      'Compliance e rastreabilidade',
      'SLA garantido + gerente dedicado',
    ],
  },
];

export default function PlanosPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-white dark:from-dark-card dark:to-dark-bg px-6 py-24 lg:px-8 text-center">
        <span className="inline-block rounded-full bg-brand-100 dark:bg-brand-900/30 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400 mb-6">
          Planos e Preços
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          O plano certo para cada <span className="text-brand-600">etapa do seu negócio</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Comece gratuitamente e escale conforme crescer. Sem contratos longos, sem surpresas.
        </p>
      </section>

      {/* Plans grid */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? 'border-brand-500 bg-brand-600 text-white shadow-2xl shadow-brand-200 dark:shadow-brand-900/30 scale-105'
                  : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900">
                    <Zap className="h-3 w-3" /> Mais popular
                  </span>
                </div>
              )}

              <div>
                <h3 className={`text-lg font-bold ${plan.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-2 text-sm ${plan.highlight ? 'text-brand-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {plan.description}
                </p>
                <div className="mt-6 flex items-end gap-1">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`mb-1 text-sm ${plan.highlight ? 'text-brand-200' : 'text-gray-400'}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="mt-8 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-brand-200' : 'text-brand-600'}`} />
                    <span className={plan.highlight ? 'text-brand-100' : 'text-gray-600 dark:text-gray-400'}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-white text-brand-700 hover:bg-brand-50'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {plan.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Dúvidas sobre qual plano escolher?{' '}
            <Link href="/contato" className="text-brand-600 font-medium hover:underline">
              Fale com nosso time
            </Link>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
