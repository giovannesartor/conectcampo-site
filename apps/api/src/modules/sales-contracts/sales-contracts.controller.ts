import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalesContractsService } from './sales-contracts.service';
import {
  CreateSalesContractDto,
  UpdateSalesContractDto,
} from './dto/sales-contract.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('sales-contracts')
@ApiBearerAuth()
@Controller('sales-contracts')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class SalesContractsController {
  constructor(private readonly service: SalesContractsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo dos contratos de venda' })
  getSummary(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.getSummary(userId, role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contratos de venda' })
  findAll(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.findAll(userId, role);
  }

  @Post()
  @ApiOperation({ summary: 'Criar contrato de venda (a termo / disponível)' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateSalesContractDto) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar contrato' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateSalesContractDto,
  ) {
    return this.service.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover contrato' })
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.remove(id, userId, role);
  }
}
