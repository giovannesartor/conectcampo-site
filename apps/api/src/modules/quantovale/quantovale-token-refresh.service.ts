import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { QuantovaleService } from './quantovale.service';

/**
 * C: Proactive token renewal cron.
 * Runs every 30 min and refreshes any QuantoVale tokens that will expire
 * within the next hour, eliminating the "disconnected" UX when a user
 * opens the dashboard and their token has just expired.
 */
@Injectable()
export class QuantovaleTokenRefreshService {
  private readonly logger = new Logger(QuantovaleTokenRefreshService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quantovaleService: QuantovaleService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async refreshExpiringTokens(): Promise<void> {
    const horizon = new Date(Date.now() + 60 * 60 * 1000); // tokens expiring in < 1 h

    const expiring = await this.prisma.quantovaleConnection.findMany({
      where: {
        refreshToken: { not: null },
        expiresAt: { lte: horizon },
      },
      select: { userId: true },
    });

    if (expiring.length === 0) {
      this.logger.debug('Token refresh cron: no tokens expiring within 1 hour.');
      return;
    }

    this.logger.log(`Token refresh cron: refreshing ${expiring.length} token(s)...`);
    let ok = 0;
    let fail = 0;

    for (const { userId } of expiring) {
      try {
        await this.quantovaleService.refreshUserToken(userId);
        ok++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Cron refresh failed for user ${userId}: ${msg}`);
        fail++;
      }
    }

    this.logger.log(`Token refresh cron complete — ok: ${ok}, failed: ${fail}.`);
  }
}
