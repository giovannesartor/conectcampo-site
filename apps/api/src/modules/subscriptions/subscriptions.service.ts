import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from './asaas.service';
import { SubscriptionPlan, PaymentStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
  ) {}

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

    // Cancelar no Asaas (se houver ID de assinatura)
    if (current.asaasSubscriptionId) {
      try {
        await this.asaasService.cancelSubscription(current.asaasSubscriptionId);
      } catch (err: any) {
        this.logger.error(`Asaas cancel failed for ${current.asaasSubscriptionId}: ${err.message}`);
        // Não impede o cancelamento local — registra e prossegue
      }
    }

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
