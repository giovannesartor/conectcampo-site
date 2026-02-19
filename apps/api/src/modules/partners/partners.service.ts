import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.partnerInstitution.create({ data });
  }

  async findAll(page = 1, perPage = 20) {
    const [data, total] = await Promise.all([
      this.prisma.partnerInstitution.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.partnerInstitution.count({
        where: { isActive: true, deletedAt: null },
      }),
    ]);
    return { data, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async findById(id: string) {
    const partner = await this.prisma.partnerInstitution.findUnique({
      where: { id },
      include: {
        _count: {
          select: { matchResults: true, proposals: true, commissions: true },
        },
      },
    });
    if (!partner) throw new NotFoundException('Parceiro não encontrado');
    return partner;
  }

  async update(id: string, data: any) {
    return this.prisma.partnerInstitution.update({ where: { id }, data });
  }

  async getDashboard(partnerId: string) {
    const [
      totalMatches,
      totalProposals,
      pendingProposals,
      acceptedProposals,
      totalCommissions,
    ] = await Promise.all([
      this.prisma.matchResult.count({ where: { partnerId } }),
      this.prisma.proposal.count({ where: { partnerId } }),
      this.prisma.proposal.count({ where: { partnerId, status: 'PENDING' } }),
      this.prisma.proposal.count({ where: { partnerId, status: 'ACCEPTED' } }),
      this.prisma.commission.aggregate({
        where: { partnerId },
        _sum: { commissionValue: true },
      }),
    ]);

    return {
      pipeline: {
        totalMatches,
        totalProposals,
        pendingProposals,
        acceptedProposals,
      },
      kpis: {
        conversionRate: totalMatches > 0
          ? ((acceptedProposals / totalMatches) * 100).toFixed(1)
          : '0',
        totalCommissionValue: totalCommissions._sum.commissionValue ?? 0,
      },
    };
  }
}
