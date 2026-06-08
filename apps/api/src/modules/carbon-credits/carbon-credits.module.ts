import { Module } from '@nestjs/common';
import { CarbonCreditsService } from './carbon-credits.service';
import { CarbonCreditsController } from './carbon-credits.controller';

@Module({
  controllers: [CarbonCreditsController],
  providers: [CarbonCreditsService],
  exports: [CarbonCreditsService],
})
export class CarbonCreditsModule {}
