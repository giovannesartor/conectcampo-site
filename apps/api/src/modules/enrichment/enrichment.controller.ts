import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EnrichmentService } from './enrichment.service';

@ApiTags('enrichment')
@ApiBearerAuth()
@Controller('enrichment')
export class EnrichmentController {
  constructor(private readonly service: EnrichmentService) {}

  @Get('cnpj/:cnpj')
  @ApiOperation({ summary: 'Consultar dados públicos de um CNPJ (Receita via BrasilAPI)' })
  cnpj(@Param('cnpj') cnpj: string) {
    return this.service.lookupCnpj(cnpj);
  }
}
