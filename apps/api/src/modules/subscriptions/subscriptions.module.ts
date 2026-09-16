import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { AsaasService } from './asaas.service';
import { ValsaService } from './valsa.service';
import { AppleSubscriptionsService } from './apple-subscriptions.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, AsaasService, ValsaService, AppleSubscriptionsService],
  exports: [SubscriptionsService, AsaasService, ValsaService, AppleSubscriptionsService],
})
export class SubscriptionsModule {}
