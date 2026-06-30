import { Controller, Get, Post, Param, Body, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Visualizar minuta para assinatura (público, por token)' })
  async view(@Param('token') token: string) {
    return this.service.getSignView(token);
  }

  @Public()
  @Post(':token')
  @ApiOperation({ summary: 'Assinar CPR (público, por token)' })
  async sign(
    @Param('token') token: string,
    @Ip() ip: string,
    @Body('nomeConfirmacao') nomeConfirmacao?: string,
  ) {
    return this.service.sign(token, ip, nomeConfirmacao);
  }
}
