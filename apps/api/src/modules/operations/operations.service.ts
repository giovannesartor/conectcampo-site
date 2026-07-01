import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OperationStatus, PartnerType, ProposalStatus } from '@prisma/client';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, data: any) {
    const profile = await this.prisma.producerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Perfil de produtor não encontrado. Crie o perfil primeiro.');
    }

    return this.prisma.operationRequest.create({
      data: {
        producerProfileId: profile.id,
        type: data.type,
        requestedAmount: data.requestedAmount,
        termMonths: data.termMonths,
        purpose: data.purpose,
        guarantees: data.guarantees ?? [],
        guaranteeValue: data.guaranteeValue ?? 0,
        notes: data.notes,
        status: OperationStatus.DRAFT,
      },
    });
  }

  async getUserProposals(userId: string) {
    const profile = await this.prisma.producerProfile.findUnique({ where: { userId } });
    if (!profile) return [];

    return this.prisma.proposal.findMany({
      where: {
        operation: { producerProfileId: profile.id },
      },
      include: {
        partner: { select: { id: true, name: true, type: true } },
        operation: { select: { id: true, type: true, requestedAmount: true, purpose: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Instituição financeira / parceiro envia uma proposta para uma operação.
   * Resolve (ou cria) a PartnerInstitution vinculada ao CNPJ do usuário.
   */
  async createProposal(userId: string, dto: CreateProposalDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const operation = await this.prisma.operationRequest.findFirst({
      where: { id: dto.operationId, deletedAt: null },
      include: { producerProfile: { select: { userId: true } } },
    });
    if (!operation) throw new NotFoundException('Operação não encontrada');

    const partner = await this.resolvePartnerForUser(user);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const proposal = await this.prisma.proposal.create({
      data: {
        operationId: dto.operationId,
        partnerId: partner.id,
        amount: dto.amount,
        interestRate: dto.interestRate,
        termMonths: dto.termMonths,
        conditions: dto.notes,
        status: ProposalStatus.PENDING,
        validUntil,
      },
    });

    // Sinaliza que a operação recebeu propostas
    const advanceable: OperationStatus[] = [
      OperationStatus.SUBMITTED,
      OperationStatus.SCORING,
      OperationStatus.MATCHING,
    ];
    if (advanceable.includes(operation.status)) {
      await this.prisma.operationRequest.update({
        where: { id: operation.id },
        data: { status: OperationStatus.PROPOSALS_RECEIVED },
      });
    }

    // Notifica o produtor dono da operação (tempo real via SSE)
    const ownerId = operation.producerProfile?.userId;
    if (ownerId) {
      void this.notifications.create({
        userId: ownerId,
        type: 'success',
        title: 'Nova proposta recebida',
        message: `${partner.name} enviou uma proposta para sua operação.`,
        link: '/dashboard/proposals',
      });
    }

    return proposal;
  }

  /**
   * Produtor aceita uma proposta recebida.
   */
  async acceptProposal(proposalId: string, userId: string, userRole?: string) {
    const proposal = await this.getProposalForProducer(proposalId, userId, userRole);

    const updated = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.ACCEPTED, respondedAt: new Date() },
    });

    // Recusa automaticamente as demais propostas pendentes da mesma operação
    await this.prisma.proposal.updateMany({
      where: {
        operationId: proposal.operationId,
        id: { not: proposalId },
        status: ProposalStatus.PENDING,
      },
      data: { status: ProposalStatus.REJECTED, respondedAt: new Date() },
    });

    await this.prisma.operationRequest.update({
      where: { id: proposal.operationId },
      data: { status: OperationStatus.ACCEPTED },
    });

    return updated;
  }

  /**
   * Produtor recusa uma proposta recebida.
   */
  async rejectProposal(proposalId: string, userId: string, userRole?: string) {
    await this.getProposalForProducer(proposalId, userId, userRole);

    return this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.REJECTED, respondedAt: new Date() },
    });
  }

  private async getProposalForProducer(proposalId: string, userId: string, userRole?: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        operation: {
          include: { producerProfile: { select: { userId: true } } },
        },
      },
    });

    if (!proposal) throw new NotFoundException('Proposta não encontrada');
    if (userRole !== 'ADMIN' && proposal.operation.producerProfile.userId !== userId) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    return proposal;
  }

  private async resolvePartnerForUser(user: { id: string; name: string; email: string; phone: string | null; cnpj: string | null }) {
    if (user.cnpj) {
      const existing = await this.prisma.partnerInstitution.findUnique({
        where: { cnpj: user.cnpj },
      });
      if (existing) return existing;
    }

    return this.prisma.partnerInstitution.create({
      data: {
        name: user.name,
        type: PartnerType.BANCO,
        cnpj: user.cnpj ?? `USER-${user.id}`,
        contactEmail: user.email,
        contactPhone: user.phone ?? undefined,
      },
    });
  }


  async findAll(userId: string, page = 1, perPage = 10) {
    const profile = await this.prisma.producerProfile.findUnique({
      where: { userId },
    });
    if (!profile) return { data: [], meta: { total: 0, page, perPage, totalPages: 0 } };

    const [data, total] = await Promise.all([
      this.prisma.operationRequest.findMany({
        where: { producerProfileId: profile.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          riskScore: true,
          proposals: { orderBy: { createdAt: 'desc' } },
          _count: { select: { matchResults: true, documents: true } },
        },
      }),
      this.prisma.operationRequest.count({
        where: { producerProfileId: profile.id, deletedAt: null },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async findById(id: string, userId: string, userRole?: string) {
    const operation = await this.prisma.operationRequest.findUnique({
      where: { id },
      include: {
        producerProfile: { include: { user: { select: { id: true } } } },
        documents: true,
        riskScore: true,
        matchResults: {
          include: { partner: true },
          orderBy: { rank: 'asc' },
        },
        proposals: {
          include: { partner: true },
          orderBy: { createdAt: 'desc' },
        },
        contract: true,
      },
    });

    if (!operation) throw new NotFoundException('Operação não encontrada');
    if (userRole !== 'ADMIN' && operation.producerProfile.user.id !== userId) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    return operation;
  }

  async submit(id: string, userId: string) {
    const operation = await this.findById(id, userId);
    if (operation.status !== OperationStatus.DRAFT) {
      throw new ForbiddenException('Operação já foi submetida');
    }

    return this.prisma.operationRequest.update({
      where: { id },
      data: { status: OperationStatus.SUBMITTED },
    });
  }

  async updateStatus(id: string, status: OperationStatus) {
    return this.prisma.operationRequest.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Deal flow: available operations for financial institutions / partners.
   * Returns submitted/scoring/matching operations with producer info and score.
   */
  async findAvailable(page = 1, perPage = 20) {
    const visibleStatuses: OperationStatus[] = [
      OperationStatus.SUBMITTED,
      OperationStatus.SCORING,
      OperationStatus.MATCHING,
      OperationStatus.PROPOSALS_RECEIVED,
    ];

    const [data, total] = await Promise.all([
      this.prisma.operationRequest.findMany({
        where: { status: { in: visibleStatuses }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          producerProfile: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
          riskScore: { select: { score: true, profile: true } },
        },
      }),
      this.prisma.operationRequest.count({
        where: { status: { in: visibleStatuses }, deletedAt: null },
      }),
    ]);

    return {
      data: data.map((op) => ({
        id: op.id,
        type: op.type,
        status: op.status,
        amount: Number(op.requestedAmount),
        termMonths: op.termMonths,
        purpose: op.purpose,
        guarantees: op.guarantees,
        createdAt: op.createdAt,
        producerName: op.producerProfile?.user?.name ?? null,
        score: op.riskScore?.score ?? null,
        riskProfile: op.riskScore?.profile ?? null,
      })),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
}
