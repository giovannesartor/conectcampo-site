import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';

interface WebVital {
  name?: string; // LCP | CLS | INP | FCP | TTFB
  value?: number;
  rating?: string; // good | needs-improvement | poor
  id?: string;
  path?: string;
}

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger('WebVitals');

  @Public()
  @Post('web-vitals')
  @HttpCode(204)
  @Throttle({ default: { ttl: 60000, limit: 120 } })
  @ApiOperation({ summary: 'Coletar métricas de Web Vitals (RUM)' })
  collect(@Body() body: WebVital) {
    if (body?.name && typeof body.value === 'number') {
      const v = body.name === 'CLS' ? body.value.toFixed(3) : Math.round(body.value);
      // Log estruturado — capturável por Railway/agregador de logs ou Sentry
      this.logger.log(`${body.name}=${v} (${body.rating ?? '-'}) path=${body.path ?? '-'}`);
    }
    return;
  }
}
