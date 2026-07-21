'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="relative overflow-hidden py-24 bg-soil-gradient">
      {/* Crop rows overlay */}
      <div className="pointer-events-none absolute inset-0 crop-rows-dark opacity-20" />
      <div className="soil-grain absolute inset-0" />

      {/* Lens flare top — natural, not AI */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-palha-50/6 to-transparent" />

      <div className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-extrabold text-white sm:text-5xl font-serif">
            Pronto para conectar sua operação ao crédito certo?
          </h2>
          <p className="mt-6 text-lg text-terra-200 max-w-2xl mx-auto">
            Cadastre-se gratuitamente e descubra em minutos as melhores
            oportunidades de crédito para o seu negócio agro.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-palha-500 px-8 py-4 text-base font-semibold text-terra-900 shadow-lg shadow-black/25 transition-all hover:bg-palha-400"
            >
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center justify-center rounded-lg border border-terra-300/40 bg-white/5 backdrop-blur px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
            >
              Agendar Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
