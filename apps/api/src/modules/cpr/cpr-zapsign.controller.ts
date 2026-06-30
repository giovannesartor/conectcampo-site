import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CprService } from './cpr.service';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Webhook da ZapSign (eventos de assinatura). Público — a ZapSign chama este
 * endpoint. Configure a URL em Configurações > Integrações > Webhooks da ZapSign:
 *   https://SEU_DOMINIO/api/v1/cpr/zapsign/webhook
 */
@ApiTags('cpr')
@Controller('cpr/zapsign')
export class CprZapSignController {
  constructor(private readonly service: CprService) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook da ZapSign (doc_signed)' })
  async webhook(@Body() payload: unknown) {
    return this.service.handleZapSignWebhook(payload);
  }
}
