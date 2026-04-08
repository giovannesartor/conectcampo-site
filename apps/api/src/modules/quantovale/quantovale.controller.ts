import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuantovaleService } from './quantovale.service';
import { ExchangeCodeDto } from './dto/exchange-code.dto';

@ApiTags('quantovale')
@ApiBearerAuth()
@Controller('quantovale')
export class QuantovaleController {
  constructor(private readonly svc: QuantovaleService) {}

  /**
   * Retorna a URL para redirecionar o usuário à tela de consentimento do QuantoVale.
   * O front-end deve redirecionar o browser para esta URL.
   */
  @Get('connect')
  @ApiOperation({ summary: 'Obtém a URL de autorização OAuth2 do QuantoVale' })
  getConnectUrl(@Request() req: any) {
    const url = this.svc.getAuthorizeUrl(req.user.sub);
    return { url };
  }

  /**
   * Troca o authorization code recebido do QuantoVale por tokens e salva no banco.
   * Chamado pelo front-end após o callback OAuth2.
   */
  @Post('exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Troca o código OAuth2 do QuantoVale por tokens' })
  async exchangeCode(@Request() req: any, @Body() dto: ExchangeCodeDto) {
    return this.svc.exchangeCode(req.user.sub, dto.code, dto.redirectUri);
  }

  /**
   * Retorna o status da conexão com o QuantoVale para o usuário logado.
   */
  @Get('status')
  @ApiOperation({ summary: 'Status da conexão com o QuantoVale' })
  async getStatus(@Request() req: any) {
    return this.svc.getConnectionStatus(req.user.sub);
  }

  /**
   * Proxy: busca a lista de valuations do usuário no QuantoVale.
   */
  @Get('valuations')
  @ApiOperation({ summary: 'Lista valuations do QuantoVale do usuário' })
  async getValuations(@Request() req: any) {
    const items = await this.svc.getValuations(req.user.sub);
    return { items };
  }

  /**
   * Desconecta a conta QuantoVale (remove os tokens do banco).
   */
  @Delete('disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desconecta a conta QuantoVale' })
  async disconnect(@Request() req: any) {
    await this.svc.disconnect(req.user.sub);
    return { message: 'Conta QuantoVale desconectada com sucesso.' };
  }
}
