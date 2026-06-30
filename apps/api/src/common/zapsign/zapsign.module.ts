import { Module } from '@nestjs/common';
import { ZapSignService } from './zapsign.service';

@Module({
  providers: [ZapSignService],
  exports: [ZapSignService],
})
export class ZapSignModule {}
