import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { AGRO_CITIES, getCity } from '@/lib/agro-cities';

export function generateStaticParams() {
  return AGRO_CITIES.map((c) => ({ cidade: c.slug }));
}

export function generateMetadata({ params }: { params: { cidade: string } }): Metadata {
  const c = getCity(params.cidade);
  if (!c) return { title: 'Crédito Rural' };
  const title = `Crédito Rural em ${c.name} (${c.uf}) — ConectCampo`;
  const description = `Encontre crédito rural em ${c.name}/${c.uf}, polo de ${c.destaque}. Conecte sua operação a bancos, cooperativas, FIDCs e securitizadoras. Pré-análise em 48h, 100% digital.`;
  const url = `https://conectcampo.digital/credito-rural/${c.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
}

export default function CidadePage({ params }: { params: { cidade: string } }) {
  const c = getCity(params.cidade);
  if (!c) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: `ConectCampo — Crédito Rural em ${c.name}`,
    areaServed: { '@type': 'City', name: `${c.name}, ${c.uf}` },
    url: `https://conectcampo.digital/credito-rural/${c.slug}`,
  };

  return (
    <main className="min-h-screen bg-white dark:bg-dark-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <section className="mx-auto max-w-3xl px-6 lg:px-8 pt-32 pb-16">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Crédito Rural · {c.uf}</span>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white [text-wrap:balance]">
          Crédito rural em {c.name} ({c.uf})
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {c.name} é um dos polos do agronegócio brasileiro, com destaque em <strong>{c.destaque}</strong>. Na ConectCampo,
          produtores e empresas da região conectam sua operação a bancos, cooperativas, FIDCs, securitizadoras e FIAGROs —
          e comparam as melhores condições de crédito em um só lugar.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { v: '48h', l: 'Pré-análise automática' },
            { v: '100% digital', l: 'Da CPR ao crédito' },
            { v: 'Multi-parceiros', l: 'Sua operação enviada a vários financiadores' },
          ].map((k) => (
            <div key={k.l} className="card">
              <p className="text-xl font-extrabold text-brand-700 dark:text-brand-400">{k.v}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{k.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/register" className="btn-primary inline-flex">Simular meu crédito em {c.name}</Link>
        </div>

        <div className="mt-14">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Como funciona</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre-se, envie seus documentos no data room, gere seu Score ConectCampo e receba propostas de instituições
            compatíveis com o seu perfil — tudo online, sem sair de {c.name}.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
