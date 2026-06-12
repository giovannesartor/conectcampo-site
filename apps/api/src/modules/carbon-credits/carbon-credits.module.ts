import { Module } from '@nestjs/common';
import { CarbonCreditsService } from './carbon-credits.service';
import { CarbonCreditsController } from './carbon-credits.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [CarbonCreditsController],
  providers: [CarbonCreditsService],
  exports: [CarbonCreditsService],
})
export class CarbonCreditsModule {}
