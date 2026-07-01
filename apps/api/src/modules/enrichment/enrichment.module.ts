import { Module } from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { EnrichmentController } from './enrichment.controller';

@Module({
  controllers: [EnrichmentController],
  providers: [EnrichmentService],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
