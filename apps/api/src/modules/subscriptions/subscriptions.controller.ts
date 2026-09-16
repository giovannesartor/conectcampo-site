import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppleSubscriptionsService } from './apple-subscriptions.service';
import { VerifyAppleTransactionDto } from './dto/apple-transaction.dto';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(RolesGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly appleSubscriptions: AppleSubscriptionsService,
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

  @Get('apple/context')
  @ApiOperation({ summary: 'Contexto seguro da conta para compras StoreKit' })
  async appleContext(@CurrentUser('sub') userId: string) {
    return this.appleSubscriptions.getContext(userId);
  }

  @Post('apple/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar compra ou restauração StoreKit 2' })
  async verifyAppleTransaction(
    @CurrentUser('sub') userId: string,
    @Body() dto: VerifyAppleTransactionDto,
  ) {
    return this.appleSubscriptions.verifyForUser(userId, dto.signedTransaction, dto.source);
  }
}
