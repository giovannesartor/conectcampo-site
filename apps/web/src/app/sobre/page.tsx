import { PublicLayout } from '@/components/landing/PublicLayout';
import { Target, Lightbulb, Users, Leaf, Award, Globe } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nós',
  description: 'Conheça a ConectCampo: nossa história, missão, equipe e como estamos transformando o crédito rural no Brasil com tecnologia e dados.',
  openGraph: {
    title: 'Sobre a ConectCampo',
    description: 'Conheça a ConectCampo: nossa história, missão, equipe e como estamos transformando o crédito rural no Brasil.',
  },
};

const values = [
  { icon: Target, title: 'Missão', description: 'Democratizar o acesso ao crédito rural, conectando produtores brasileiros às melhores oportunidades de financiamento com transparência e tecnologia.' },
  { icon: Lightbulb, title: 'Visão', description: 'Ser a principal infraestrutura de crédito do agronegócio brasileiro, contribuindo para a modernização e sustentabilidade do setor.' },
  { icon: Users, title: 'Valores', description: 'Transparência, inovação, respeito ao produtor rural, conformidade regulatória e impacto positivo no desenvolvimento do campo brasileiro.' },
];

const timeline = [
  { year: '2023', title: 'Fundação', description: 'ConectCampo é fundada com a missão de simplificar o crédito rural no Brasil.' },
  { year: '2024 Q1', title: 'MVP e primeiros parceiros', description: 'Lançamento da plataforma beta com 5 instituições financeiras parceiras.' },
  { year: '2024 Q3', title: 'Score ConectCampo', description: 'Lançamento do scoring proprietário com IA para avaliação de risco agro.' },
  { year: '2025 Q1', title: 'R$ 100M em operações', description: 'Marca de R$ 100 milhões em crédito transacionado pela plataforma.' },
  { year: '2025 Q3', title: '50+ parceiros', description: 'Expansão para mais de 50 instituições financeiras na rede de parceiros.' },
  { year: '2026', title: 'Expansão nacional', description: 'Cobertura em todos os estados do Brasil com foco no Matopiba e Centro-Oeste.' },
];

const team = [
  { name: 'Carlos Mendes', role: 'CEO & Co-founder', bio: 'Ex-VP de Agronegócios na XP Inc. 15+ anos no mercado de crédito rural.' },
  { name: 'Ana Ferreira', role: 'CTO & Co-founder', bio: 'Engenheira de software, ex-Google. Especialista em fintech e sistemas distribuídos.' },
  { name: 'Ricardo Santos', role: 'CFO', bio: 'Ex-diretor de tesouraria no Banco do Brasil. Mestrado em finanças pela FGV.' },
  { name: 'Mariana Costa', role: 'Head de Produto', bio: 'Product Lead ex-Nubank. Foco em experiência do usuário e produtos financeiros.' },
  { name: 'Pedro Oliveira', role: 'Head Comercial', bio: '10+ anos em agribusiness. Rede em cooperativas e grandes produtores do MT e GO.' },
  { name: 'Juliana Lima', role: 'Head Jurídico', bio: 'Advogada especialista em regulação financeira e direito do agronegócio.' },
];

const numbers = [
  { value: 'R$ 500M+', label: 'Volume transacionado' },
  { value: '50+', label: 'Parceiros financeiros' },
  { value: '2.500+', label: 'Produtores atendidos' },
  { value: '24 estados', label: 'Cobertura nacional' },
];

export default function SobrePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-white dark:from-dark-card dark:to-dark-bg px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-brand-100 dark:bg-brand-900/30 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400 mb-6">
            Sobre Nós
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Conectando o campo ao futuro
            <span className="text-brand-600"> do crédito</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
            A ConectCampo nasceu da convicção de que o produtor rural brasileiro merece acesso
            simples, rápido e justo ao crédito — sem burocracia, sem intermediários desnecessários.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Nossa história</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-400">
                <p>
                  A ConectCampo foi fundada com a missão de resolver um problema crônico do agronegócio
                  brasileiro: a dificuldade dos produtores rurais em acessar crédito competitivo,
                  especialmente os pequenos e médios, que representam a grande maioria do campo brasileiro.
                </p>
                <p>
                  Com mais de R$ 600 bilhões em crédito rural movimentados anualmente no Brasil, o
                  processo ainda é marcado por burocracia excessiva, assimetria de informação e falta
                  de tecnologia. A ConectCampo usa inteligência artificial e dados agronômicos para
                  mudar esse cenário.
                </p>
                <p>
                  Nossa plataforma conecta diretamente produtores rurais qualificados a uma rede de
                  bancos, cooperativas, FIDCs, securitizadoras e FIAGROs — eliminando barreiras e
                  acelerando operações de crédito que antes levavam meses.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-dark-card dark:to-dark-border h-72 flex items-center justify-center">
              <div className="text-center px-8">
                <p className="text-5xl font-black text-brand-600">R$ 600bi</p>
                <p className="text-sm text-brand-700 dark:text-brand-400 mt-2">em crédito rural movimentado anualmente no Brasil</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="bg-gray-50 dark:bg-dark-card px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">
            O que nos guia
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {values.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white mb-4">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {numbers.map((n) => (
              <div key={n.label} className="text-center">
                <p className="text-3xl font-black text-brand-600">{n.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{n.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-gray-50 dark:bg-dark-card px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Nossa trajetória
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-brand-200 dark:bg-brand-800 -translate-x-1/2" />

            <div className="space-y-10">
              {timeline.map((item, i) => (
                <div key={item.year} className={`relative flex items-start gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Dot */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-600 border-4 border-brand-100 dark:border-dark-bg z-10" />

                  {/* Content */}
                  <div className={`ml-10 md:ml-0 md:w-[calc(50%-2rem)] ${i % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'}`}>
                    <span className="inline-block text-xs font-bold text-brand-600 bg-brand-100 dark:bg-brand-900/30 rounded-full px-3 py-1 mb-2">
                      {item.year}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">Nosso time</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Especialistas em agronegócio, tecnologia e mercado financeiro unidos por uma missão.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <div key={member.name} className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-brand-500 to-agro-gold flex items-center justify-center text-white text-xl font-bold mb-4">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-sm font-medium text-brand-600 mb-2">{member.role}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Junte-se à ConectCampo</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
          Seja você produtor, empresa do agro ou instituição financeira — a ConectCampo tem um lugar para você.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="btn-primary">Criar conta gratuita</Link>
          <Link href="/carreiras" className="btn-ghost">Ver vagas em aberto</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
