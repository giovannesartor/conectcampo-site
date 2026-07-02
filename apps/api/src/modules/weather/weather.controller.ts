import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WeatherService } from './weather.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('weather')
@ApiBearerAuth()
@Controller('weather')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class WeatherController {
  constructor(private readonly service: WeatherService) {}

  @Get('forecast')
  @ApiOperation({ summary: 'Previsão de 7 dias, clima atual e alertas' })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'city', required: false })
  getForecast(@Query('state') state?: string, @Query('city') city?: string) {
    return this.service.getForecast(state, city);
  }

  @Get('planting-window')
  @ApiOperation({ summary: 'Janela de plantio recomendada por cultura e região' })
  @ApiQuery({ name: 'crop', required: false })
  @ApiQuery({ name: 'state', required: false })
  getPlantingWindow(@Query('crop') crop?: string, @Query('state') state?: string) {
    return this.service.getPlantingWindow(crop, state);
  }
}
