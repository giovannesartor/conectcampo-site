import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../modules/auth/decorators/public.decorator';
import { getPublicPricing } from './pricing';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Preços e taxas vigentes (fonte única)' })
  getPricing() {
    return getPublicPricing();
  }
}
