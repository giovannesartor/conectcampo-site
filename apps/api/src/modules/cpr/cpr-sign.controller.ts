import { Controller, Get, Post, Param, Body, Ip, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CprService } from './cpr.service';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Rotas públicas de assinatura (acesso por token, sem login).
 * Mantidas fora do CprController para não herdar o RolesGuard.
 */
@ApiTags('cpr')
@Controller('cpr/sign')
export class CprSignController {
  constructor(private readonly service: CprService) {}

  @Public()
  @Get(':token')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Visualizar minuta para assinatura (público, por token)' })
  async view(@Param('token', new ParseUUIDPipe({ version: '4' })) token: string) {
    return this.service.getSignView(token);
  }

  @Public()
  @Post(':token')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Assinar CPR (público, por token)' })
  async sign(
    @Param('token', new ParseUUIDPipe({ version: '4' })) token: string,
    @Ip() ip: string,
    @Body('nomeConfirmacao') nomeConfirmacao?: string,
  ) {
    return this.service.sign(token, ip, nomeConfirmacao);
  }
}
