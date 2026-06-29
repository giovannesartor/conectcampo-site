import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RiskProfile, PartnerType, OperationStatus } from '@prisma/client';
import { AiService } from '../../common/ai/ai.service';

interface ScoreFactor {
  name: string;
  weight: number;
  value: number;
  maxValue: number;
  description: string;
}

export interface ScoreExplanation {
  source: 'ai' | 'rules';
  score: number;
  profile: string;
  summary: string;
  strengths: string[];
  improvements: { factor: string; action: string; potentialGain: number }[];
  disclaimer: string;
}

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

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

  // ── Explicação do score por IA (com fallback determinístico) ──────────────

  async explainScore(operationId: string): Promise<ScoreExplanation> {
    const riskScore = await this.prisma.riskScore.findUnique({
      where: { operationId },
    });
    if (!riskScore) {
      throw new NotFoundException('Score não calculado para esta operação.');
    }

    const factors = (riskScore.factors as unknown as ScoreFactor[]) ?? [];
    const score = riskScore.score;
    const profile = String(riskScore.profile);

    // 1) Tenta IA real (se ANTHROPIC_API_KEY estiver setado)
    if (this.ai.isEnabled()) {
      const ai = await this.requestAiExplanation(score, profile, factors);
      if (ai) return ai;
    }

    // 2) Fallback determinístico em regras (sempre funciona)
    return this.buildRuleBasedExplanation(score, profile, factors);
  }

  private async requestAiExplanation(
    score: number,
    profile: string,
    factors: ScoreFactor[],
  ): Promise<ScoreExplanation | null> {
    const system =
      'Você é um analista de crédito rural sênior da ConectCampo. ' +
      'Explique o score de crédito de um produtor em português do Brasil, de forma clara, ' +
      'objetiva e acionável, sem jargão financeiro excessivo. Nunca prometa aprovação. ' +
      'Responda SOMENTE com um objeto JSON válido, sem texto fora dele.';

    const factorsText = factors
      .map(
        (f) =>
          `- ${f.name}: ${Math.round(f.value)}/${f.maxValue} (peso ${Math.round(
            f.weight * 100,
          )}%) — ${f.description}`,
      )
      .join('\n');

    const prompt = `Score total: ${score}/100 (perfil de risco: ${profile}).
Fatores avaliados:
${factorsText}

Gere um JSON com este formato exato:
{
  "summary": "2 a 3 frases explicando o que esse score significa para o produtor e como os financiadores tendem a enxergá-lo",
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "improvements": [
    {"factor": "nome do fator", "action": "ação concreta para melhorar", "potentialGain": número estimado de pontos no score (1 a 25)}
  ]
}
Foque as melhorias nos fatores com menor pontuação e maior peso. Máximo 4 melhorias.`;

    const raw = await this.ai.complete({ system, prompt, maxTokens: 800 });
    const parsed = this.ai.parseJson<{
      summary?: string;
      strengths?: string[];
      improvements?: { factor?: string; action?: string; potentialGain?: number }[];
    }>(raw);

    if (!parsed || !parsed.summary) return null;

    return {
      source: 'ai',
      score,
      profile,
      summary: parsed.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements.slice(0, 4).map((i) => ({
            factor: i.factor ?? 'Fator',
            action: i.action ?? '',
            potentialGain: Math.max(1, Math.min(25, Math.round(i.potentialGain ?? 5))),
          }))
        : [],
      disclaimer:
        'Análise gerada por IA com base nos dados informados. Não constitui promessa de aprovação; cada instituição financeira aplica seus próprios critérios.',
    };
  }

  private buildRuleBasedExplanation(
    score: number,
    profile: string,
    factors: ScoreFactor[],
  ): ScoreExplanation {
    const category =
      score >= 80 ? 'excelente' : score >= 60 ? 'bom' : score >= 40 ? 'regular' : 'baixo';

    const sorted = [...factors].sort((a, b) => a.value / a.maxValue - b.value / b.maxValue);
    const weak = sorted.filter((f) => f.value / f.maxValue < 0.6);
    const strong = [...factors]
      .filter((f) => f.value / f.maxValue >= 0.7)
      .sort((a, b) => b.value / b.maxValue - a.value / a.maxValue);

    const summary =
      `Seu score é ${score}/100, considerado ${category} (perfil ${profile}). ` +
      (score >= 60
        ? 'Isso amplia seu acesso a bancos e fundos com melhores condições. '
        : 'Há espaço claro de melhoria para destravar condições mais competitivas. ') +
      (weak.length > 0
        ? `O maior ganho potencial está em: ${weak
            .slice(0, 2)
            .map((f) => f.name.toLowerCase())
            .join(' e ')}.`
        : 'Os fatores estão bem equilibrados — mantenha a consistência.');

    const strengths =
      strong.length > 0
        ? strong.slice(0, 3).map((f) => `${f.name}: ${f.description}`)
        : ['Cadastro iniciado — complete os dados para fortalecer seu perfil.'];

    const ACTIONS: Record<string, string> = {
      'Receita Anual': 'Comprove receita com notas fiscais e contratos de venda recorrentes.',
      Garantias: 'Aumente a cobertura de garantias (imóvel, safra, maquinário) frente ao valor pedido.',
      'Histórico Produtivo': 'Registre safras anteriores e produtividade para evidenciar consistência.',
      Endividamento: 'Reduza a relação dívida/receita quitando ou renegociando passivos.',
      'Fluxo de Caixa': 'Anexe extratos e projeções que mostrem caixa regular e suficiente.',
      'Histórico de Crédito': 'Regularize restrições e mantenha pagamentos em dia.',
      Seguro: 'Contrate seguro rural — demonstra gestão de risco e melhora o rating.',
    };

    const improvements = weak.slice(0, 4).map((f) => {
      const gapRatio = 1 - f.value / f.maxValue;
      const potentialGain = Math.max(1, Math.round(gapRatio * f.weight * 100));
      return {
        factor: f.name,
        action: ACTIONS[f.name] ?? `Melhore o fator "${f.name}" para elevar seu score.`,
        potentialGain,
      };
    });

    return {
      source: 'rules',
      score,
      profile,
      summary,
      strengths,
      improvements,
      disclaimer:
        'Análise automática baseada nos seus fatores de score. Não constitui promessa de aprovação; cada instituição financeira aplica seus próprios critérios.',
    };
  }
}
