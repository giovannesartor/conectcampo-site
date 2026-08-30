import { PublicLayout } from '@/components/landing/PublicLayout';
import { Building2, Shield, TrendingUp, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { PartnerForm } from './PartnerForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parceiros Financeiros',
  description: 'Torne-se parceiro ConectCampo. Analise operações rurais com scoring, documentos e dados organizados em um só fluxo.',
  openGraph: {
    title: 'Parceiros Financeiros — ConectCampo',
    description: 'Bancos, FIDCs, FIAGROs e cooperativas: analise operações rurais com dados e documentos organizados.',
  },
};

const partnerTypes = [
  {
    icon: Building2,
    title: 'Bancos e Financeiras',
    description:
      'Analise solicitações de produtores rurais e empresas do agro com scoring e documentação organizados para apoiar a decisão de crédito.',
  },
  {
    icon: Shield,
    title: 'FIDCs e Securitizadoras',
    description:
      'Apoio à originação de recebíveis do agronegócio com histórico da operação e documentos centralizados.',
  },
  {
    icon: TrendingUp,
    title: 'FIAGROs',
    description:
      'Avalie oportunidades de crédito rural com dados de produção, scoring e garantias apresentados de forma estruturada.',
  },
  {
    icon: Users,
    title: 'Cooperativas de Crédito',
    description:
      'Organize a análise dos produtos de crédito rural e acompanhe solicitações apresentadas à sua cooperativa.',
  },
];

const benefits = [
  'Solicitações organizadas com apoio do scoring proprietário',
  'Dados de produção, documentos e garantias centralizados',
  'API RESTful para integração com seus sistemas',
  'Dashboard de acompanhamento da carteira',
  'Trilha de auditoria para apoiar processos de conformidade',
  'Relatórios de risco e performance',
  'Atendimento especializado para integração',
  'Monitoramento do ambiente e suporte operacional',
];

export default function ParceirosPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-white dark:from-dark-card dark:to-dark-bg px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-brand-100 dark:bg-brand-900/30 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400 mb-6">
            Parceiros Financeiros
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Operações rurais organizadas{' '}
            <span className="text-brand-600">para uma análise mais eficiente</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
            A ConectCampo organiza a conexão entre instituições financeiras e solicitantes de
            crédito rural, reunindo dados, scoring e documentos para apoiar a análise.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contato" className="btn-primary inline-flex items-center gap-2">
              Tornar-se parceiro <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/api-docs" className="btn-ghost inline-flex items-center gap-2">
              Ver documentação da API
            </Link>
          </div>
        </div>
      </section>

      {/* Partner types */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Quem pode ser parceiro ConectCampo?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {partnerTypes.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20 mb-4">
                    <Icon className="h-6 w-6 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{p.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 dark:bg-dark-card px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12">
            O que a plataforma oferece aos parceiros
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 bg-white dark:bg-dark-bg rounded-xl p-4 border border-gray-100 dark:border-dark-border">
                <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Form */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
            Cadastre sua instituição
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
            Preencha o formulário abaixo. Nosso time comercial analisará os dados e retornará pelo contato informado.
          </p>
          <PartnerForm />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 px-6 py-20 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Pronto para expandir seu portfólio agro?</h2>
        <p className="text-brand-100 mb-8 max-w-xl mx-auto">
          Fale com nosso time comercial e conheça o fluxo de originação, análise e acompanhamento da ConectCampo.
        </p>
        <Link href="/contato" className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors">
          Falar com especialista <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </PublicLayout>
  );
}
