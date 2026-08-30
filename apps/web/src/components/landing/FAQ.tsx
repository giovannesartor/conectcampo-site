'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'O que é a ConectCampo?',
    answer:
      'A ConectCampo é uma plataforma de crédito rural que organiza operações de produtores e empresas do agronegócio e aplica critérios de perfil e elegibilidade para aproximá-las de fontes compatíveis. A decisão e as condições finais pertencem a cada instituição.',
  },
  {
    question: 'Quais tipos de crédito estão disponíveis?',
    answer:
      'A plataforma organiza solicitações de custeio, investimento, capital de giro e operações estruturadas, incluindo CPR Física e Financeira. A disponibilidade, a modalidade e as condições finais dependem das instituições participantes e da análise de cada operação.',
  },
  {
    question: 'Como funciona a CPR e quanto custa a emissão?',
    answer:
      'Você preenche os dados das partes, do produto, do valor de face, das garantias e do cronograma; a plataforma gera a minuta completa e o PDF, coleta assinaturas e acompanha o status do registro. Na CPR Financeira, o custo ConectCampo é de 0,8% do valor de face. Emolumentos, registro, tributos e encargos do credor, quando existirem, são separados. A minuta deve ser conferida e não substitui aconselhamento jurídico nem comprovante oficial da registradora.',
  },
  {
    question: 'Preciso pagar para usar a plataforma?',
    answer:
      'Oferecemos quatro planos: o Plano Produtor Rural (R$ 299/mês) para produtores pessoa física, o Plano Empresa (R$ 799/mês) para empresas do agronegócio, o Plano Cooperativa (R$ 2.890/mês) para cooperativas agropecuárias, e o plano para Instituições Financeiras, que é gratuito, pois são elas que fornecem o crédito aos produtores.',
  },
  {
    question: 'Como funciona o Score ConectCampo?',
    answer:
      'O Score organiza os dados disponíveis da operação — como produção, garantias, localização, safra, documentos e informações financeiras — em indicadores de apoio à análise. Ele não é promessa de aprovação, não substitui a política de crédito da instituição e melhora conforme os dados são completados e verificados.',
  },
  {
    question: 'Qual o prazo médio para aprovação?',
    answer:
      'O prazo depende da documentação, do perfil da operação e da instituição responsável pela decisão. A plataforma agiliza o envio, a organização e o acompanhamento da pré-análise, mas não promete aprovação nem um prazo único.',
  },
  {
    question: 'Como funciona para instituições financeiras?',
    answer:
      'Instituições cadastradas podem analisar operações organizadas, aplicar filtros de perfil e risco, gerir propostas e integrar fluxos pela API. O acesso aos dados respeita as permissões e os consentimentos definidos na plataforma.',
  },
  {
    question: 'Como funciona o marketplace de grãos e o pagamento seguro?',
    answer:
      'No marketplace você compra e vende grãos direto com outros produtores. O pagamento é feito em custódia (escrow): o comprador paga via ValsaPay, o ConectCampo retém o valor e só libera ao vendedor depois que o comprador confirma o recebimento — protegendo as duas partes. A taxa é de apenas 1% por venda (0,5% de cada parte). Há ainda avaliações (reputação) e liberação automática após o prazo de entrega.',
  },
  {
    question: 'O que é o monitoramento por satélite (NDVI)?',
    answer:
      'Cadastrando os talhões da sua fazenda, a plataforma acompanha a saúde da lavoura por imagens de satélite (índice NDVI), mostrando o vigor da vegetação ao longo da safra. Isso ajuda a identificar problemas cedo, compõe o score de risco de safra e fortalece a análise de crédito. Usamos a Planet Insights Platform (Sentinel-2), com série temporal por talhão.',
  },
  {
    question: 'Meus dados estão seguros?',
    answer:
      'A plataforma usa HTTPS/TLS em produção, autenticação por token, controle de acesso por função, consentimento LGPD e trilha de auditoria para ações relevantes. Nenhum sistema elimina todo risco; por isso os controles e registros são revisados continuamente.',
  },
];

function FAQItem({
  id,
  question,
  answer,
  isOpen,
  onToggle,
}: {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-dark-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-answer`}
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
            id={`${id}-answer`}
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
    <section className="py-24 px-6 lg:px-8 bg-white dark:bg-dark-bg">
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
              key={faq.question}
              id={`faq-${i}`}
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
