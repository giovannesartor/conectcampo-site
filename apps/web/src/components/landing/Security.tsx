'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileCheck, Scale, UserCheck } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'LGPD Compliant',
    description: 'Totalmente aderente à Lei Geral de Proteção de Dados.',
  },
  {
    icon: Lock,
    title: 'Criptografia total',
    description: 'Dados criptografados em repouso e em trânsito (TLS).',
  },
  {
    icon: Eye,
    title: 'Auditoria completa',
    description: 'Logs imutáveis de todas as ações na plataforma.',
  },
  {
    icon: FileCheck,
    title: 'Controle de acesso',
    description: 'RBAC granular. Cada instituição vê apenas o que foi autorizado.',
  },
  {
    icon: Scale,
    title: 'Compliance regulatório',
    description: 'Arquitetado para operação como correspondente bancário ou fintech regulada.',
  },
  {
    icon: UserCheck,
    title: 'KYC integrado',
    description: 'Verificação de identidade e consentimento explícito.',
  },
];

export function Security() {
  return (
    <section id="seguranca" className="py-24 bg-gray-50 dark:bg-dark-card/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title">Segurança de nível bancário</h2>
          <p className="section-subtitle">
            Seus dados e documentos protegidos com os mais altos padrões de segurança do mercado financeiro.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex gap-4"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500/10 dark:bg-brand-500/5">
                <feature.icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
