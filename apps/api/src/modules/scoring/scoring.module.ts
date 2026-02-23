import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScoringService } from './scoring.service';
import { ScoringController } from './scoring.controller';
import { ScoringProcessor } from './scoring.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'scoring' }),
  ],
  controllers: [ScoringController],
  providers: [ScoringService, ScoringProcessor],
  exports: [ScoringService],
})
export class ScoringModule {}
