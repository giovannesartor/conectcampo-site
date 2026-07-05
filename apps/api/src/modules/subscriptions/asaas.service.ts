import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionPlan, PaymentStatus } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { PLAN_PRICES, PLAN_LABELS, TRIAL_DAYS } from '../../common/pricing/pricing';

// ─── Asaas DTO interfaces ─────────────────────────────────────────────────────

interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  value: number;
  status: string;
}

interface AsaasPaymentsResponse {
  data: Array<{
    id: string;
    invoiceUrl: string;
    status: string;
  }>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly http: AxiosInstance | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('ASAAS_API_KEY');
    const baseURL =
      this.configService.get<string>('ASAAS_API_URL') ??
      'https://api.asaas.com/v3';

    if (apiKey) {
      this.http = axios.create({
        baseURL,
        headers: {
          access_token: apiKey,
          'Content-Type': 'application/json',
        },
      });
      this.logger.log('Asaas service initialized');
    } else {
      this.http = null;
      this.logger.warn('Asaas not configured (ASAAS_API_KEY missing)');
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private get client(): AxiosInstance {
    if (!this.http) {
      throw new BadRequestException('Gateway de pagamento não configurado');
    }
    return this.http;
  }

  /** Remove formatting from CPF / CNPJ */
  private cleanDoc(doc: string): string {
    return doc.replace(/\D/g, '');
  }

  // ─── Customer ────────────────────────────────────────────────────────────────

  async createCustomer(data: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
  }): Promise<AsaasCustomerResponse> {
    const res = await this.client.post<AsaasCustomerResponse>('/customers', {
      name: `${data.name} - ConectCampo`,
      email: data.email,
      cpfCnpj: this.cleanDoc(data.cpfCnpj),
      mobilePhone: data.phone ? data.phone.replace(/\D/g, '') : undefined,
      notificationDisabled: false,
      externalReference: 'ConectCampo',
    });
    this.logger.log(`Asaas customer created: ${res.data.id}`);
    return res.data;
  }

  // ─── Subscription ────────────────────────────────────────────────────────────

  async createSubscription(
    asaasCustomerId: string,
    plan: SubscriptionPlan,
    description?: string,
    trialDays = 0,
  ): Promise<{ subscriptionId: string; invoiceUrl: string; nextDueDate: string }> {
    const value = PLAN_PRICES[plan];
    if (value === undefined) {
      throw new BadRequestException(`Plano ${plan} não suportado`);
    }
    if (value === 0) {
      throw new BadRequestException('Plano gratuito não requer assinatura Asaas');
    }

    // Com trial: 1ª fatura vence ao fim do período de teste. Sem trial: amanhã.
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + (trialDays > 0 ? trialDays : 1));
    const dueDateStr = nextDueDate.toISOString().split('T')[0];

    const subRes = await this.client.post<AsaasSubscriptionResponse>('/subscriptions', {
      customer: asaasCustomerId,
      billingType: 'UNDEFINED', // Permite que o cliente escolha PIX, cartão ou boleto
      value,
      nextDueDate: dueDateStr,
      cycle: 'MONTHLY',
      description: description ?? `ConectCampo - ${PLAN_LABELS[plan]}`,
      externalReference: 'ConectCampo',
    });

    const asaasSubscriptionId = subRes.data.id;
    this.logger.log(`Asaas subscription created: ${asaasSubscriptionId}`);

    // Retry com backoff para aguardar o Asaas gerar o primeiro pagamento
    const firstPayment = await this.fetchFirstPaymentWithRetry(asaasSubscriptionId);

    if (!firstPayment) {
      throw new BadRequestException('Pagamento não gerado pelo gateway. Tente novamente.');
    }

    this.logger.log(
      `First payment for subscription ${asaasSubscriptionId}: ${firstPayment.id} – ${firstPayment.invoiceUrl}`,
    );

    return {
      subscriptionId: asaasSubscriptionId,
      invoiceUrl: firstPayment.invoiceUrl,
      nextDueDate: dueDateStr,
    };
  }

  // ─── Create full subscription for new user ────────────────────────────────────

  async createCustomerAndSubscription(params: {
    userId: string;
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    plan: SubscriptionPlan;
    trialDays?: number;
  }): Promise<{ invoiceUrl: string; trialEndsAt: Date | null }> {
    const { userId, name, email, cpfCnpj, phone, plan, trialDays = 0 } = params;

    const trialEndsAt =
      trialDays > 0
        ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
        : null;

    // ── Dev mode: Asaas not configured ──────────────────────────────────────
    if (!this.http) {
      this.logger.warn('Asaas not configured – using dev fallback subscription');
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

      await this.prisma.subscription.create({
        data: {
          userId,
          plan,
          paymentStatus: trialDays > 0 ? PaymentStatus.TRIALING : PaymentStatus.PENDING,
          isActive: trialDays > 0,
          trialEndsAt,
          ...(trialEndsAt ? { currentPeriodEnd: trialEndsAt } : {}),
          invoiceUrl: `${frontendUrl}/dashboard?dev_payment_pending=true`,
        },
      });

      return {
        invoiceUrl: `${frontendUrl}/dashboard?dev_payment_pending=true`,
        trialEndsAt,
      };
    }

    const customer = await this.createCustomer({ name, email, cpfCnpj, phone });
    const { subscriptionId, invoiceUrl } = await this.createSubscription(
      customer.id,
      plan,
      undefined,
      trialDays,
    );

    // Salvar no banco. Com trial, a conta já nasce ativa até o fim do período.
    await this.prisma.subscription.create({
      data: {
        userId,
        plan,
        asaasCustomerId: customer.id,
        asaasSubscriptionId: subscriptionId,
        invoiceUrl,
        paymentStatus: trialDays > 0 ? PaymentStatus.TRIALING : PaymentStatus.PENDING,
        isActive: trialDays > 0,
        trialEndsAt,
        ...(trialEndsAt ? { currentPeriodEnd: trialEndsAt } : {}),
      },
    });

    return { invoiceUrl, trialEndsAt };
  }

  // ─── Activate after payment ───────────────────────────────────────────────────

  async activateBySubscriptionId(asaasSubscriptionId: string): Promise<string | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { asaasSubscriptionId },
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found for Asaas ID: ${asaasSubscriptionId}`);
      return null;
    }

    // ── Idempotência: já estava ativa, evitar reprocessamento ────────────────
    if (subscription.isActive && subscription.paymentStatus === PaymentStatus.ACTIVE) {
      this.logger.log(
        `Subscription ${subscription.id} already active — skipping duplicate webhook`,
      );
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
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Ativar o usuário
    await this.prisma.user.update({
      where: { id: subscription.userId },
      data: { isActive: true },
    });

    this.logger.log(
      `Subscription activated: ${subscription.id} for user ${subscription.userId}`,
    );

    return subscription.userId;
  }

  // ─── Confirm one-time carbon setup fee ────────────────────────────────────────

  private async confirmCarbonSetupFee(
    externalReference: string,
    paymentId?: string,
  ): Promise<void> {
    const projectId = externalReference.replace('carbon_setup_', '');
    const project = await this.prisma.carbonProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      this.logger.warn(`Carbon setup fee webhook: projeto ${projectId} não encontrado`);
      return;
    }

    // Idempotência: já pago
    if (project.setupFeeStatus === 'PAID') {
      this.logger.log(`Carbon setup fee do projeto ${projectId} já confirmado — ignorando`);
      return;
    }

    await this.prisma.carbonProject.update({
      where: { id: projectId },
      data: {
        setupFeeStatus: 'PAID',
        setupFeePaidAt: new Date(),
        ...(paymentId ? { setupFeePaymentId: paymentId } : {}),
      },
    });

    this.logger.log(`Carbon setup fee confirmado para projeto ${projectId}`);
  }


  async handleWebhook(
    event: string,
    payload: any,
  ): Promise<{ userId: string | null }> {
    this.logger.log(`Asaas webhook event: ${event}`);

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const payment = payload.payment;
      const asaasSubscriptionId: string | undefined = payment?.subscription;

      if (asaasSubscriptionId) {
        const userId = await this.activateBySubscriptionId(asaasSubscriptionId);
        return { userId };
      }

      // Cobrança avulsa (ex.: setup fee de crédito de carbono) — sem assinatura
      const externalReference: string | undefined = payment?.externalReference;
      if (externalReference?.startsWith('carbon_setup_')) {
        await this.confirmCarbonSetupFee(externalReference, payment?.id);
        return { userId: null };
      }

      this.logger.warn('Webhook: pagamento sem assinatura nem referência conhecida');
      return { userId: null };
    }

    // Pagamento vencido (evento de pagamento) — trial expirado sem pagamento
    // ou mensalidade em atraso: marca OVERDUE e bloqueia o acesso do usuário.
    if (event === 'PAYMENT_OVERDUE') {
      const asaasSubscriptionId: string | undefined =
        payload.payment?.subscription;
      if (asaasSubscriptionId) {
        const sub = await this.prisma.subscription.findUnique({
          where: { asaasSubscriptionId },
          select: { id: true, userId: true },
        });
        if (sub) {
          await this.prisma.subscription.update({
            where: { id: sub.id },
            data: { paymentStatus: PaymentStatus.OVERDUE, isActive: false },
          });
          await this.prisma.user.update({
            where: { id: sub.userId },
            data: { isActive: false },
          });
          this.logger.log(
            `Subscription ${sub.id} bloqueada por atraso (user ${sub.userId})`,
          );
          return { userId: sub.userId };
        }
      }
    }

    // Assinatura inativada ou removida no Asaas
    if (event === 'SUBSCRIPTION_INACTIVATED' || event === 'SUBSCRIPTION_DELETED') {
      const asaasSubscriptionId: string | undefined = payload.subscription?.id;
      if (asaasSubscriptionId) {
        await this.prisma.subscription.updateMany({
          where: { asaasSubscriptionId },
          data: {
            isActive: false,
            paymentStatus: PaymentStatus.CANCELLED,
            cancelledAt: new Date(),
          },
        });
      }
    }

    return { userId: null };
  }

  // ─── Verify webhook token (timing-safe) ──────────────────────────────────────

  verifyWebhookToken(token: string | undefined): boolean {
    const expected = this.configService.get<string>('ASAAS_WEBHOOK_TOKEN');
    if (!expected) return true; // não configurado → aceitar (dev)
    if (!token) return false;
    // Timing-safe comparison — evita timing attacks por comparação de strings
    try {
      const expectedBuf = Buffer.from(expected, 'utf8');
      const tokenBuf = Buffer.from(token, 'utf8');
      if (expectedBuf.length !== tokenBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, tokenBuf);
    } catch {
      return false;
    }
  }

  // ─── Cancel subscription in Asaas ────────────────────────────────────────────

  async cancelSubscription(asaasSubscriptionId: string): Promise<void> {
    try {
      await this.client.delete(`/subscriptions/${asaasSubscriptionId}`);
      this.logger.log(`Asaas subscription cancelled: ${asaasSubscriptionId}`);
    } catch (err: any) {
      this.logger.error(`Failed to cancel Asaas subscription ${asaasSubscriptionId}: ${err.message}`);
      throw err;
    }
  }

  // ─── One-time charge (ex: setup fee carbono) ─────────────────────────────────

  async createOneTimeCharge(params: {
    asaasCustomerId: string;
    value: number;
    description: string;
    externalReference?: string;
    daysUntilDue?: number;
  }): Promise<{ paymentId: string; invoiceUrl: string }> {
    const { asaasCustomerId, value, description, externalReference, daysUntilDue = 3 } = params;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysUntilDue);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const res = await this.client.post<{ id: string; invoiceUrl: string }>(
      '/payments',
      {
        customer: asaasCustomerId,
        billingType: 'UNDEFINED', // cliente escolhe PIX, boleto ou cartão
        value,
        dueDate: dueDateStr,
        description,
        externalReference: externalReference ?? 'ConectCampo',
      },
    );

    this.logger.log(
      `One-time charge created: ${res.data.id} – R$${value} – ${description}`,
    );

    return { paymentId: res.data.id, invoiceUrl: res.data.invoiceUrl };
  }

  // ─── Retry helper ─────────────────────────────────────────────────────────────

  private async fetchFirstPaymentWithRetry(
    asaasSubscriptionId: string,
    maxAttempts = 5,
    baseDelayMs = 1000,
  ): Promise<{ id: string; invoiceUrl: string; status: string } | null> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, baseDelayMs * attempt));
      const res = await this.client.get<AsaasPaymentsResponse>(
        `/subscriptions/${asaasSubscriptionId}/payments`,
      );
      const payment = res.data.data?.[0];
      if (payment) {
        this.logger.log(
          `First payment found on attempt ${attempt} for subscription ${asaasSubscriptionId}: ${payment.id}`,
        );
        return payment;
      }
      this.logger.warn(
        `Attempt ${attempt}/${maxAttempts}: no payment yet for subscription ${asaasSubscriptionId}`,
      );
    }
    return null;
  }
}
