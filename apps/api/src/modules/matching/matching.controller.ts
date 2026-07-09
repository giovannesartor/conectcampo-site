import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('matching')
@ApiBearerAuth()
@Controller('matching')
@UseGuards(RolesGuard)
@Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.CREDIT_ANALYST)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post(':operationId')
  @ApiOperation({ summary: 'Executar motor de match para operação' })
  async runMatch(@Param('operationId') operationId: string) {
    return this.matchingService.runMatch(operationId);
  }

  @Get(':operationId')
  @ApiOperation({ summary: 'Obter resultados do match' })
  async getMatches(@Param('operationId') operationId: string) {
    return this.matchingService.getMatches(operationId);
  }
}
