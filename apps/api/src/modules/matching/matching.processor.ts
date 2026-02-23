import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MatchingService } from '../matching/matching.service';

@Processor('matching')
export class MatchingProcessor {
  private readonly logger = new Logger(MatchingProcessor.name);

  constructor(private readonly matchingService: MatchingService) {}

  @Process('run')
  async handleRunMatch(job: Job<{ operationId: string }>) {
    this.logger.log(`Processing matching job for operation ${job.data.operationId}`);

    try {
      const result = await this.matchingService.runMatch(job.data.operationId);
      this.logger.log(
        `Matching completed: ${result.totalPartners} partners for operation ${job.data.operationId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Matching failed for operation ${job.data.operationId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
