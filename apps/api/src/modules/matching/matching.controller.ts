import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('matching')
@ApiBearerAuth()
@Controller('matching')
@UseGuards(RolesGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post(':operationId')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Executar motor de match para operação' })
  async runMatch(
    @Param('operationId') operationId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.matchingService.runMatch(operationId, userId, role);
  }

  @Get(':operationId')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obter resultados do match' })
  async getMatches(
    @Param('operationId') operationId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.matchingService.getMatches(operationId, userId, role);
  }
}
