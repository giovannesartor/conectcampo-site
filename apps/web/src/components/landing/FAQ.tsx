'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'O que é a ConectCampo?',
    answer:
      'A ConectCampo é um marketplace de crédito rural que conecta produtores rurais e empresas do agronegócio diretamente a bancos, cooperativas, FIDCs, securitizadoras e FIAGROs. Usamos inteligência artificial para fazer o matching ideal entre quem precisa de crédito e quem oferece as melhores condições.',
  },
  {
    question: 'Quais tipos de crédito estão disponíveis?',
    answer:
      'A plataforma oferece acesso a diversas modalidades: CPR Financeira, CPR Física, CDCA, CRA, LCA e FIAGRO. Trabalhamos com operações de custeio, investimento, capital de giro e mercado de capitais, com valores a partir de R$ 50 mil.',
  },
  {
    question: 'Preciso pagar para usar a plataforma?',
    answer:
      'Oferecemos quatro planos: o Plano Produtor Rural (R$ 299/mês) para produtores pessoa física, o Plano Empresa (R$ 799/mês) para empresas do agronegócio, o Plano Cooperativa (R$ 2.890/mês) para cooperativas agropecuárias, e o plano para Instituições Financeiras, que é gratuito, pois são elas que fornecem o crédito aos produtores.',
  },
  {
    question: 'Como funciona o Score ConectCampo?',
    answer:
      'Nosso Score proprietário analisa dezenas de variáveis agronômicas, financeiras e de mercado — incluindo histórico de produção, garantias, localização, safra, perfil da cultura e dados do produtor — para gerar uma pontuação de crédito específica para o agro que facilita a análise pelas instituições financeiras.',
  },
  {
    question: 'Qual o prazo médio para aprovação?',
    answer:
      'O prazo médio de aprovação na ConectCampo é de 48 horas, significativamente menor que o processo tradicional que pode levar semanas. Após enviar a documentação, nosso sistema faz a pré-análise automaticamente e conecta sua operação às instituições mais adequadas.',
  },
  {
    question: 'Como funciona para instituições financeiras?',
    answer:
      'Instituições parceiras têm acesso a uma base curada de tomadores de crédito com scoring pré-qualificado, dados de produção validados e operações já documentadas. Oferecemos API RESTful para integração, dashboard de gestão, conformidade com regulação do Banco Central e gerente de conta dedicado.',
  },
  {
    question: 'Meus dados estão seguros?',
    answer:
      'Sim. A ConectCampo utiliza criptografia end-to-end, está em conformidade com a LGPD, implementa autenticação multi-fator e passa por auditorias de segurança regulares. Toda a infraestrutura segue padrões bancários de proteção de dados e as operações possuem rastreabilidade completa.',
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-dark-border last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-brand-600"
      >
        <span className="text-base font-medium text-gray-900 dark:text-white pr-4">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-brand-600' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/20 mb-4">
            <HelpCircle className="h-4 w-4" />
            Perguntas Frequentes
          </div>
          <h2 className="section-title">Tire suas dúvidas</h2>
          <p className="section-subtitle">
            As respostas para as perguntas mais comuns sobre a ConectCampo
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-8"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
