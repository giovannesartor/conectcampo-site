import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { AsaasService } from './asaas.service';
import { ValsaService } from './valsa.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, AsaasService, ValsaService],
  exports: [SubscriptionsService, AsaasService, ValsaService],
})
export class SubscriptionsModule {}
