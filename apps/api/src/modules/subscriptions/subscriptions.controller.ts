import { Controller, Get, Post, Body, UseGuards, RawBodyRequest, Req, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { StripeService } from './stripe.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { SubscriptionPlan } from '@prisma/client';
import { Request } from 'express';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(RolesGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly stripeService: StripeService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Minha assinatura atual' })
  async getMine(@CurrentUser('sub') userId: string) {
    return this.subscriptionsService.getOrCreateSubscription(userId);
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade de plano' })
  async upgrade(
    @CurrentUser('sub') userId: string,
    @Body() body: { plan: string },
  ) {
    return this.subscriptionsService.upgradePlan(userId, body.plan as SubscriptionPlan);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Criar sessão de checkout Stripe' })
  async createCheckout(
    @CurrentUser('sub') userId: string,
    @Body() body: { plan: string },
  ) {
    return this.stripeService.createCheckoutSession(userId, body.plan as SubscriptionPlan);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancelar assinatura' })
  async cancel(@CurrentUser('sub') userId: string) {
    return this.subscriptionsService.cancel(userId);
  }

  @Public()
  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Webhook do Stripe' })
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      return { error: 'Missing raw body' };
    }
    return this.stripeService.handleWebhook(rawBody, signature);
  }
}
