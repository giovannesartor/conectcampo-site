import { Module } from '@nestjs/common';
import { FieldJournalService } from './field-journal.service';
import { FieldJournalController } from './field-journal.controller';

@Module({
  controllers: [FieldJournalController],
  providers: [FieldJournalService],
  exports: [FieldJournalService],
})
export class FieldJournalModule {}
