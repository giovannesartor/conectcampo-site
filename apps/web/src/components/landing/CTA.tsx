'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="relative overflow-hidden border-y border-brand-700 bg-gradient-to-br from-brand-800 to-brand-950 py-24">
      <div className="grain-overlay absolute inset-0" />
      <div className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-extrabold tracking-[-0.025em] text-white sm:text-5xl">
            Pronto para conectar sua operação ao crédito certo?
          </h2>
          <p className="mt-6 text-lg text-brand-200 max-w-2xl mx-auto">
            Organize sua operação, complete os dados e encontre fontes de crédito
            compatíveis com o seu perfil em um único fluxo.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-8 py-3 text-base font-semibold text-brand-800 shadow-lg transition-colors hover:bg-brand-50"
            >
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/contato"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Agendar Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
