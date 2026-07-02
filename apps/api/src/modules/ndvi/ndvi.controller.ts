import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NdviService } from './ndvi.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('ndvi')
@ApiBearerAuth()
@Controller('ndvi')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class NdviController {
  constructor(private readonly service: NdviService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Visão geral de saúde (NDVI) dos talhões' })
  overview(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.overview(userId, role);
  }

  @Get('plots/:plotId')
  @ApiOperation({ summary: 'Série temporal NDVI de um talhão' })
  listByPlot(
    @Param('plotId') plotId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.listByPlot(plotId, userId, role);
  }

  @Post('plots/:plotId/refresh')
  @ApiOperation({ summary: 'Atualizar/gerar leituras NDVI do talhão (satélite)' })
  refresh(
    @Param('plotId') plotId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.generateForPlot(plotId, userId, role);
  }
}
