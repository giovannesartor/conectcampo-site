import { Module } from '@nestjs/common';
import { QuantovaleService } from './quantovale.service';
import { QuantovaleController } from './quantovale.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuantovaleController],
  providers: [QuantovaleService],
  exports: [QuantovaleService],
})
export class QuantovaleModule {}
