'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { Package, Check, Star, Zap, Crown, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { api } from '@/lib/api';

const PLANS = [
  {
    key: 'START',
    name: 'Plano Produtor Rural',
    price: 299,
    icon: Package,
    color: 'border-gray-200 dark:border-gray-700',
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
  },
  {
    key: 'PRO',
    name: 'Plano Empresa',
    price: 799,
    icon: Zap,
    color: 'border-brand-300 dark:border-brand-800',
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
  },
  {
    key: 'COOPERATIVE',
    name: 'Plano Cooperativa',
    price: 2890,
    icon: Star,
    color: 'border-amber-300 dark:border-amber-800',
    popular: true,
    features: [
      'Tudo do Plano Empresa',
      'Gestão multi-CNPJ de cooperados',
      'Painel de gestão coletiva da carteira',
      'API completa de integração',
      'Relatórios consolidados por cooperado',
      'Suporte dedicado com gerente de conta',
    ],
  },
  {
    key: 'CORPORATE',
    name: 'Instituição Financeira',
    price: 0,
    icon: Crown,
    color: 'border-purple-300 dark:border-purple-800',
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

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const { data } = await api.get('/subscriptions/me');
      setSubscription(data);
    } catch {
      // No subscription
    } finally {
      setLoading(false);
    }
  }

  const currentPlan = subscription?.plan || 'FREE';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minha Assinatura</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gerencie seu plano e maximize suas oportunidades
        </p>
      </div>

      {/* Current plan info */}
      {subscription && (
        <div className="card bg-gradient-to-r from-brand-50 to-agro-field/10 dark:from-brand-950/30 dark:to-agro-field/5 border-brand-200 dark:border-brand-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">Plano Atual</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {PLANS.find((p) => p.key === currentPlan)?.name || currentPlan}
              </h3>
              {subscription.currentPeriodEnd && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {subscription.paymentStatus === 'TRIALING'
                    ? `Teste grátis até ${formatDate(subscription.trialEndsAt || subscription.currentPeriodEnd)}`
                    : `Válido até ${formatDate(subscription.currentPeriodEnd)}`}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                subscription.paymentStatus === 'ACTIVE'
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                  : subscription.paymentStatus === 'TRIALING'
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/30 dark:text-brand-400'
                  : subscription.paymentStatus === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
              }`}>
                {subscription.paymentStatus === 'ACTIVE'
                  ? 'Ativo'
                  : subscription.paymentStatus === 'TRIALING'
                  ? '7 dias grátis'
                  : subscription.paymentStatus === 'PENDING'
                  ? 'Aguardando Pagamento'
                  : subscription.paymentStatus === 'OVERDUE'
                  ? 'Em Atraso'
                  : 'Cancelado'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Trial banner */}
      {subscription?.paymentStatus === 'TRIALING' && (
        <div className="card border-brand-200 dark:border-brand-800 bg-brand-50/60 dark:bg-brand-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Você está no período de teste gratuito
              </h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Acesso completo até{' '}
                <span className="font-medium">
                  {formatDate(subscription.trialEndsAt || subscription.currentPeriodEnd)}
                </span>
                . Ao fim do teste, a cobrança do plano é emitida no gateway escolhido, no CPF/CNPJ informado — você escolhe PIX, cartão ou boleto na hora de pagar. Cancele quando quiser antes disso, sem custo.
              </p>
            </div>
            {subscription.invoiceUrl && (
              <a
                href={subscription.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary shrink-0 whitespace-nowrap text-sm"
              >
                Pagar agora e garantir o plano
              </a>
            )}
          </div>
        </div>
      )}

      {/* Overdue banner */}
      {subscription?.paymentStatus === 'OVERDUE' && subscription?.invoiceUrl && (
        <div className="card border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Seu período de teste terminou
              </h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Para reativar o acesso completo, conclua o pagamento do plano. Você escolhe PIX, cartão ou boleto.
              </p>
            </div>
            <a
              href={subscription.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary shrink-0 whitespace-nowrap text-sm"
            >
              Pagar e reativar
            </a>
          </div>
        </div>
      )}

      {/* Plans grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-80 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.key;
            return (
              <div
                key={plan.key}
                className={`card relative border-2 ${plan.color} ${isCurrent ? 'ring-2 ring-brand-500' : ''} ${plan.popular ? 'shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-500 text-white text-xs font-bold rounded-full">
                    Popular
                  </div>
                )}
                <div className="text-center mb-4">
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${isCurrent ? 'text-brand-600' : 'text-gray-400'}`} />
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                  <div className="mt-2">
                    {plan.price === 0 ? (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">Grátis</p>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(plan.price)}
                        <span className="text-sm font-normal text-gray-400">/mês</span>
                      </p>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Check className="h-4 w-4 text-brand-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                    isCurrent
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-default'
                      : 'btn-primary'
                  }`}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Plano Atual' : 'Assinar'}
                  {!isCurrent && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
