import { PublicLayout } from '@/components/landing/PublicLayout';
import { ShieldCheck, Scale, Building2, FileCheck } from 'lucide-react';

const frameworks = [
  { icon: Scale, title: 'Banco Central do Brasil', description: 'Operamos em conformidade com as normativas do BCB para marketplaces de crédito, incluindo a Resolução CMN 4.656/2018 (SCDs e SEPs).' },
  { icon: ShieldCheck, title: 'LGPD & ANPD', description: 'Processos de governança de dados alinhados à Lei 13.709/2018. DPO designado, registro de operações de tratamento e avaliação de impacto (DPIA).' },
  { icon: Building2, title: 'CVM & Mercado de Capitais', description: 'Estruturação de CRAs, FIAGROs e outros instrumentos seguindo as instruções da CVM vigentes.' },
  { icon: FileCheck, title: 'COAF / AML / KYC', description: 'Políticas de prevenção à lavagem de dinheiro (PLD-FT) compliant com as normativas do COAF e recomendações do GAFI.' },
];

export default function CompliancePage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-brand-50 to-white dark:from-dark-card dark:to-dark-bg px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-brand-100 dark:bg-brand-900/30 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400 mb-6">
            Compliance
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Conformidade regulatória é nossa base
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
            Operamos com rigorosa conformidade às regulamentações do setor financeiro e agronegócio
            brasileiro. Transparência e segurança jurídica em cada operação.
          </p>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 sm:grid-cols-2">
          {frameworks.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20 mb-4">
                <Icon className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert prose-headings:font-bold prose-a:text-brand-600">
          <h2>Programa de Integridade</h2>
          <p>
            A ConectCampo mantém um Programa de Integridade baseado nos pilares de: comprometimento da
            alta administração, políticas e procedimentos internos, canais de denúncia confidencial,
            due diligence de terceiros e treinamento contínuo dos colaboradores.
          </p>

          <h2>Canal de denúncias</h2>
          <p>
            Para reportar irregularidades, suspeitas de fraude ou violações ao Código de Ética:
            <br />
            <strong>E-mail confidencial:</strong>{' '}
            <a href="mailto:compliance@conectcampo.com.br">compliance@conectcampo.com.br</a>
            <br />
            Todas as denúncias são tratadas com sigilo absoluto e investigadas pelo Comitê de Compliance.
          </p>

          <h2>Perguntas sobre compliance</h2>
          <p>
            Para dúvidas de natureza regulatória, auditores ou instituições financeiras parceiras:
            <br />
            <strong>E-mail:</strong>{' '}
            <a href="mailto:compliance@conectcampo.com.br">compliance@conectcampo.com.br</a>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
