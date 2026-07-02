import { Module } from '@nestjs/common';
import { ClimateScoreService } from './climate-score.service';
import { ClimateScoreController } from './climate-score.controller';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [WeatherModule],
  controllers: [ClimateScoreController],
  providers: [ClimateScoreService],
  exports: [ClimateScoreService],
})
export class ClimateScoreModule {}
