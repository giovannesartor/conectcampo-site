'use client';

import { motion } from 'framer-motion';
import { Wheat, Factory, Building2, Globe2 } from 'lucide-react';

const segments = [
  {
    icon: Wheat,
    tier: 'Faixa A',
    title: 'Pequeno Produtor',
    range: 'Até R$ 500 mil',
    color: 'from-green-500 to-green-600',
    features: [
      'Crédito rápido e simplificado',
      'Documentação mínima',
      'Cooperativas e bancos regionais',
      'CPR simplificada',
    ],
  },
  {
    icon: Factory,
    tier: 'Faixa B',
    title: 'Médio Produtor',
    range: 'R$ 500 mil a R$ 5M',
    color: 'from-blue-500 to-blue-600',
    features: [
      'Bancos + FIDC',
      'CPR e recebíveis',
      'Garantias híbridas',
      'Data room completo',
    ],
  },
  {
    icon: Building2,
    tier: 'Faixa C',
    title: 'Grande Produtor',
    range: 'R$ 5M a R$ 50M',
    color: 'from-purple-500 to-purple-600',
    features: [
      'FIDC estruturado',
      'CRA (Certificado de Recebíveis)',
      'Notas comerciais',
      'Data room avançado',
    ],
  },
  {
    icon: Globe2,
    tier: 'Faixa D',
    title: 'Agroindústria',
    range: 'R$ 50M+',
    color: 'from-amber-500 to-amber-600',
    features: [
      'Mercado de capitais',
      'Estruturação complexa',
      'Governança e auditoria',
      'M&A e captações',
    ],
  },
];

export function Segments() {
  return (
    <section id="segmentacao" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title">Para cada tamanho, a solução certa</h2>
          <p className="section-subtitle">
            Nossa plataforma adapta automaticamente as exigências e oportunidades conforme o porte da sua operação.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {segments.map((segment, index) => (
            <motion.div
              key={segment.tier}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card hover:shadow-lg transition-shadow duration-300 group flex flex-col"
            >
              {/* Icon */}
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${segment.color} text-white`}>
                <segment.icon className="h-6 w-6" />
              </div>

              {/* Divider that creates clear separation from icon */}
              <div className="mt-5 mb-4 border-t border-gray-100 dark:border-dark-border" />

              {/* Tier badge + title + range */}
              <div>
                <span className={`inline-block rounded-full bg-gradient-to-r ${segment.color} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white`}>
                  {segment.tier}
                </span>
                <h3 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                  {segment.title}
                </h3>
                <p className="mt-0.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
                  {segment.range}
                </p>
              </div>

              <ul className="mt-5 space-y-2 flex-1">
                {segment.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
