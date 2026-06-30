import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionPlan, PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PLAN_PRICES, PLAN_LABELS } from '../../common/pricing/pricing';

/**
 * Integração com o checkout hospedado da Valsa Digital (pay.valsadigital.com.br).
 *
 * O fluxo é idêntico ao usado no SiteJean: redirecionamos o usuário para o
 * checkout hospedado passando amount/description/metadata por query params e
 * confirmamos o pagamento via webhook assinado com HMAC-SHA256.
 */
@Injectable()
export class ValsaService {
  private readonly logger = new Logger(ValsaService.name);

  private readonly checkoutBase: string;
  private readonly checkoutSlug: string;
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.checkoutBase =
      this.configService.get<string>('VALSA_CHECKOUT_BASE') ??
      'https://pay.valsadigital.com.br';
    this.checkoutSlug =
      this.configService.get<string>('VALSA_CHECKOUT_SLUG') ?? 'conectcampo';
    this.webhookSecret = this.configService.get<string>('WEBHOOK_SECRET_VALSA');

    this.logger.log(
      `Valsa service initialized (checkout: ${this.checkoutBase}/${this.checkoutSlug})`,
    );
  }

  // ─── Hosted checkout URL ──────────────────────────────────────────────────────

  /**
   * Monta a URL do checkout hospedado da Valsa para um plano.
   * Não há chamada de API: o checkout é hospedado e confirmado por webhook.
   */
  buildCheckoutUrl(params: {
    userId: string;
    plan: SubscriptionPlan;
    email?: string;
  }): { invoiceUrl: string; value: number } {
    const value = PLAN_PRICES[params.plan];
    if (value === undefined) {
      throw new Error(`Plano ${params.plan} não suportado`);
    }

    const query = new URLSearchParams({
      amount: String(value),
      description: PLAN_LABELS[params.plan] ?? `Plano ${params.plan}`,
      metadata: JSON.stringify({
        userId: params.userId,
        plan: params.plan,
        source: 'ConectCampo',
      }),
    });
    if (params.email) query.set('email', params.email);

    const invoiceUrl = `${this.checkoutBase}/${this.checkoutSlug}?${query.toString()}`;
    return { invoiceUrl, value };
  }

  // ─── Webhook signature verification (HMAC-SHA256) ─────────────────────────────

  /**
   * Verifica a assinatura `x-webhook-signature` no formato `t=<ts>,v1=<hash>`.
   * O payload assinado é `${timestamp}.${rawBody}`.
   */
  verifyWebhookSignature(signature: string | undefined, rawPayload: string): boolean {
    // Sem secret configurado → aceita (apenas dev/teste)
    if (!this.webhookSecret) {
      this.logger.warn('Valsa webhook: WEBHOOK_SECRET_VALSA não configurado — aceitando');
      return true;
    }
    if (!signature) {
      this.logger.warn('Valsa webhook: sem assinatura');
      return false;
    }

    const parts: Record<string, string> = {};
    signature.split(',').forEach((part) => {
      const idx = part.indexOf('=');
      if (idx > 0) parts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    });

    if (!parts.t || !parts.v1) {
      this.logger.warn('Valsa webhook: assinatura malformada');
      return false;
    }

    const timestamp = parseInt(parts.t, 10);
    if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300) {
      this.logger.warn('Valsa webhook: timestamp expirado ou inválido');
      return false;
    }

    const signedPayload = `${timestamp}.${rawPayload}`;
    const expectedHash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(signedPayload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(parts.v1, 'utf8'),
        Buffer.from(expectedHash, 'utf8'),
      );
    } catch {
      return false;
    }
  }

  // ─── Handle webhook ───────────────────────────────────────────────────────────

  /**
   * Processa o evento do webhook da Valsa. Em caso de pagamento confirmado,
   * ativa a assinatura do usuário identificado em `metadata.userId`.
   */
  async handleWebhook(payload: any): Promise<{ userId: string | null }> {
    const event: string | undefined = payload?.event;
    const data = payload?.data ?? {};
    this.logger.log(`Valsa webhook event: ${event} (status: ${data?.status})`);

    const isPaid =
      event === 'payment.paid' ||
      event === 'payment.confirmed' ||
      event === 'payment.approved' ||
      data?.status === 'paid' ||
      data?.status === 'approved' ||
      data?.status === 'confirmed';

    if (!isPaid) {
      return { userId: null };
    }

    // Recupera userId do metadata
    let metadata = data?.metadata ?? payload?.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch {
        metadata = {};
      }
    }
    const userId: string | undefined = metadata?.userId;
    const paymentId: string | undefined = data?.payment_id ?? data?.id;

    if (!userId) {
      this.logger.warn('Valsa webhook: pagamento sem userId no metadata');
      return { userId: null };
    }

    const activated = await this.activateByUserId(userId, paymentId);
    return { userId: activated };
  }

  // ─── Activate subscription after payment ──────────────────────────────────────

  private async activateByUserId(
    userId: string,
    valsaPaymentId?: string,
  ): Promise<string | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      this.logger.warn(`Valsa webhook: assinatura não encontrada para user ${userId}`);
      return null;
    }

    // Idempotência: já ativa
    if (subscription.isActive && subscription.paymentStatus === PaymentStatus.ACTIVE) {
      this.logger.log(`Assinatura ${subscription.id} já ativa — ignorando webhook duplicado`);
      return subscription.userId;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        isActive: true,
        paymentStatus: PaymentStatus.ACTIVE,
        gateway: 'VALSA',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        ...(valsaPaymentId ? { valsaPaymentId } : {}),
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    this.logger.log(`Assinatura ativada via Valsa: ${subscription.id} (user ${userId})`);
    return subscription.userId;
  }

  // ─── Create pending subscription (chamado no registro) ────────────────────────

  /**
   * Cria a assinatura pendente para o checkout Valsa e devolve a URL de pagamento.
   */
  async createPendingSubscription(params: {
    userId: string;
    plan: SubscriptionPlan;
    email?: string;
  }): Promise<{ invoiceUrl: string }> {
    const { invoiceUrl } = this.buildCheckoutUrl(params);

    await this.prisma.subscription.create({
      data: {
        userId: params.userId,
        plan: params.plan,
        gateway: 'VALSA',
        invoiceUrl,
        paymentStatus: PaymentStatus.PENDING,
        isActive: false,
      },
    });

    return { invoiceUrl };
  }
}
