import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { MatchingProcessor } from './matching.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'matching' }),
  ],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingProcessor],
  exports: [MatchingService],
})
export class MatchingModule {}
