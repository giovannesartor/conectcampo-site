/**
 * Fonte ÚNICA de preços e taxas da plataforma.
 * Qualquer valor monetário/percentual de cobrança deve vir daqui — evita
 * divergência entre serviços (Asaas, Valsa, CPR) e o frontend.
 */

export const PLAN_PRICES: Record<string, number> = {
  START: 299.0, // Produtor Rural
  PRO: 799.0, // Empresa
  COOPERATIVE: 2890.0, // Cooperativa
  CORPORATE: 0.0, // Instituição Financeira (grátis)
};

/** Dias de teste gratuito concedidos em todos os planos pagos. */
export const TRIAL_DAYS = 7;


export const PLAN_LABELS: Record<string, string> = {
  START: 'Produtor Rural',
  PRO: 'Empresa',
  COOPERATIVE: 'Cooperativa',
  CORPORATE: 'Instituição Financeira',
};

export const CPR_PRICING = {
  /** Custo de emissão de CPR Física (pagamento único). */
  fisicaFlat: 2500,
  /** Custo de emissão de CPR Financeira = % sobre o valor total. */
  financeiraRate: 0.03,
  /** Fee ConectCampo sobre operações de Captação. */
  captacaoFeeRate: 0.06,
};

/** Payload público de preços (consumido pelo frontend via GET /pricing). */
export function getPublicPricing() {
  return {
    trialDays: TRIAL_DAYS,
    plans: Object.entries(PLAN_PRICES).map(([key, price]) => ({
      key,
      label: PLAN_LABELS[key] ?? key,
      price,
    })),
    cpr: {
      fisicaFlat: CPR_PRICING.fisicaFlat,
      financeiraRatePct: CPR_PRICING.financeiraRate * 100,
      captacaoFeeRatePct: CPR_PRICING.captacaoFeeRate * 100,
    },
  };
}
