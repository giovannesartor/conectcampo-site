import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
