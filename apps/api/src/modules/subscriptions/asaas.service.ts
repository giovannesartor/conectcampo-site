import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionPlan, PaymentStatus } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';

// ─── Plan config ──────────────────────────────────────────────────────────────

const PLAN_PRICES: Record<string, number> = {
  START: 299.0,       // Produtor Rural
  PRO: 799.0,         // Empresa
  COOPERATIVE: 2890.0, // Cooperativa
  CORPORATE: 0,       // Instituição Financeira (grátis)
};

const PLAN_LABELS: Record<string, string> = {
  START: 'Plano Produtor Rural',
  PRO: 'Plano Empresa',
  COOPERATIVE: 'Plano Cooperativa',
  CORPORATE: 'Instituição Financeira (Grátis)',
};

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
      name: data.name,
      email: data.email,
      cpfCnpj: this.cleanDoc(data.cpfCnpj),
      mobilePhone: data.phone ? data.phone.replace(/\D/g, '') : undefined,
      notificationDisabled: false,
    });
    this.logger.log(`Asaas customer created: ${res.data.id}`);
    return res.data;
  }

  // ─── Subscription ────────────────────────────────────────────────────────────

  async createSubscription(
    asaasCustomerId: string,
    plan: SubscriptionPlan,
    description?: string,
  ): Promise<{ subscriptionId: string; invoiceUrl: string }> {
    const value = PLAN_PRICES[plan];
    if (value === undefined) {
      throw new BadRequestException(`Plano ${plan} não suportado`);
    }
    if (value === 0) {
      throw new BadRequestException('Plano gratuito não requer assinatura Asaas');
    }

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const dueDateStr = nextDueDate.toISOString().split('T')[0];

    const subRes = await this.client.post<AsaasSubscriptionResponse>('/subscriptions', {
      customer: asaasCustomerId,
      billingType: 'UNDEFINED', // Permite que o cliente escolha PIX, cartão ou boleto
      value,
      nextDueDate: dueDateStr,
      cycle: 'MONTHLY',
      description: description ?? `ConectCampo - ${PLAN_LABELS[plan]}`,
    });

    const asaasSubscriptionId = subRes.data.id;
    this.logger.log(`Asaas subscription created: ${asaasSubscriptionId}`);

    // Aguardar um momento para o Asaas gerar o primeiro pagamento
    await new Promise((r) => setTimeout(r, 500));

    // Buscar primeiro pagamento para obter invoiceUrl
    const paymentsRes = await this.client.get<AsaasPaymentsResponse>(
      `/subscriptions/${asaasSubscriptionId}/payments`,
    );

    const firstPayment = paymentsRes.data.data[0];
    if (!firstPayment) {
      throw new BadRequestException('Pagamento não gerado pelo gateway. Tente novamente.');
    }

    this.logger.log(
      `First payment for subscription ${asaasSubscriptionId}: ${firstPayment.id} – ${firstPayment.invoiceUrl}`,
    );

    return {
      subscriptionId: asaasSubscriptionId,
      invoiceUrl: firstPayment.invoiceUrl,
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
  }): Promise<{ invoiceUrl: string }> {
    const { userId, name, email, cpfCnpj, phone, plan } = params;

    // ── Dev mode: Asaas not configured ──────────────────────────────────────
    if (!this.http) {
      this.logger.warn('Asaas not configured – using dev fallback subscription');
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

      await this.prisma.subscription.create({
        data: {
          userId,
          plan,
          paymentStatus: PaymentStatus.PENDING,
          isActive: false,
          invoiceUrl: `${frontendUrl}/dashboard?dev_payment_pending=true`,
        },
      });

      return { invoiceUrl: `${frontendUrl}/dashboard?dev_payment_pending=true` };
    }

    const customer = await this.createCustomer({ name, email, cpfCnpj, phone });
    const { subscriptionId, invoiceUrl } = await this.createSubscription(
      customer.id,
      plan,
    );

    // Salvar no banco
    await this.prisma.subscription.create({
      data: {
        userId,
        plan,
        asaasCustomerId: customer.id,
        asaasSubscriptionId: subscriptionId,
        invoiceUrl,
        paymentStatus: PaymentStatus.PENDING,
        isActive: false,
      },
    });

    return { invoiceUrl };
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

  // ─── Handle webhook ───────────────────────────────────────────────────────────

  async handleWebhook(
    event: string,
    payload: any,
  ): Promise<{ userId: string | null }> {
    this.logger.log(`Asaas webhook event: ${event}`);

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const payment = payload.payment;
      const asaasSubscriptionId: string | undefined = payment?.subscription;

      if (!asaasSubscriptionId) {
        this.logger.warn('Webhook: payment has no subscription ID');
        return { userId: null };
      }

      const userId = await this.activateBySubscriptionId(asaasSubscriptionId);
      return { userId };
    }

    // Pagamento vencido (evento de pagamento)
    if (event === 'PAYMENT_OVERDUE') {
      const asaasSubscriptionId: string | undefined =
        payload.payment?.subscription;
      if (asaasSubscriptionId) {
        await this.prisma.subscription.updateMany({
          where: { asaasSubscriptionId },
          data: { paymentStatus: PaymentStatus.OVERDUE },
        });
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

  // ─── Verify webhook token ─────────────────────────────────────────────────────

  verifyWebhookToken(token: string | undefined): boolean {
    const expected = this.configService.get<string>('ASAAS_WEBHOOK_TOKEN');
    if (!expected) return true; // não configurado → aceitar (dev)
    return token === expected;
  }
}
