import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { AsaasService } from './asaas.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, AsaasService],
  exports: [SubscriptionsService, AsaasService],
})
export class SubscriptionsModule {}
