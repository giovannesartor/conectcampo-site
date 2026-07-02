import { Module } from '@nestjs/common';
import { SmartDocsService } from './smart-docs.service';
import { SmartDocsController } from './smart-docs.controller';

@Module({
  controllers: [SmartDocsController],
  providers: [SmartDocsService],
  exports: [SmartDocsService],
})
export class SmartDocsModule {}
