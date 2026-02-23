import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionPlan } from '@prisma/client';

// Preços por plano (definir no Stripe Dashboard e colocar os IDs aqui via env)
const PLAN_PRICE_MAP: Record<string, string> = {
  START: 'STRIPE_PRICE_START',
  PRO: 'STRIPE_PRICE_PRO',
  COOPERATIVE: 'STRIPE_PRICE_COOPERATIVE',
};

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2024-04-10' as any });
      this.logger.log('Stripe initialized');
    } else {
      this.stripe = null;
      this.logger.warn('Stripe not configured (STRIPE_SECRET_KEY missing)');
    }
  }

  private ensureStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe não está configurado');
    }
    return this.stripe;
  }

  /**
   * Cria uma sessão de checkout para upgrade de plano
   */
  async createCheckoutSession(userId: string, plan: SubscriptionPlan) {
    const stripe = this.ensureStripe();

    if (plan === SubscriptionPlan.CORPORATE) {
      throw new BadRequestException('Plano Instituição Financeira é gratuito');
    }

    const priceEnvKey = PLAN_PRICE_MAP[plan];
    if (!priceEnvKey) {
      throw new BadRequestException(`Plano ${plan} não suportado`);
    }

    const priceId = this.configService.get<string>(priceEnvKey);
    if (!priceId) {
      throw new BadRequestException(`Preço para plano ${plan} não configurado`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuário não encontrado');

    // Buscar customer ID da subscription existente ou criar novo
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    let stripeCustomerId = existingSubscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;

      // Salvar no subscription existente se houver
      if (existingSubscription) {
        await this.prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: { stripeCustomerId },
        });
      }
    }

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/dashboard/planos?success=true`,
      cancel_url: `${frontendUrl}/dashboard/planos?cancelled=true`,
      metadata: { userId, plan },
    });

    this.logger.log(`Checkout session created: ${session.id} for user ${userId}`);

    return { sessionId: session.id, url: session.url };
  }

  /**
   * Processa eventos do webhook do Stripe
   */
  async handleWebhook(payload: Buffer, signature: string) {
    const stripe = this.ensureStripe();
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret não configurado');
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCancelled(subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        this.logger.warn(`Payment failed for invoice ${invoice.id}`);
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as SubscriptionPlan;

    if (!userId || !plan) {
      this.logger.warn('Checkout session missing metadata');
      return;
    }

    // Achar ou criar subscription
    const existing = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
    });

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          plan,
          stripeSubscriptionId: session.subscription as string,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          userId,
          plan,
          stripeSubscriptionId: session.subscription as string,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    this.logger.log(`Subscription activated: ${plan} for user ${userId}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const sub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (sub) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          isActive: subscription.status === 'active',
        },
      });
    }
  }

  private async handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    const sub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (sub) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          cancelledAt: new Date(),
          isActive: false,
        },
      });
      this.logger.log(`Subscription cancelled: ${subscription.id}`);
    }
  }
}
