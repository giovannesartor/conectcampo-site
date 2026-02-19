'use client';

import { PublicLayout } from '@/components/landing/PublicLayout';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const jobs = [
  {
    title: 'Engenheiro(a) de Software Sênior – Backend',
    area: 'Tecnologia',
    location: 'Remoto (Brasil)',
    type: 'CLT ou PJ',
    description: 'Buscamos um(a) engenheiro(a) sênior para liderar o desenvolvimento da nossa API e serviços de scoring. Stack: Node.js/NestJS, PostgreSQL, Prisma, AWS.',
  },
  {
    title: 'Analista de Crédito Rural',
    area: 'Crédito & Risco',
    location: 'São Paulo, SP (Híbrido)',
    type: 'CLT',
    description: 'Responsável pela análise de operações de crédito, validação de scoring e relacionamento com instituições financeiras parceiras. Experiência com crédito rural essencial.',
  },
  {
    title: 'Especialista em Produtos – Agronegócio',
    area: 'Produto',
    location: 'Remoto (Brasil)',
    type: 'CLT ou PJ',
    description: 'Profissional com background no agronegócio para atuar como ponte entre as necessidades dos produtores rurais e o desenvolvimento de produto.',
  },
  {
    title: 'Gerente de Parcerias Institucionais',
    area: 'Comercial',
    location: 'São Paulo, SP',
    type: 'CLT',
    description: 'Responsável por prospectar e desenvolver parcerias com bancos, FIDCs, cooperativas e securitizadoras. Necessário network no mercado financeiro e/ou agro.',
  },
];

const perks = [
  '100% remoto (maioria das vagas)',
  'Equity / participação nos resultados',
  'Plano de saúde e odontológico',
  'Budget anual para aprendizado (cursos, eventos)',
  'Flexibilidade de horários',
  'Ambiente de early stage com alto impacto',
];

export default function CarreirasPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-white dark:from-dark-card dark:to-dark-bg px-6 py-24 lg:px-8 text-center">
        <span className="inline-block rounded-full bg-brand-100 dark:bg-brand-900/30 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400 mb-6">
          Carreiras
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Construa o futuro do crédito rural
          <span className="text-brand-600"> com a gente</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Somos um time enxuto com grande impacto. Se você quer resolver problemas reais do campo
          brasileiro usando tecnologia, este é o seu lugar.
        </p>
      </section>

      {/* Perks */}
      <section className="px-6 py-16 lg:px-8 bg-gray-50 dark:bg-dark-card">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-8">Por que trabalhar na ConectCampo?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3 rounded-xl bg-white dark:bg-dark-bg border border-gray-100 dark:border-dark-border px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{jobs.length} vagas em aberto</h2>
          <div className="space-y-6">
            {jobs.map((job) => (
              <div key={job.title} className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-brand-100 dark:bg-brand-900/30 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-400">
                      {job.area}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">{job.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{job.type}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{job.description}</p>
                <Link
                  href={`mailto:carreiras@conectcampo.com.br?subject=Candidatura: ${encodeURIComponent(job.title)}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Candidatar-se <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spontaneous */}
      <section className="bg-brand-600 px-6 py-16 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Não encontrou sua vaga?</h2>
        <p className="text-brand-100 mb-6 max-w-lg mx-auto">
          Mandou o seu currículo mesmo assim. Adoramos conhecer pessoas talentosas que querem impactar o agronegócio.
        </p>
        <Link href="mailto:carreiras@conectcampo.com.br?subject=Candidatura Espontânea" className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors">
          Enviar candidatura espontânea <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </PublicLayout>
  );
}
