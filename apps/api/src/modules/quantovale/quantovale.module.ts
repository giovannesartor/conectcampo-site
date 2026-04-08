import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { QuantovaleService } from './quantovale.service';
import { QuantovaleController } from './quantovale.controller';
import { QuantovaleTokenRefreshService } from './quantovale-token-refresh.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [QuantovaleController],
  providers: [QuantovaleService, QuantovaleTokenRefreshService],
  exports: [QuantovaleService],
})
export class QuantovaleModule {}
