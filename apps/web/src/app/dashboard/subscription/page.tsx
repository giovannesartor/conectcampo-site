'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { Package, Check, Star, Zap, Crown, ArrowRight, Apple, ShieldCheck, RotateCcw, Settings } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { api } from '@/lib/api';
import { isIOSNativeApp } from '@/lib/native-platform';
import {
  loadAppleSubscriptionContext,
  loadAppleSubscriptionOffers,
  openAppleSubscriptionManagement,
  purchaseAppleSubscription,
  restoreAppleSubscriptions,
  type AppleSubscriptionContext,
  type AppleSubscriptionOffer,
} from '@/lib/native-subscriptions';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
      'Cotações de commodities e moedas',
      'Gestão de operações de crédito',
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
      'CPR completa: minuta, PDF e assinatura digital',
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
      'Acesso a solicitações com dados organizados',
      'Filtros avançados de risco e perfil',
      'API completa de integração',
      'Dashboards de portfólio',
      'Gestão de propostas',
      'Compliance e rastreabilidade',
      'Atendimento especializado para integração',
    ],
  },
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isIOSApp, setIsIOSApp] = useState(false);
  const [appleOffers, setAppleOffers] = useState<AppleSubscriptionOffer[]>([]);
  const [appleContext, setAppleContext] = useState<AppleSubscriptionContext | null>(null);
  const [appleBusy, setAppleBusy] = useState<string | null>(null);
  const [appleCatalogReady, setAppleCatalogReady] = useState(true);

  useEffect(() => {
    loadSubscription();
    const nativeIOS = isIOSNativeApp();
    setIsIOSApp(nativeIOS);
    if (nativeIOS) {
      void Promise.all([loadAppleSubscriptionOffers(), loadAppleSubscriptionContext()])
        .then(([offers, context]) => {
          setAppleOffers(offers);
          setAppleContext(context);
          setAppleCatalogReady(offers.length > 0);
        })
        .catch(() => {
          setAppleOffers([]);
          setAppleCatalogReady(false);
        });
    }
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

  async function handleApplePurchase(offer: AppleSubscriptionOffer) {
    if (!appleContext || appleBusy) return;
    setAppleBusy(offer.productId);
    try {
      await purchaseAppleSubscription(offer, appleContext);
      await loadSubscription();
      toast.success('Assinatura confirmada pela App Store e ativada no ConectCampo.');
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message;
      if (!String(message ?? '').toLowerCase().includes('cancel')) {
        toast.error(message || 'Não foi possível concluir a assinatura pela App Store.');
      }
    } finally {
      setAppleBusy(null);
    }
  }

  async function handleAppleRestore() {
    if (!appleContext || appleBusy) return;
    setAppleBusy('restore');
    try {
      const restored = await restoreAppleSubscriptions(appleContext);
      if (restored.length === 0) {
        toast('Nenhuma assinatura ativa foi encontrada para esta conta Apple.');
      } else {
        await loadSubscription();
        toast.success('Compra restaurada e acesso sincronizado.');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? error?.message ?? 'Não foi possível restaurar as compras.');
    } finally {
      setAppleBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minha Assinatura</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gerencie seu plano e maximize suas oportunidades
        </p>
      </div>

      {isIOSApp && (
        <div className="card border-brand-200 bg-brand-50/70 dark:border-brand-800 dark:bg-brand-950/20">
          <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-800 text-white">
            <Apple className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-gray-950 dark:text-white">Assinaturas protegidas pela App Store</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
              No iPhone, os preços e a cobrança dos planos digitais vêm diretamente da App Store da sua região. Nenhum valor adicional foi definido no aplicativo.
            </p>
            {!appleContext?.canPurchase && appleContext?.reason && (
              <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">{appleContext.reason}</p>
            )}
            {!appleCatalogReady && (
              <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                O catálogo da App Store ainda não está disponível neste aparelho. Tente novamente após a publicação dos produtos.
              </p>
            )}
          </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-brand-200/70 pt-4 dark:border-brand-800/70">
            <button
              type="button"
              onClick={() => { void handleAppleRestore(); }}
              disabled={!!appleBusy || !appleContext}
              className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <RotateCcw className={`h-4 w-4 ${appleBusy === 'restore' ? 'animate-spin' : ''}`} />
              Restaurar compras
            </button>
            <button
              type="button"
              onClick={() => { void openAppleSubscriptionManagement(); }}
              className="btn-ghost inline-flex items-center gap-2 text-sm"
            >
              <Settings className="h-4 w-4" /> Gerenciar na Apple
            </button>
          </div>
        </div>
      )}

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
                {isIOSApp ? (
                  <>
                    Acesso completo até{' '}
                    <span className="font-medium">{formatDate(subscription.trialEndsAt || subscription.currentPeriodEnd)}</span>.
                    {' '}Assinaturas iniciadas fora do aplicativo continuam gerenciadas no canal original. Novas assinaturas no iPhone usarão a App Store.
                  </>
                ) : (
                  <>
                    Acesso completo até{' '}
                    <span className="font-medium">{formatDate(subscription.trialEndsAt || subscription.currentPeriodEnd)}</span>.
                    {' '}Ao fim do teste, a cobrança do plano é emitida no gateway escolhido, no CPF/CNPJ informado — você escolhe PIX, cartão ou boleto na hora de pagar. Cancele quando quiser antes disso, sem custo.
                  </>
                )}
              </p>
            </div>
            {!isIOSApp && subscription.invoiceUrl && (
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
      {!isIOSApp && subscription?.paymentStatus === 'OVERDUE' && subscription?.invoiceUrl && (
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
            const appleOffer = appleOffers.find((offer) => offer.plan === plan.key);
            const currentAppleSubscription = isCurrent && subscription?.gateway === 'APPLE' && subscription?.paymentStatus === 'ACTIVE';
            const paidIOSPlan = isIOSApp && plan.price > 0;
            const appleUnavailable = paidIOSPlan && (!appleOffer || !appleContext?.canPurchase);
            const appleLoading = appleBusy === appleOffer?.productId;
            const currentNonPurchasable = isCurrent && (!paidIOSPlan || currentAppleSubscription);
            const planDisabled = currentNonPurchasable || appleUnavailable || !!appleBusy;
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
                    ) : isIOSApp ? (
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {appleOffer?.priceString ?? 'Pela App Store'}
                          {appleOffer && <span className="text-sm font-normal text-gray-400">/mês</span>}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 dark:text-brand-300">
                          <ShieldCheck className="h-3.5 w-3.5" /> Valor localizado pela Apple
                        </p>
                      </div>
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
                  type="button"
                  onClick={() => {
                    if (paidIOSPlan && appleOffer) void handleApplePurchase(appleOffer);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                    planDisabled
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-default'
                      : 'btn-primary'
                  }`}
                  disabled={planDisabled}
                >
                  {currentNonPurchasable
                    ? 'Plano Atual'
                    : appleLoading
                    ? 'Confirmando com a Apple...'
                    : paidIOSPlan && !appleOffer
                    ? 'Catálogo indisponível'
                    : paidIOSPlan && !appleContext?.canPurchase
                    ? 'Gerenciado no canal atual'
                    : paidIOSPlan
                    ? 'Assinar pela App Store'
                    : 'Assinar'}
                  {!currentNonPurchasable && !appleUnavailable && !appleLoading && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isIOSApp && (
        <p className="mx-auto max-w-3xl text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
          A assinatura renova automaticamente pela Apple até ser cancelada nas configurações da App Store. Ao assinar, você concorda com os{' '}
          <Link href="/legal/termos-de-uso" className="font-medium text-brand-700 underline dark:text-brand-300">Termos de Uso</Link>
          {' '}e com a{' '}
          <Link href="/legal/privacidade" className="font-medium text-brand-700 underline dark:text-brand-300">Política de Privacidade</Link>.
        </p>
      )}
    </div>
  );
}
