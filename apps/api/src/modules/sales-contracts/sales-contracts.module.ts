import { Module } from '@nestjs/common';
import { SalesContractsService } from './sales-contracts.service';
import { SalesContractsController } from './sales-contracts.controller';

@Module({
  controllers: [SalesContractsController],
  providers: [SalesContractsService],
  exports: [SalesContractsService],
})
export class SalesContractsModule {}
