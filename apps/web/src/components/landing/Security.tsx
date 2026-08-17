'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileCheck, Scale, UserCheck } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Privacidade e LGPD',
    description: 'Consentimento explícito e controles para acesso e gestão de dados pessoais.',
  },
  {
    icon: Lock,
    title: 'Transporte protegido',
    description: 'Comunicação em produção protegida por HTTPS/TLS.',
  },
  {
    icon: Eye,
    title: 'Trilha de auditoria',
    description: 'Eventos administrativos e ações relevantes registrados para rastreabilidade.',
  },
  {
    icon: FileCheck,
    title: 'Controle de acesso',
    description: 'RBAC granular. Cada instituição vê apenas o que foi autorizado.',
  },
  {
    icon: Scale,
    title: 'Controles administrativos',
    description: 'Perfis de acesso e rotas administrativas protegidas por função.',
  },
  {
    icon: UserCheck,
    title: 'Verificação cadastral',
    description: 'Dados de CPF/CNPJ, perfil e documentos organizados para análise.',
  },
];

export function Security() {
  return (
    <section id="seguranca" className="py-24 bg-warm-50 dark:bg-dark-card/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title">Segurança e controle por padrão</h2>
          <p className="section-subtitle">
            Camadas objetivas de autenticação, autorização, privacidade e rastreabilidade em toda a plataforma.
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
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-warm-100 dark:bg-warm-900/10">
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
