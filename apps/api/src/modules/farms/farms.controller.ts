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
import { FarmsService } from './farms.service';
import { CreateFarmDto, UpdateFarmDto } from './dto/farm.dto';
import { CreatePlotDto, UpdatePlotDto } from './dto/plot.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('farms')
@ApiBearerAuth()
@Controller('farms')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class FarmsController {
  constructor(private readonly service: FarmsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo de áreas (fazendas, talhões, distribuição de culturas)' })
  getSummary(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.getSummary(userId, role);
  }

  @Get('production-summary')
  @ApiOperation({ summary: 'Produção estimada por cultura (para prefill de CPR)' })
  getProductionSummary(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.getProductionSummary(userId, role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar fazendas do usuário' })
  findAll(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.findAllFarms(userId, role);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar fazenda' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateFarmDto) {
    return this.service.createFarm(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar fazenda com talhões' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.findFarmById(id, userId, role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar fazenda' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateFarmDto,
  ) {
    return this.service.updateFarm(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover fazenda' })
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.deleteFarm(id, userId, role);
  }

  // ─── Plots ──────────────────────────────────────────────────────────────────

  @Post(':id/plots')
  @ApiOperation({ summary: 'Adicionar talhão à fazenda' })
  createPlot(
    @Param('id') farmId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreatePlotDto,
  ) {
    return this.service.createPlot(farmId, userId, role, dto);
  }

  @Patch('plots/:plotId')
  @ApiOperation({ summary: 'Atualizar talhão' })
  updatePlot(
    @Param('plotId') plotId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdatePlotDto,
  ) {
    return this.service.updatePlot(plotId, userId, role, dto);
  }

  @Delete('plots/:plotId')
  @ApiOperation({ summary: 'Remover talhão' })
  deletePlot(
    @Param('plotId') plotId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.deletePlot(plotId, userId, role);
  }
}
