import { PublicLayout } from '@/components/landing/PublicLayout';
import { CheckCircle2, ArrowRight, FileText, Search, Handshake, TrendingUp, ShoppingCart, ShieldCheck, Truck, HandCoins, UserPlus } from 'lucide-react';
import Link from 'next/link';

const escrowSteps = [
  { icon: ShoppingCart, title: '1. Comprador paga', desc: 'O pagamento é feito via ValsaPay (PIX, cartão ou boleto), sem taxas de gateway.' },
  { icon: ShieldCheck, title: '2. Valor fica em custódia', desc: 'O valor é mantido em conta de custódia (escrow) pela instituição de pagamento parceira — o vendedor ainda não recebe.' },
  { icon: Truck, title: '3. Vendedor entrega', desc: 'O vendedor envia o produto e marca o pedido como enviado.' },
  { icon: HandCoins, title: '4. Comprador confirma', desc: 'Ao confirmar o recebimento, o valor é liberado ao vendedor pela instituição de pagamento. A taxa da plataforma é de 1% (0,5% de cada parte).' },
];

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Crie sua conta e seu perfil',
    description:
      'Cadastre a pessoa, empresa ou instituição e defina o perfil que orientará a experiência e os módulos disponíveis.',
    items: ['Cadastro online', 'Perfil conforme o tipo de operação', 'Controles de acesso por função'],
  },
  {
    number: '02',
    icon: FileText,
    title: 'Organize dados e documentos',
    description:
      'Reúna documentos cadastrais, informações produtivas, garantias e históricos necessários para apresentar a operação.',
    items: ['Data room organizado', 'Campos pendentes identificados', 'Documentos vinculados à operação'],
  },
  {
    number: '03',
    icon: Search,
    title: 'Componha o Score ConectCampo',
    description:
      'O motor organiza os dados cadastrados em indicadores de apoio à análise, sem substituir a política de crédito das instituições.',
    items: ['Indicadores baseados nos dados disponíveis', 'Critérios explicados no dashboard', 'Evolução conforme o cadastro é completado'],
  },
  {
    number: '04',
    icon: Handshake,
    title: 'Matching com parceiros financeiros',
    description:
      'Com base no seu score e perfil, o sistema identifica compatibilidade com os critérios cadastrados por bancos, cooperativas, FIDCs, securitizadoras e FIAGROs.',
    items: ['Matching por perfil e critérios de elegibilidade', 'Apresentação a fontes compatíveis', 'Fluxo centralizado de acompanhamento'],
  },
  {
    number: '05',
    icon: TrendingUp,
    title: 'Compare e acompanhe propostas',
    description:
      'Compare condições e acompanhe as etapas de formalização. A concessão e as condições finais pertencem à instituição financeira responsável.',
    items: ['Comparação lado a lado das propostas', 'Assinatura digital integrada', 'Gestão pós-operação no dashboard'],
  },
];

export default function ComoFuncionaPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-white dark:from-dark-card dark:to-dark-bg px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-brand-100 dark:bg-brand-900/30 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400 mb-6">
            Como Funciona
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Do campo ao crédito em{' '}
            <span className="text-brand-600">5 etapas claras</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
            A ConectCampo organiza dados, documentos e etapas do crédito rural. A plataforma aproxima produtores
            e empresas do agronegócio de fontes compatíveis, preservando a análise e a decisão de cada instituição.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-16">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className={`flex flex-col gap-10 lg:flex-row lg:items-center ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-5xl font-black text-brand-100 dark:text-brand-900/40 leading-none">
                      {step.number}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-5">{step.description}</p>
                  <ul className="space-y-2">
                    {step.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-dark-card dark:to-dark-border h-56 lg:h-64 flex items-center justify-center">
                  <Icon className="h-24 w-24 text-brand-200 dark:text-brand-900/40" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Marketplace com pagamento seguro (escrow) */}
      <section className="px-6 py-20 lg:px-8 bg-gray-50 dark:bg-dark-card/40">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-4">
              <ShieldCheck className="h-4 w-4" /> Marketplace de grãos
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Pagamento seguro em custódia
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Compre e venda produção direto com outros produtores, com proteção para as duas partes.
              O dinheiro só chega ao vendedor depois que o comprador confirma o recebimento.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {escrowSteps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-bold text-gray-900 dark:text-white">{s.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.desc}</p>
                  {i < escrowSteps.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute top-1/2 -right-3 h-5 w-5 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { t: 'Taxa de apenas 1%', d: 'Dividida igualmente: 0,5% do comprador e 0,5% do vendedor.' },
              { t: 'Liberação automática', d: 'Se não houver contestação, o valor é liberado após o prazo de entrega.' },
              { t: 'Reputação', d: 'Comprador e vendedor se avaliam a cada transação concluída.' },
            ].map((b) => (
              <div key={b.t} className="rounded-xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="font-semibold text-gray-900 dark:text-white">{b.t}</p>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 px-6 py-20 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Pronto para começar?</h2>
        <p className="text-brand-100 mb-8 max-w-xl mx-auto">
          Cadastre-se, organize sua operação e acompanhe a apresentação a fontes de crédito compatíveis.
        </p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors">
          Criar conta gratuita <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </PublicLayout>
  );
}
