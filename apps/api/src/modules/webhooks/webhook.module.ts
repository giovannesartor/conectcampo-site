import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SubscriptionsModule, AuthModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
