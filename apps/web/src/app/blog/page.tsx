import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BLOG_POSTS } from '@/lib/blog-posts';

export const metadata: Metadata = {
  title: 'Blog — Crédito Rural, CPR e Agro',
  description:
    'Conteúdo sobre crédito rural, CPR, FIDC, CRA, FIAGRO e score de crédito para produtores e empresas do agronegócio.',
  alternates: { canonical: 'https://conectcampo.digital/blog' },
};

export default function BlogIndex() {
  const posts = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <main className="min-h-screen bg-white dark:bg-dark-bg">
      <Header />
      <section className="mx-auto max-w-4xl px-6 lg:px-8 pt-32 pb-20">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Blog</span>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Crédito agro, sem complicação
        </h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Guias práticos sobre crédito rural, CPR, mercado de capitais e como conseguir as melhores condições para a sua operação.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="card card-hover flex flex-col">
              <span className="inline-flex w-fit items-center rounded-full bg-brand-50 dark:bg-brand-950/30 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                {p.category}
              </span>
              <h2 className="mt-3 text-lg font-bold text-gray-900 dark:text-white [text-wrap:balance]">{p.title}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex-1">{p.excerpt}</p>
              <p className="mt-4 text-xs text-gray-400">
                {new Date(p.date).toLocaleDateString('pt-BR')} · {p.readingMinutes} min de leitura
              </p>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
