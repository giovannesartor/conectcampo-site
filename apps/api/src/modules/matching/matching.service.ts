import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OperationStatus } from '@prisma/client';

const MATCH_WEIGHTS = {
  ticketFit: 0.25,
  guaranteeFit: 0.20,
  regionFit: 0.15,
  cropFit: 0.15,
  scoreFit: 0.15,
  operationTypeFit: 0.10,
};

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Motor de match: cruza operação com parceiros elegíveis
   */
  async runMatch(operationId: string) {
    const operation = await this.prisma.operationRequest.findUnique({
      where: { id: operationId },
      include: {
        producerProfile: true,
        riskScore: true,
      },
    });

    if (!operation) throw new NotFoundException('Operação não encontrada');
    if (!operation.riskScore) {
      throw new NotFoundException('Score não calculado. Execute o scoring primeiro.');
    }

    const partners = await this.prisma.partnerInstitution.findMany({
      where: { isActive: true, deletedAt: null },
    });

    const requestedAmount = Number(operation.requestedAmount);
    const score = operation.riskScore.score;
    const profile = operation.producerProfile;

    const matchResults = [];

    for (const partner of partners) {
      const factors = [];
      let totalScore = 0;

      // 1. Ticket fit
      const minTicket = Number(partner.minTicket);
      const maxTicket = Number(partner.maxTicket);
      const ticketFit =
        requestedAmount >= minTicket && (maxTicket === 0 || requestedAmount <= maxTicket)
          ? 100
          : requestedAmount < minTicket
            ? (requestedAmount / minTicket) * 100
            : maxTicket > 0
              ? Math.max(0, 100 - ((requestedAmount - maxTicket) / maxTicket) * 100)
              : 50;

      factors.push({
        name: 'Adequação de Ticket',
        weight: MATCH_WEIGHTS.ticketFit,
        score: Math.round(ticketFit),
        description: `Solicitado: R$ ${requestedAmount.toLocaleString()} | Range: R$ ${minTicket.toLocaleString()}–R$ ${maxTicket.toLocaleString()}`,
      });
      totalScore += ticketFit * MATCH_WEIGHTS.ticketFit;

      // 2. Guarantee fit
      const operationGuarantees = operation.guarantees;
      const acceptedGuarantees = partner.acceptedGuarantees;
      const guaranteeMatch = acceptedGuarantees.length === 0
        ? 100
        : operationGuarantees.length > 0
          ? (operationGuarantees.filter((g) => acceptedGuarantees.includes(g)).length /
              operationGuarantees.length) * 100
          : 0;

      factors.push({
        name: 'Garantias Aceitas',
        weight: MATCH_WEIGHTS.guaranteeFit,
        score: Math.round(guaranteeMatch),
        description: `${Math.round(guaranteeMatch)}% das garantias são aceitas`,
      });
      totalScore += guaranteeMatch * MATCH_WEIGHTS.guaranteeFit;

      // 3. Region fit
      const regionFit = partner.acceptedStates.length === 0 ||
        partner.acceptedStates.includes(profile.state)
        ? 100
        : 0;

      factors.push({
        name: 'Região',
        weight: MATCH_WEIGHTS.regionFit,
        score: regionFit,
        description: regionFit === 100 ? 'Região atendida' : 'Região não atendida',
      });
      totalScore += regionFit * MATCH_WEIGHTS.regionFit;

      // 4. Crop fit
      const cropFit = partner.acceptedCrops.length === 0
        ? 100
        : profile.crops.some((c) => partner.acceptedCrops.includes(c))
          ? 100
          : 0;

      factors.push({
        name: 'Cultura',
        weight: MATCH_WEIGHTS.cropFit,
        score: cropFit,
        description: cropFit === 100 ? 'Cultura aceita' : 'Cultura não aceita',
      });
      totalScore += cropFit * MATCH_WEIGHTS.cropFit;

      // 5. Score fit
      const scoreFit = score >= partner.minScore ? 100 : (score / partner.minScore) * 100;

      factors.push({
        name: 'Score Mínimo',
        weight: MATCH_WEIGHTS.scoreFit,
        score: Math.round(scoreFit),
        description: `Score: ${score} | Mínimo: ${partner.minScore}`,
      });
      totalScore += scoreFit * MATCH_WEIGHTS.scoreFit;

      // 6. Operation type fit
      const opTypeFit = partner.acceptedOperations.length === 0 ||
        partner.acceptedOperations.includes(operation.type)
        ? 100
        : 0;

      factors.push({
        name: 'Tipo de Operação',
        weight: MATCH_WEIGHTS.operationTypeFit,
        score: opTypeFit,
        description: opTypeFit === 100 ? 'Tipo aceito' : 'Tipo não aceito',
      });
      totalScore += opTypeFit * MATCH_WEIGHTS.operationTypeFit;

      const finalScore = Math.round(totalScore);

      // Só inclui parceiros com score > 30
      if (finalScore > 30) {
        matchResults.push({
          partnerId: partner.id,
          matchScore: finalScore,
          matchFactors: factors,
        });
      }
    }

    // Ordenar por score e atribuir rank
    matchResults.sort((a, b) => b.matchScore - a.matchScore);

    // Limpar matches anteriores
    await this.prisma.matchResult.deleteMany({
      where: { operationId },
    });

    // Salvar novos matches
    const saved = await Promise.all(
      matchResults.map((result, index) =>
        this.prisma.matchResult.create({
          data: {
            operationId,
            partnerId: result.partnerId,
            matchScore: result.matchScore,
            matchFactors: result.matchFactors,
            rank: index + 1,
          },
          include: { partner: true },
        }),
      ),
    );

    // Atualizar status
    await this.prisma.operationRequest.update({
      where: { id: operationId },
      data: { status: OperationStatus.MATCHING },
    });

    this.logger.log(`Match concluído: ${saved.length} parceiros encontrados para operação ${operationId}`);

    return {
      operationId,
      totalPartners: saved.length,
      matches: saved,
    };
  }

  async getMatches(operationId: string) {
    return this.prisma.matchResult.findMany({
      where: { operationId },
      include: { partner: true },
      orderBy: { rank: 'asc' },
    });
  }
}
