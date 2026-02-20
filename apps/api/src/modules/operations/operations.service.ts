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

  async findById(id: string, userId: string) {
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
    if (operation.producerProfile.user.id !== userId) {
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
}
