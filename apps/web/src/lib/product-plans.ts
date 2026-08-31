export interface ProductPlan {
  id: 'START' | 'PRO' | 'COOPERATIVE' | 'CORPORATE';
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  href: string;
}

/**
 * Fonte unica da oferta comercial publica. Mudancas de preco, limites ou
 * funcionalidades devem ser feitas aqui para manter a home e /planos iguais.
 */
export const PRODUCT_PLANS: ProductPlan[] = [
  {
    id: 'START',
    name: 'Plano Produtor Rural',
    price: 'R$ 299',
    period: '/mês',
    description: 'Para o produtor rural que quer organizar a propriedade e acessar crédito com mais clareza.',
    features: [
      'Perfil e gestão da propriedade (talhões e safras)',
      'Score ConectCampo de crédito',
      'Monitoramento por satélite (NDVI) e alertas de clima',
      'Cotações de commodities e câmbio',
      'Até 2 operações de crédito simultâneas',
      'Matching com financiadores',
      'Gestão de documentos',
      'Suporte por e-mail',
    ],
    cta: 'Começar 7 dias grátis',
    highlighted: false,
    href: '/register?plan=START',
  },
  {
    id: 'PRO',
    name: 'Plano Empresa',
    price: 'R$ 799',
    period: '/mês',
    description: 'Para empresas do agronegócio que precisam organizar crédito, CPRs e documentos em escala.',
    features: [
      'Tudo do Plano Produtor Rural',
      'Operações de crédito ilimitadas',
      'Score Premium com análise detalhada',
      'Prioridade no matching com financiadores',
      'CPR completa: minuta, PDF e assinatura digital',
      'Gestão de documentos avançada',
      'Relatórios e analytics da operação',
      'Suporte prioritário',
    ],
    cta: 'Começar 7 dias grátis',
    highlighted: false,
    href: '/register?plan=PRO',
  },
  {
    id: 'COOPERATIVE',
    name: 'Plano Cooperativa',
    price: 'R$ 2.890',
    period: '/mês',
    description: 'Para cooperativas que precisam acompanhar a carteira de crédito dos cooperados em uma visão consolidada.',
    features: [
      'Tudo do Plano Empresa',
      'Visão consolidada da carteira por cooperado',
      'Operações ativas, aprovadas e volume por cooperado',
      'Documentos e indicadores consolidados da carteira',
      'Exportação da carteira para análise',
      'Suporte dedicado com gerente de conta',
    ],
    cta: 'Começar 7 dias grátis',
    highlighted: true,
    href: '/register?plan=COOPERATIVE',
  },
  {
    id: 'CORPORATE',
    name: 'Instituição Financeira',
    price: 'Grátis',
    description: 'Para bancos, FIDCs, securitizadoras e FIAGROs que analisam e financiam operações do agro.',
    features: [
      'Deal flow de solicitações organizadas',
      'Filtros de perfil, operação e risco',
      'Análise, scoring e gestão de propostas',
      'Portfólio próprio da instituição',
      'Analytics do funil de crédito',
      'Compliance e rastreabilidade',
      'Suporte por e-mail e acompanhamento comercial',
    ],
    cta: 'Cadastre-se grátis',
    highlighted: false,
    href: '/register?plan=CORPORATE',
  },
];
