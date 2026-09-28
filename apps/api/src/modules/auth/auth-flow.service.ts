import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'APPLE' | 'MAIL';

@Injectable()
export class AuthFlowService {
  private readonly logger = new Logger(AuthFlowService.name);
  constructor(private readonly prisma: PrismaService) {}

  async record(provider: AuthProvider, operation: 'LOGIN' | 'REGISTER' | 'SEND' | 'LINK', outcome: 'SUCCESS' | 'FAILURE' | 'ACCEPTED', code?: string) {
    try {
      await this.prisma.authFlowEvent.create({ data: { provider, operation, outcome, code } });
    } catch {
      // Monitoring must never prevent authentication or sending a message.
      this.logger.warn('Não foi possível registrar métrica do fluxo de acesso.');
    }
  }

  async summary() {
    const since = new Date(Date.now() - 7 * 86400000);
    const [counts, recent, first] = await Promise.all([
      this.prisma.authFlowEvent.groupBy({ by: ['provider', 'operation', 'outcome'], where: { createdAt: { gte: since } }, _count: true }),
      this.prisma.authFlowEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 30, select: { id: true, provider: true, operation: true, outcome: true, code: true, createdAt: true } }),
      this.prisma.authFlowEvent.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
    ]);
    return { since, firstEventAt: first?.createdAt ?? null, counts, recent };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanup() {
    // Anonymous operational counters have a bounded 90-day retention.
    await this.prisma.authFlowEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * 86400000) } } });
  }
}
