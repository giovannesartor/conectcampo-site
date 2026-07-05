import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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

  /**
   * Rede de segurança para o trial de 7 dias: roda diariamente e bloqueia
   * quem ainda está em TRIALING mas cujo período de teste já terminou sem
   * pagamento confirmado. O webhook PAYMENT_OVERDUE do Asaas cobre o caso
   * principal; este cron garante o bloqueio mesmo se o webhook falhar/atrasar.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireTrials() {
    const now = new Date();
    const expired = await this.prisma.subscription.findMany({
      where: {
        paymentStatus: PaymentStatus.TRIALING,
        trialEndsAt: { lte: now },
      },
      select: { id: true, userId: true },
    });

    if (expired.length === 0) return;

    this.logger.log(`Expirando ${expired.length} trial(s) vencido(s)`);

    for (const sub of expired) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { paymentStatus: PaymentStatus.OVERDUE, isActive: false },
      });
      await this.prisma.user
        .update({ where: { id: sub.userId }, data: { isActive: false } })
        .catch(() => null);
    }
  }
}
