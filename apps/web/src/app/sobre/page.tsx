import { PublicLayout } from '@/components/landing/PublicLayout';
import { Target, Lightbulb, Users } from 'lucide-react';
import Link from 'next/link';

const values = [
  { icon: Target, title: 'Missão', description: 'Democratizar o acesso ao crédito rural, conectando produtores brasileiros às melhores oportunidades de financiamento com transparência e tecnologia.' },
  { icon: Lightbulb, title: 'Visão', description: 'Ser a principal infraestrutura de crédito do agronegócio brasileiro, contribuindo para a modernização e sustentabilidade do setor.' },
  { icon: Users, title: 'Valores', description: 'Transparência, inovação, respeito ao produtor rural, conformidade regulatória e impacto positivo no desenvolvimento do campo brasileiro.' },
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
