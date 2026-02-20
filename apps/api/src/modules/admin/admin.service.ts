import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserRole, OperationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── KPIs ────────────────────────────────────────────────────────────────────

  async getStats() {
    const [
      totalUsers,
      activeUsers,
      totalOperations,
      totalPartners,
      usersByRole,
      operationsByStatus,
      recentUsers,
      recentOperations,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.operationRequest.count(),
      this.prisma.partnerInstitution.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: true,
      }),
      this.prisma.operationRequest.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      this.prisma.operationRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

    // Financial KPIs
    const [
      gmv,
      avgTicket,
      totalCommissions,
      subscriptionsByPlan,
    ] = await Promise.all([
      this.prisma.contract.aggregate({ _sum: { signedAmount: true } }),
      this.prisma.operationRequest.aggregate({ _avg: { requestedAmount: true } }),
      this.prisma.commission.aggregate({
        _sum: { commissionValue: true },
        where: { status: 'PAID' },
      }),
      this.prisma.subscription.groupBy({
        by: ['plan'],
        where: { cancelledAt: null },
        _count: true,
      }),
    ]);

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUsers = await this.prisma.user.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sixMonthsAgo }, deletedAt: null },
      _count: true,
    });

    // Aggregate by month
    const userTrend = this.aggregateByMonth(monthlyUsers);

    return {
      totalUsers,
      activeUsers,
      totalOperations,
      totalPartners,
      gmv: gmv._sum.signedAmount ?? 0,
      avgTicket: avgTicket._avg.requestedAmount ?? 0,
      totalCommissions: totalCommissions._sum.commissionValue ?? 0,
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
      operationsByStatus: operationsByStatus.map((s) => ({ status: s.status, count: s._count })),
      subscriptionsByPlan: subscriptionsByPlan.map((p) => ({ plan: p.plan, count: p._count })),
      recentUsers,
      recentOperations: recentOperations.map((op) => ({
        id: op.id,
        type: op.type,
        status: op.status,
        requestedAmount: op.requestedAmount,
        createdAt: op.createdAt,
        userName: op.user.name,
        userEmail: op.user.email,
      })),
      userTrend,
    };
  }

  // ─── Users ───────────────────────────────────────────────────────────────────

  async getUsers(page: number, perPage: number, role?: string, search?: string) {
    const where: any = { deletedAt: null };
    if (role && role !== 'ALL') {
      where.role = role as UserRole;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          phone: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: { operations: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async toggleUserActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true },
    });

    this.logger.log(`User ${updated.name} ${updated.isActive ? 'activated' : 'deactivated'}`);
    return updated;
  }

  async changeUserRole(id: string, role: UserRole) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, role: true },
    });
    this.logger.log(`User ${updated.name} role changed to ${role}`);
    return updated;
  }

  // ─── Operations ──────────────────────────────────────────────────────────────

  async getOperations(page: number, perPage: number, status?: string) {
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as OperationStatus;
    }

    const [operations, total] = await Promise.all([
      this.prisma.operationRequest.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, role: true } },
          riskScore: { select: { score: true, profile: true } },
          _count: { select: { proposals: true, matches: true } },
        },
      }),
      this.prisma.operationRequest.count({ where }),
    ]);

    return {
      operations: operations.map((op) => ({
        id: op.id,
        type: op.type,
        status: op.status,
        requestedAmount: op.requestedAmount,
        termMonths: op.termMonths,
        purpose: op.purpose,
        createdAt: op.createdAt,
        user: op.user,
        score: op.riskScore?.score ?? null,
        riskProfile: op.riskScore?.profile ?? null,
        proposalsCount: op._count.proposals,
        matchesCount: op._count.matches,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // ─── Partners ────────────────────────────────────────────────────────────────

  async getPartners() {
    const partners = await this.prisma.partnerInstitution.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { matches: true, proposals: true, commissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return partners.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      cnpj: p.cnpj,
      minTicket: p.minTicket,
      maxTicket: p.maxTicket,
      minScore: p.minScore,
      matchesCount: p._count.matches,
      proposalsCount: p._count.proposals,
      commissionsCount: p._count.commissions,
      createdAt: p.createdAt,
    }));
  }

  // ─── Audit Logs ──────────────────────────────────────────────────────────────

  async getAuditLogs(page: number, perPage: number) {
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      logs,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // ─── Revenue ─────────────────────────────────────────────────────────────────

  async getRevenue() {
    const [
      totalRevenue,
      commissionsByStatus,
      subscriptionsActive,
      subscriptionsByPlan,
    ] = await Promise.all([
      this.prisma.commission.aggregate({
        _sum: { commissionValue: true, fixedFee: true },
      }),
      this.prisma.commission.groupBy({
        by: ['status'],
        _sum: { commissionValue: true },
        _count: true,
      }),
      this.prisma.subscription.count({ where: { cancelledAt: null } }),
      this.prisma.subscription.groupBy({
        by: ['plan'],
        where: { cancelledAt: null },
        _count: true,
      }),
    ]);

    return {
      totalCommissions: totalRevenue._sum.commissionValue ?? 0,
      totalFees: totalRevenue._sum.fixedFee ?? 0,
      commissionsByStatus: commissionsByStatus.map((c) => ({
        status: c.status,
        total: c._sum.commissionValue ?? 0,
        count: c._count,
      })),
      subscriptionsActive,
      subscriptionsByPlan: subscriptionsByPlan.map((p) => ({
        plan: p.plan,
        count: p._count,
      })),
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private aggregateByMonth(records: any[]): { month: string; count: number }[] {
    const map = new Map<string, number>();
    for (const r of records) {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) ?? 0) + r._count);
    }
    return Array.from(map.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}
