import { PublicLayout } from '@/components/landing/PublicLayout';
import { ShieldCheck, UserCheck, Lock, FileSearch } from 'lucide-react';
import Link from 'next/link';

const rights = [
  { icon: UserCheck, title: 'Confirmação e Acesso', description: 'Confirme se tratamos seus dados e acesse uma cópia deles a qualquer momento.' },
  { icon: FileSearch, title: 'Correção', description: 'Solicite a correção de dados incompletos, inexatos ou desatualizados.' },
  { icon: Lock, title: 'Eliminação', description: 'Peça a eliminação de dados desnecessários ou tratados em desconformidade com a lei.' },
  { icon: ShieldCheck, title: 'Portabilidade', description: 'Receba seus dados em formato estruturado para transferência a outro fornecedor.' },
];

export default function LgpdPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-brand-50 to-white dark:from-dark-card dark:to-dark-bg px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-brand-100 dark:bg-brand-900/30 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400 mb-6">
            LGPD
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Lei Geral de Proteção de Dados
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
            A ConectCampo está comprometida com a conformidade total à Lei nº 13.709/2018 (LGPD).
            A proteção dos seus dados pessoais é uma prioridade estratégica da empresa.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">
            Seus direitos garantidos pela LGPD
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {rights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
                  <Icon className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert prose-headings:font-bold prose-a:text-brand-600">
          <h2>Base jurídica para tratamento de dados</h2>
          <p>Tratamos dados pessoais com base nas seguintes hipóteses legais previstas na LGPD:</p>
          <ul>
            <li><strong>Execução de contrato:</strong> para prestação dos serviços da plataforma;</li>
            <li><strong>Cumprimento de obrigação legal:</strong> para atender exigências do Banco Central, Receita Federal e outras autoridades;</li>
            <li><strong>Legítimo interesse:</strong> para prevenção a fraudes e melhoria de serviços;</li>
            <li><strong>Consentimento:</strong> para envio de comunicações de marketing (opt-in).</li>
          </ul>

          <h2>Encarregado (DPO)</h2>
          <p>
            Nosso Encarregado de Proteção de Dados está disponível para esclarecer dúvidas,
            receber requisições e atuar como canal de comunicação com a Autoridade Nacional de
            Proteção de Dados (ANPD).
          </p>
          <p><strong>E-mail:</strong> <a href="mailto:privacidade@conectcampo.com.br">privacidade@conectcampo.com.br</a></p>
          <p><strong>Prazo de resposta:</strong> até 15 dias úteis.</p>

          <h2>Incidentes de segurança</h2>
          <p>
            Em caso de incidente de segurança com impacto relevante para titulares, a ConectCampo
            notificará a ANPD e os afetados nos prazos previstos em lei (até 2 dias úteis após o
            conhecimento do incidente).
          </p>
        </div>
      </section>

      <section className="bg-brand-50 dark:bg-dark-card px-6 py-12 lg:px-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Exercer seus direitos</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
          Envie sua solicitação ao nosso DPO. Responderemos em até 15 dias úteis.
        </p>
        <Link href="mailto:privacidade@conectcampo.com.br" className="btn-primary inline-block">
          privacidade@conectcampo.com.br
        </Link>
      </section>
    </PublicLayout>
  );
}
