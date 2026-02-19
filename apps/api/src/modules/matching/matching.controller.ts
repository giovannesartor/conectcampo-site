import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('matching')
@ApiBearerAuth()
@Controller('matching')
@UseGuards(RolesGuard)
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
