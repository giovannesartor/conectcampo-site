import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { AsaasService } from '../subscriptions/asaas.service';
import { ValsaService } from '../subscriptions/valsa.service';
import { MarketplaceOrdersService } from '../marketplace/marketplace-orders.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';

@ApiTags('webhooks')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly asaasService: AsaasService,
    private readonly valsaService: ValsaService,
    private readonly marketplaceOrders: MarketplaceOrdersService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Asaas – POST /webhook/asaas ─────────────────────────────────────────

  @Public()
  @Post('asaas')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook do Asaas para processar pagamentos das assinaturas' })
  async asaasWebhook(
    @Req() req: Request,
    @Headers('asaas-access-token') webhookToken: string,
  ) {
    if (!this.asaasService.verifyWebhookToken(webhookToken)) {
      this.logger.warn('Asaas webhook: token inválido');
      throw new UnauthorizedException('Token inválido');
    }

    const body = req.body as { event: string; id?: string; payment?: { id?: string }; subscription?: { id?: string }; [k: string]: any };
    this.logger.log(`Asaas webhook received: ${body.event}`);

    const externalId = body.id ?? body.payment?.id ?? body.subscription?.id;
    if (await this.isDuplicate('ASAAS', externalId)) {
      this.logger.warn(`Asaas webhook duplicado ignorado (${externalId})`);
      return { received: true, deduped: true };
    }

    const { userId } = await this.asaasService.handleWebhook(body.event, body);
    await this.markProcessed('ASAAS', externalId, body.event);

    await this.notifyUser(userId);

    return { received: true };
  }

  /** Idempotência: true se o evento já foi processado. */
  private async isDuplicate(provider: string, externalId?: string): Promise<boolean> {
    if (!externalId) return false;
    const found = await this.prisma.webhookEvent.findUnique({
      where: { provider_externalId: { provider, externalId } },
    });
    return !!found;
  }

  private async markProcessed(provider: string, externalId?: string, type?: string): Promise<void> {
    if (!externalId) return;
    await this.prisma.webhookEvent
      .create({ data: { provider, externalId, type } })
      .catch(() => null); // corrida: ignora se já existe
  }

  // ─── Valsa – POST /webhook/valsapay ──────────────────────────────────────

  @Public()
  @Post('valsapay')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook da Valsa Digital para confirmar pagamentos' })
  async valsaWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-webhook-signature') signature: string,
  ) {
    const rawPayload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body ?? {});

    if (!this.valsaService.verifyWebhookSignature(signature, rawPayload)) {
      this.logger.warn('Valsa webhook: assinatura inválida');
      throw new UnauthorizedException('Assinatura inválida');
    }

    let payload: any;
    try {
      payload = rawPayload ? JSON.parse(rawPayload) : {};
    } catch {
      payload = req.body ?? {};
    }
    this.logger.log(`Valsa webhook received: ${payload?.event}`);

    const externalId = payload?.id ?? payload?.transactionId ?? payload?.paymentId;
    if (await this.isDuplicate('VALSA', externalId)) {
      this.logger.warn(`Valsa webhook duplicado ignorado (${externalId})`);
      return { success: true, deduped: true };
    }

    // Roteamento: pagamentos do marketplace (custódia) x assinaturas
    const { isPaid, metadata, paymentId } = this.valsaService.extractPayment(payload);
    if (isPaid && metadata?.type === 'marketplace' && metadata?.orderId) {
      await this.marketplaceOrders.confirmPayment(metadata.orderId, paymentId);
      await this.markProcessed('VALSA', externalId, payload?.event);
      return { success: true };
    }

    const { userId } = await this.valsaService.handleWebhook(payload);
    await this.markProcessed('VALSA', externalId, payload?.event);

    await this.notifyUser(userId);

    return { success: true };
  }

  // ─── Pós-pagamento: e-mails de confirmação e verificação ──────────────────

  private async notifyUser(userId: string | null) {
    if (!userId) return;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // 1. Confirmação de pagamento
    this.mailService.sendPaymentConfirmation(user.email, user.name).catch(() => null);

    // 2. E-mail de verificação (se ainda não verificado)
    if (!user.emailVerified) {
      const token = await this.authService.createEmailVerificationToken(userId);
      this.mailService
        .sendEmailVerification(user.email, user.name, token)
        .catch(() => null);
    }
  }
}
