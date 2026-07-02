import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClimateScoreService } from './climate-score.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('climate-score')
@ApiBearerAuth()
@Controller('climate-score')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class ClimateScoreController {
  constructor(private readonly service: ClimateScoreService) {}

  @Get()
  @ApiOperation({ summary: 'Avaliação de risco climático / de safra por talhão' })
  assess(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.assess(userId, role);
  }
}
