import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BLOG_POSTS, getPost } from '@/lib/blog-posts';

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) return { title: 'Artigo não encontrado' };
  const url = `https://conectcampo.digital/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: { title: post.title, description: post.excerpt, url, type: 'article' },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'ConectCampo' },
    publisher: { '@type': 'Organization', name: 'ConectCampo' },
    mainEntityOfPage: `https://conectcampo.digital/blog/${post.slug}`,
  };

  return (
    <main className="min-h-screen bg-white dark:bg-dark-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <article className="mx-auto max-w-2xl px-6 lg:px-8 pt-32 pb-20">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Voltar ao blog
        </Link>
        <span className="mt-6 inline-flex w-fit items-center rounded-full bg-brand-50 dark:bg-brand-950/30 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
          {post.category}
        </span>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white [text-wrap:balance]">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-gray-400">
          {new Date(post.date).toLocaleDateString('pt-BR')} · {post.readingMinutes} min de leitura
        </p>
        <div
          className="blog-content mt-8 text-gray-700 dark:text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        <div className="mt-12 rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-8 text-center">
          <h3 className="text-xl font-bold text-white">Pronto para conectar sua operação ao crédito certo?</h3>
          <p className="mt-2 text-sm text-brand-200">Simule em minutos e receba propostas de dezenas de instituições.</p>
          <Link href="/register" className="btn-primary mt-5 inline-flex">Simular meu crédito</Link>
        </div>
      </article>
      <Footer />
    </main>
  );
}
