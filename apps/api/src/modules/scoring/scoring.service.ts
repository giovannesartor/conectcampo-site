import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RiskProfile, PartnerType, OperationStatus } from '@prisma/client';

const SCORE_WEIGHTS = {
  annualRevenue: 0.20,
  productionHistory: 0.15,
  guarantees: 0.20,
  debtRatio: 0.15,
  cashFlow: 0.15,
  creditHistory: 0.10,
  insurance: 0.05,
};

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcula o risk score para uma operação
   */
  async calculateScore(operationId: string) {
    const operation = await this.prisma.operationRequest.findUnique({
      where: { id: operationId },
      include: {
        producerProfile: {
          include: { financialProfile: true },
        },
      },
    });

    if (!operation) throw new NotFoundException('Operação não encontrada');

    const profile = operation.producerProfile;
    const financial = profile.financialProfile;

    if (!financial) {
      throw new NotFoundException('Perfil financeiro não encontrado. Preencha antes de gerar o score.');
    }

    // ── Calcular fatores ──
    const factors = [];

    // 1. Receita anual (normalizada 0-100)
    const revenueScore = this.normalizeRevenue(Number(financial.annualRevenue));
    factors.push({
      name: 'Receita Anual',
      weight: SCORE_WEIGHTS.annualRevenue,
      value: revenueScore,
      maxValue: 100,
      description: `Receita: R$ ${Number(financial.annualRevenue).toLocaleString('pt-BR')}`,
    });

    // 2. Histórico produtivo
    const historyScore = Math.min(profile.yearsInActivity * 10, 100);
    factors.push({
      name: 'Histórico Produtivo',
      weight: SCORE_WEIGHTS.productionHistory,
      value: historyScore,
      maxValue: 100,
      description: `${profile.yearsInActivity} anos de atividade`,
    });

    // 3. Garantias
    const guaranteeRatio = Number(financial.guaranteeValue) > 0
      ? (Number(financial.guaranteeValue) / Number(operation.requestedAmount)) * 100
      : 0;
    const guaranteeScore = Math.min(guaranteeRatio, 100);
    factors.push({
      name: 'Garantias',
      weight: SCORE_WEIGHTS.guarantees,
      value: guaranteeScore,
      maxValue: 100,
      description: `Cobertura: ${guaranteeRatio.toFixed(0)}%`,
    });

    // 4. Endividamento
    const debtRatio = Number(financial.debtToRevenueRatio);
    const debtScore = Math.max(0, 100 - debtRatio * 200); // 50% debt = 0
    factors.push({
      name: 'Endividamento',
      weight: SCORE_WEIGHTS.debtRatio,
      value: debtScore,
      maxValue: 100,
      description: `Debt-to-revenue: ${(debtRatio * 100).toFixed(1)}%`,
    });

    // 5. Fluxo de caixa
    const cashFlowValues = financial.cashFlowMonthly.map(Number);
    const avgCashFlow = cashFlowValues.length > 0
      ? cashFlowValues.reduce((a, b) => a + b, 0) / cashFlowValues.length
      : 0;
    const cashFlowScore = avgCashFlow > 0
      ? Math.min((avgCashFlow / (Number(operation.requestedAmount) / 12)) * 100, 100)
      : 0;
    factors.push({
      name: 'Fluxo de Caixa',
      weight: SCORE_WEIGHTS.cashFlow,
      value: cashFlowScore,
      maxValue: 100,
      description: `Média mensal: R$ ${avgCashFlow.toLocaleString('pt-BR')}`,
    });

    // 6. Histórico de crédito
    const creditScore = Math.min(financial.creditHistoryYears * 15, 100);
    const negativePenalty = financial.hasNegativeRecords ? -30 : 0;
    factors.push({
      name: 'Histórico de Crédito',
      weight: SCORE_WEIGHTS.creditHistory,
      value: Math.max(0, creditScore + negativePenalty),
      maxValue: 100,
      description: financial.hasNegativeRecords
        ? 'Possui restrições'
        : `${financial.creditHistoryYears} anos de histórico`,
    });

    // 7. Seguro
    const insuranceScore = profile.hasInsurance ? 100 : 0;
    factors.push({
      name: 'Seguro',
      weight: SCORE_WEIGHTS.insurance,
      value: insuranceScore,
      maxValue: 100,
      description: profile.hasInsurance ? 'Possui seguro rural' : 'Sem seguro rural',
    });

    // ── Score final ponderado ──
    const totalScore = Math.round(
      factors.reduce((acc, f) => acc + f.value * f.weight, 0),
    );

    // ── Perfil de risco ──
    const riskProfile = this.determineRiskProfile(totalScore);

    // ── Elegibilidade automática ──
    const eligibility = this.calculateEligibility(totalScore, profile.tier, Number(operation.requestedAmount));

    // ── Salvar ──
    const riskScore = await this.prisma.riskScore.create({
      data: {
        producerProfileId: profile.id,
        operationId,
        score: totalScore,
        profile: riskProfile,
        factors,
        eligibility,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 dias
      },
    });

    // Atualizar status da operação
    await this.prisma.operationRequest.update({
      where: { id: operationId },
      data: { status: OperationStatus.SCORING },
    });

    this.logger.log(`Score calculado: ${totalScore} (${riskProfile}) para operação ${operationId}`);

    return riskScore;
  }

  async getScoreByOperation(operationId: string) {
    return this.prisma.riskScore.findUnique({
      where: { operationId },
    });
  }

  private normalizeRevenue(revenue: number): number {
    if (revenue >= 50_000_000) return 100;
    if (revenue >= 5_000_000) return 80;
    if (revenue >= 500_000) return 60;
    if (revenue >= 100_000) return 40;
    return 20;
  }

  private determineRiskProfile(score: number): RiskProfile {
    if (score >= 70) return RiskProfile.CONSERVADOR;
    if (score >= 40) return RiskProfile.MODERADO;
    return RiskProfile.ESTRUTURADO;
  }

  private calculateEligibility(score: number, tier: string, amount: number) {
    const eligibility = [];

    eligibility.push({
      partnerType: PartnerType.BANCO,
      eligible: score >= 60,
      reason: score >= 60 ? 'Score adequado para bancos' : 'Score mínimo: 60',
      maxAmount: score >= 60 ? amount : 0,
    });

    eligibility.push({
      partnerType: PartnerType.COOPERATIVA,
      eligible: score >= 40,
      reason: score >= 40 ? 'Elegível para cooperativas' : 'Score mínimo: 40',
      maxAmount: score >= 40 ? amount : 0,
    });

    eligibility.push({
      partnerType: PartnerType.FIDC,
      eligible: score >= 50 && (tier === 'FAIXA_B' || tier === 'FAIXA_C' || tier === 'FAIXA_D'),
      reason: tier === 'FAIXA_A'
        ? 'FIDC requer faixa B ou superior'
        : score < 50
          ? 'Score mínimo: 50'
          : 'Elegível para FIDC',
      maxAmount: score >= 50 ? amount : 0,
    });

    eligibility.push({
      partnerType: PartnerType.SECURITIZADORA,
      eligible: score >= 65 && (tier === 'FAIXA_C' || tier === 'FAIXA_D'),
      reason: 'CRA requer faixa C+ e score 65+',
      maxAmount: score >= 65 ? amount : 0,
    });

    eligibility.push({
      partnerType: PartnerType.FIAGRO,
      eligible: score >= 55,
      reason: score >= 55 ? 'Elegível para FIAGRO' : 'Score mínimo: 55',
      maxAmount: score >= 55 ? amount : 0,
    });

    eligibility.push({
      partnerType: PartnerType.MERCADO_CAPITAIS,
      eligible: score >= 70 && tier === 'FAIXA_D',
      reason: 'Mercado de capitais requer faixa D e score 70+',
      maxAmount: score >= 70 ? amount : 0,
    });

    return eligibility;
  }
}
