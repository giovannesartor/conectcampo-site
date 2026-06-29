'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="relative overflow-hidden py-24 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
      {/* depth: radial glow + dot grid */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(600px 300px at 50% -10%, rgba(41,206,114,0.35), transparent 60%)' }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
      <div className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-extrabold text-white sm:text-5xl">
            Pronto para conectar sua operação ao crédito certo?
          </h2>
          <p className="mt-6 text-lg text-brand-200 max-w-2xl mx-auto">
            Cadastre-se gratuitamente e descubra em minutos as melhores
            oportunidades de crédito para o seu negócio agro.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-brand-700 shadow-lg transition-all hover:bg-gray-100"
            >
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 backdrop-blur px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/20"
            >
              Agendar Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
