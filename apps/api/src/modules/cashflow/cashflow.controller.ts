import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Header,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CashflowService } from './cashflow.service';
import { CreateCashFlowDto, UpdateCashFlowDto } from './dto/cashflow.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('cashflow')
@ApiBearerAuth()
@Controller('cashflow')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class CashflowController {
  constructor(private readonly service: CashflowService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo do fluxo de caixa (receita x despesa, projeção)' })
  @ApiQuery({ name: 'safra', required: false })
  getSummary(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Query('safra') safra?: string,
  ) {
    return this.service.getSummary(userId, role, safra);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="fluxo-de-caixa.csv"')
  @ApiOperation({ summary: 'Exportar lançamentos em CSV' })
  @ApiQuery({ name: 'safra', required: false })
  exportCsv(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Query('safra') safra?: string,
  ) {
    return this.service.exportCsv(userId, role, safra);
  }

  @Get()
  @ApiOperation({ summary: 'Listar lançamentos' })
  @ApiQuery({ name: 'safra', required: false })
  findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Query('safra') safra?: string,
  ) {
    return this.service.findAll(userId, role, safra);
  }

  @Post()
  @ApiOperation({ summary: 'Criar lançamento (receita ou despesa)' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateCashFlowDto) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar lançamento' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateCashFlowDto,
  ) {
    return this.service.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover lançamento' })
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.remove(id, userId, role);
  }
}
