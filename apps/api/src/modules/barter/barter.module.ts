import { Module } from '@nestjs/common';
import { BarterService } from './barter.service';
import { BarterController } from './barter.controller';

@Module({
  controllers: [BarterController],
  providers: [BarterService],
  exports: [BarterService],
})
export class BarterModule {}
