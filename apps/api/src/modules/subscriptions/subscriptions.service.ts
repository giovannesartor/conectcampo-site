import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionPlan, PaymentStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateFreeSubscription(userId: string) {
    let subscription = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
    });

    if (!subscription) {
      // Plano gratuito (Instituição Financeira)
      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          plan: SubscriptionPlan.CORPORATE,
          paymentStatus: PaymentStatus.ACTIVE,
          isActive: true,
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return subscription;
  }

  async getSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(userId: string) {
    const current = await this.getSubscription(userId);
    if (!current) return { message: 'Nenhuma assinatura encontrada' };

    return this.prisma.subscription.update({
      where: { id: current.id },
      data: {
        cancelledAt: new Date(),
        isActive: false,
        paymentStatus: PaymentStatus.CANCELLED,
      },
    });
  }
}
