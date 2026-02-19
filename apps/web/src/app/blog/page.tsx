import { PublicLayout } from '@/components/landing/PublicLayout';
import { ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';

const posts = [
  {
    slug: '#',
    tag: 'Crédito Rural',
    date: 'Fevereiro 2026',
    title: 'Como o PRONAMP pode impulsionar seu negócio no campo em 2026',
    description: 'Entenda as condições do PRONAMP este ano, quem pode acessar e como a ConectCampo facilita a captação de recursos para modernização da sua propriedade.',
  },
  {
    slug: '#',
    tag: 'Agronegócio',
    date: 'Janeiro 2026',
    title: 'CPR verde e ESG: o crédito rural como ferramenta de sustentabilidade',
    description: 'O mercado de capitais está cada vez mais olhando para o agro sustentável. Veja como CPRs verdes e FIAGROs ESG estão transformando o financiamento rural.',
  },
  {
    slug: '#',
    tag: 'Tecnologia',
    date: 'Janeiro 2026',
    title: 'Inteligência artificial no scoring de crédito agro: como funciona',
    description: 'O Score ConectCampo analisa dezenas de variáveis agronômicas e financeiras para dar às instituições financeiras uma visão completa do risco de cada produtor.',
  },
];

export default function BlogPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-white dark:from-dark-card dark:to-dark-bg px-6 py-24 lg:px-8 text-center">
        <span className="inline-block rounded-full bg-brand-100 dark:bg-brand-900/30 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400 mb-6">
          Blog ConectCampo
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Conteúdo sobre crédito rural
          <br />e <span className="text-brand-600">agronegócio</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Análises, notícias e guias práticos para produtores rurais, empresas do agro e
          instituições financeiras navegarem o mercado de crédito rural brasileiro.
        </p>
      </section>

      {/* Posts */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {posts.map((post) => (
            <article
              key={post.title}
              className="group rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-8 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="rounded-full bg-brand-100 dark:bg-brand-900/30 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-400">
                  {post.tag}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {post.date}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand-600 transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">{post.description}</p>
              <Link href={post.slug} className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                Ler artigo completo <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-brand-600 px-6 py-20 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Receba conteúdo no seu e-mail</h2>
        <p className="text-brand-100 mb-8 max-w-lg mx-auto">
          Cadastre-se para receber análises semanais sobre crédito rural, mercado de capitais agro e novidades da plataforma.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="seu@email.com"
            className="flex-1 rounded-lg px-4 py-3 text-gray-900 text-sm outline-none"
          />
          <button type="submit" className="bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors whitespace-nowrap">
            Inscrever-se
          </button>
        </form>
      </section>
    </PublicLayout>
  );
}
