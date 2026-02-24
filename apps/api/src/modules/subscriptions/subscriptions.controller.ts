import {
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(RolesGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Minha assinatura atual' })
  async getMine(@CurrentUser('sub') userId: string) {
    return this.subscriptionsService.getSubscription(userId);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancelar assinatura' })
  async cancel(@CurrentUser('sub') userId: string) {
    return this.subscriptionsService.cancel(userId);
  }
}
