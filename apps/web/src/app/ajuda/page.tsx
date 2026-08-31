'use client';

import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
import { PublicLayout } from '@/components/landing/PublicLayout';
import { FAQ } from '@/components/landing/FAQ';

export default function AjudaPage() {
  return (
    <PublicLayout>
      <section className="border-b border-warm-200 bg-warm-50 px-6 py-16 text-center dark:border-dark-border dark:bg-dark-card lg:px-8">
        <span className="section-kicker">Central de ajuda</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
          Respostas claras para avançar com segurança
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Entenda crédito, CPR, planos, segurança e os principais fluxos da plataforma.
        </p>
      </section>
      <FAQ />
      <section className="px-6 pb-20 text-center lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-brand-100 bg-brand-50 p-8 dark:border-brand-900 dark:bg-brand-950/20">
          <Mail className="mx-auto h-7 w-7 text-brand-700 dark:text-brand-400" />
          <h2 className="mt-3 text-xl font-bold text-gray-950 dark:text-white">Ainda ficou alguma dúvida?</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Nosso time ajuda você a entender o fluxo ideal para a sua operação.</p>
          <Link href="/contato" className="btn-primary mt-5">
            Falar com o time <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
