import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuantovaleService } from './quantovale.service';
import { ExchangeCodeDto } from './dto/exchange-code.dto';
import { CreateValuationDto } from './dto/create-valuation.dto';

@ApiTags('quantovale')
@ApiBearerAuth()
@Controller('quantovale')
export class QuantovaleController {
  constructor(private readonly svc: QuantovaleService) {}

  @Get('connect')
  @ApiOperation({ summary: 'Obtém a URL de autorização OAuth2 do QuantoVale' })
  getConnectUrl(@Request() req: any) {
    const url = this.svc.getAuthorizeUrl(req.user.sub);
    return { url };
  }

  @Post('exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Troca o código OAuth2 do QuantoVale por tokens' })
  async exchangeCode(@Request() req: any, @Body() dto: ExchangeCodeDto) {
    return this.svc.exchangeCode(req.user.sub, dto.code, dto.redirectUri);
  }

  @Get('status')
  @ApiOperation({ summary: 'Status da conexão com o QuantoVale' })
  async getStatus(@Request() req: any) {
    return this.svc.getConnectionStatus(req.user.sub);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Lista planos disponíveis no QuantoVale' })
  async getPlans(@Request() req: any) {
    return this.svc.getPlans(req.user.sub);
  }

  @Get('valuations')
  @ApiOperation({ summary: 'Lista valuations do usuário no QuantoVale' })
  async getValuations(@Request() req: any) {
    return this.svc.getValuations(req.user.sub);
  }

  @Post('valuations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cria um novo valuation no QuantoVale' })
  async createValuation(@Request() req: any, @Body() dto: CreateValuationDto) {
    const valuation = await this.svc.createValuation(req.user.sub, dto);
    return { data: valuation };
  }

  @Get('valuations/:id')
  @ApiOperation({ summary: 'Detalhes de um valuation específico' })
  async getValuation(@Request() req: any, @Param('id') id: string) {
    return this.svc.getValuation(req.user.sub, id);
  }

  @Get('valuations/:id/status')
  @ApiOperation({ summary: 'Status de processamento de um valuation' })
  async getValuationStatus(@Request() req: any, @Param('id') id: string) {
    return this.svc.getValuationStatus(req.user.sub, id);
  }

  @Get('valuations/:id/report')
  @ApiOperation({ summary: 'Busca o relatório detalhado de um valuation (v2)' })
  async getValuationReport(@Request() req: any, @Param('id') id: string) {
    return this.svc.getValuationReport(req.user.sub, id);
  }

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simulação gratuita de valuation' })
  async simulate(@Body() body: Record<string, unknown>) {
    return this.svc.simulate(body);
  }

  @Delete('disconnect')
  @ApiOperation({ summary: 'Desconecta a conta QuantoVale' })
  async disconnect(@Request() req: any) {
    await this.svc.disconnect(req.user.sub);
    return { ok: true };
  }
}

  @Delete('disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desconecta a conta QuantoVale' })
  async disconnect(@Request() req: any) {
    await this.svc.disconnect(req.user.sub);
    return { message: 'Conta QuantoVale desconectada com sucesso.' };
  }
}
