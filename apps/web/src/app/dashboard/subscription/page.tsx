'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { Package, Check, Star, Zap, Crown, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { api } from '@/lib/api';

const PLANS = [
  {
    key: 'FREE',
    name: 'Gratuito',
    price: 0,
    icon: Package,
    color: 'border-gray-200 dark:border-gray-700',
    features: [
      'Cadastro na plataforma',
      '1 operação por mês',
      'Score básico',
      'Suporte por email',
    ],
  },
  {
    key: 'BASIC',
    name: 'Básico',
    price: 99.90,
    icon: Star,
    color: 'border-blue-300 dark:border-blue-800',
    features: [
      'Até 5 operações por mês',
      'Score detalhado',
      'Matching automático',
      'Notificações por email',
      'Suporte prioritário',
    ],
  },
  {
    key: 'PREMIUM',
    name: 'Premium',
    price: 249.90,
    icon: Zap,
    color: 'border-brand-300 dark:border-brand-800',
    popular: true,
    features: [
      'Operações ilimitadas',
      'Score premium com detalhamento',
      'Matching prioritário',
      'Assessoria dedicada',
      'Dashboard avançado',
      'Relatórios exportáveis',
      'Suporte WhatsApp',
    ],
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: 599.90,
    icon: Crown,
    color: 'border-purple-300 dark:border-purple-800',
    features: [
      'Tudo do Premium',
      'Multi-propriedades',
      'API de integração',
      'Gestor de conta exclusivo',
      'Treinamento personalizado',
      'SLA garantido',
      'Customizações',
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
      const { data } = await api.get('/subscriptions/my-subscription');
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
              {subscription.expiresAt && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Válido até {formatDate(subscription.expiresAt)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                subscription.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
              }`}>
                {subscription.status === 'ACTIVE' ? 'Ativo' : subscription.status}
              </span>
            </div>
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
