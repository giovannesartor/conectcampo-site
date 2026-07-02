import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceOrdersService } from './marketplace-orders.service';
import { MarketplaceOrdersController } from './marketplace-orders.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [MarketplaceController, MarketplaceOrdersController],
  providers: [MarketplaceService, MarketplaceOrdersService],
  exports: [MarketplaceService, MarketplaceOrdersService],
})
export class MarketplaceModule {}
