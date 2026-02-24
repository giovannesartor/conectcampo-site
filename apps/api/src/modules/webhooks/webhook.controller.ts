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
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('webhooks')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly asaasService: AsaasService,
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

    const body = req.body as { event: string; [k: string]: any };
    this.logger.log(`Asaas webhook received: ${body.event}`);

    const { userId } = await this.asaasService.handleWebhook(body.event, body);

    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        // 1. Confirmação de pagamento
        this.mailService.sendPaymentConfirmation(user.email, user.name).catch(() => null);

        // 2. E-mail de verificação (se ainda não verificado)
        if (!user.emailVerified) {
          const token = uuidv4();
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
          await this.prisma.emailVerificationToken.create({
            data: { token, userId, expiresAt },
          });
          this.mailService
            .sendEmailVerification(user.email, user.name, token)
            .catch(() => null);
        }
      }
    }

    return { received: true };
  }
}
