import { Module } from '@nestjs/common';
import { NdviService } from './ndvi.service';
import { NdviController } from './ndvi.controller';
import { SatelliteService } from './satellite.service';

@Module({
  controllers: [NdviController],
  providers: [NdviService, SatelliteService],
  exports: [NdviService, SatelliteService],
})
export class NdviModule {}
