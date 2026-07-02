import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('quotes')
@ApiBearerAuth()
@Controller('quotes')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class QuotesController {
  constructor(private readonly service: QuotesService) {}

  @Get()
  @ApiOperation({ summary: 'Cotações de commodities agrícolas e dólar' })
  getQuotes() {
    return this.service.getQuotes();
  }

  @Get('production-value')
  @ApiOperation({ summary: 'Valor estimado da produção dos talhões a preço de mercado' })
  getProductionValue(@CurrentUser('sub') userId: string) {
    return this.service.getProductionValue(userId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Meus alertas de preço' })
  listAlerts(@CurrentUser('sub') userId: string) {
    return this.service.listAlerts(userId);
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Criar alerta de preço' })
  createAlert(
    @CurrentUser('sub') userId: string,
    @Body() dto: { symbol: string; direction: string; target: number },
  ) {
    return this.service.createAlert(userId, dto);
  }

  @Delete('alerts/:id')
  @ApiOperation({ summary: 'Remover alerta de preço' })
  deleteAlert(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.deleteAlert(id, userId);
  }

  @Get(':symbol')
  @ApiOperation({ summary: 'Cotação de uma commodity específica' })
  getQuote(@Param('symbol') symbol: string) {
    return this.service.getQuote(symbol);
  }
}
