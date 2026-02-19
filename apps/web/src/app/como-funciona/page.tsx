import { PublicLayout } from '@/components/landing/PublicLayout';
import { CheckCircle2, ArrowRight, FileText, Search, Handshake, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Cadastre-se e envie documentos',
    description:
      'Crie sua conta em minutos. Envie documentos como balanço patrimonial, CPF/CNPJ, comprovante de propriedade e histórico produtivo. Nossa plataforma é 100% digital e segura.',
    items: ['Cadastro online em menos de 10 minutos', 'Upload seguro de documentos', 'Validação automática por IA'],
  },
  {
    number: '02',
    icon: Search,
    title: 'Análise e Score de Crédito',
    description:
      'Nossa engine analisa seu perfil com base em dados agronômicos, histórico de produção, localização e indicadores financeiros. Você recebe um Score ConectCampo transparente.',
    items: ['Score baseado em dados reais do campo', 'Análise multivariável proprietária', 'Resultado em até 24 horas'],
  },
  {
    number: '03',
    icon: Handshake,
    title: 'Matching com parceiros financeiros',
    description:
      'Com base no seu score e perfil, o sistema encontra automaticamente as melhores oportunidades de crédito entre bancos, cooperativas, FIDCs, securitizadoras e FIAGROs.',
    items: ['Matching inteligente por IA', 'Múltiplas instituições simultaneamente', 'Sem necessidade de bater de porta em porta'],
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Feche a operação e cresça',
    description:
      'Compare as propostas, negocie condições e formalize a operação direto pela plataforma. Tudo documentado, rastreável e em conformidade com regulamentos do Banco Central.',
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
            <span className="text-brand-600">4 etapas simples</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
            A ConectCampo elimina a burocracia do crédito rural. Nossa plataforma conecta produtores
            rurais e empresas do agronegócio diretamente às melhores instituições financeiras do Brasil.
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

      {/* CTA */}
      <section className="bg-brand-600 px-6 py-20 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Pronto para começar?</h2>
        <p className="text-brand-100 mb-8 max-w-xl mx-auto">
          Cadastre-se gratuitamente e descubra as melhores oportunidades de crédito para o seu negócio.
        </p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors">
          Criar conta gratuita <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </PublicLayout>
  );
}
