import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuthModule } from '../auth/auth.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';

@Module({
  imports: [SubscriptionsModule, AuthModule, MarketplaceModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
