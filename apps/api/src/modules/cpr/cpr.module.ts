import { Module } from '@nestjs/common';
import { CprService } from './cpr.service';
import { CprController } from './cpr.controller';
import { CprSignController } from './cpr-sign.controller';

@Module({
  controllers: [CprController, CprSignController],
  providers: [CprService],
  exports: [CprService],
})
export class CprModule {}
