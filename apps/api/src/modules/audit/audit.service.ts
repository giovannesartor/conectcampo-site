import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditFilters {
  userId?: string;
  action?: string;
  entity?: string;
  search?: string;    // busca por nome ou email do usuário
  dateFrom?: string;  // ISO date string
  dateTo?: string;    // ISO date string
  page?: number;
  perPage?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          ...params,
          oldValue: params.oldValue as Prisma.InputJsonValue | undefined,
          newValue: params.newValue as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      // Nunca falhar por causa do log de auditoria
      this.logger.error(`Falha ao registrar auditoria: ${error}`);
    }
  }

  async findAll(filters: AuditFilters = {}) {
    const { userId, action, entity, search, dateFrom, dateTo, page = 1, perPage = 50 } = filters;

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) where.userId = userId;
    if (action)  where.action = action;
    if (entity)  where.entity = { contains: entity, mode: 'insensitive' };

    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo   ? { lte: new Date(dateTo + 'T23:59:59.999Z') } : {}),
      };
    }

    if (search) {
      where.user = {
        OR: [
          { name:  { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getActionStats() {
    const rows = await this.prisma.auditLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
    });
    return rows.map((r) => ({ action: r.action, count: r._count.action }));
  }

  async findByEntity(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findByUser(userId: string, page = 1, perPage = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
