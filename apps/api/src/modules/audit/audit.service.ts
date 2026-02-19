import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
    });
  }
}
