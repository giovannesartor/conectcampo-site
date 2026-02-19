import { ProducerTier } from '@conectcampo/types';

/**
 * Tabela de comissões por faixa
 */
export const COMMISSION_RATES: Record<ProducerTier, { min: number; max: number; fixedFee?: number }> = {
  [ProducerTier.FAIXA_A]: { min: 0.005, max: 0.015 },
  [ProducerTier.FAIXA_B]: { min: 0.01, max: 0.025 },
  [ProducerTier.FAIXA_C]: { min: 0.015, max: 0.04 },
  [ProducerTier.FAIXA_D]: { min: 0.02, max: 0.05, fixedFee: 50000 },
};

/**
 * Calcula comissão da operação
 */
export function calculateCommission(
  tier: ProducerTier,
  amount: number,
  customRate?: number,
): { rate: number; value: number; fixedFee: number; total: number } {
  const tierConfig = COMMISSION_RATES[tier];
  const rate = customRate ?? tierConfig.min;
  const clampedRate = Math.min(Math.max(rate, tierConfig.min), tierConfig.max);
  const commissionValue = amount * clampedRate;
  const fixedFee = tierConfig.fixedFee ?? 0;
  const total = commissionValue + fixedFee;

  return {
    rate: clampedRate,
    value: commissionValue,
    fixedFee,
    total,
  };
}

/**
 * Determina faixa do produtor baseado na receita anual
 */
export function determineTier(annualRevenue: number): ProducerTier {
  if (annualRevenue <= 500_000) return ProducerTier.FAIXA_A;
  if (annualRevenue <= 5_000_000) return ProducerTier.FAIXA_B;
  if (annualRevenue <= 50_000_000) return ProducerTier.FAIXA_C;
  return ProducerTier.FAIXA_D;
}
