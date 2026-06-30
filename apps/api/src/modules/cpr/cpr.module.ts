import { Module } from '@nestjs/common';
import { CprService } from './cpr.service';
import { CprController } from './cpr.controller';
import { CprSignController } from './cpr-sign.controller';
import { CprZapSignController } from './cpr-zapsign.controller';
import { ZapSignModule } from '../../common/zapsign/zapsign.module';

@Module({
  imports: [ZapSignModule],
  controllers: [CprController, CprSignController, CprZapSignController],
  providers: [CprService],
  exports: [CprService],
})
export class CprModule {}
