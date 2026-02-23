import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ScoringService } from '../scoring/scoring.service';

@Processor('scoring')
export class ScoringProcessor {
  private readonly logger = new Logger(ScoringProcessor.name);

  constructor(private readonly scoringService: ScoringService) {}

  @Process('calculate')
  async handleCalculateScore(job: Job<{ operationId: string }>) {
    this.logger.log(`Processing scoring job for operation ${job.data.operationId}`);

    try {
      const result = await this.scoringService.calculateScore(job.data.operationId);
      this.logger.log(`Scoring completed: score ${result.score} for operation ${job.data.operationId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Scoring failed for operation ${job.data.operationId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
