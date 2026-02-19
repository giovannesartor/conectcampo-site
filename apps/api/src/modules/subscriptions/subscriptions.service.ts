import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionPlan } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateSubscription(userId: string) {
    let subscription = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
    });

    if (!subscription) {
      // Criar plano Start gratuito
      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          plan: SubscriptionPlan.START,
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return subscription;
  }

  async upgradePlan(userId: string, plan: SubscriptionPlan) {
    const current = await this.getOrCreateSubscription(userId);

    return this.prisma.subscription.update({
      where: { id: current.id },
      data: {
        plan,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async cancel(userId: string) {
    const current = await this.getOrCreateSubscription(userId);

    return this.prisma.subscription.update({
      where: { id: current.id },
      data: {
        cancelledAt: new Date(),
        isActive: false,
      },
    });
  }
}
