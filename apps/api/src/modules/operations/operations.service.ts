import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OperationStatus } from '@prisma/client';

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

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
