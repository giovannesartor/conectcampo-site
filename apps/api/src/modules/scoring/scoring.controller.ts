import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ScoringService } from './scoring.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('scoring')
@ApiBearerAuth()
@Controller('scoring')
@UseGuards(RolesGuard)
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post(':operationId')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN, UserRole.CREDIT_ANALYST)
  @ApiOperation({ summary: 'Calcular risk score para uma operação' })
  async calculateScore(@Param('operationId') operationId: string) {
    return this.scoringService.calculateScore(operationId);
  }

  @Get(':operationId')
  @ApiOperation({ summary: 'Obter score de uma operação' })
  async getScore(@Param('operationId') operationId: string) {
    return this.scoringService.getScoreByOperation(operationId);
  }
}
