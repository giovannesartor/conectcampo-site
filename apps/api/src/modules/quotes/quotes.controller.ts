import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
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

  @Get(':symbol')
  @ApiOperation({ summary: 'Cotação de uma commodity específica' })
  getQuote(@Param('symbol') symbol: string) {
    return this.service.getQuote(symbol);
  }
}
