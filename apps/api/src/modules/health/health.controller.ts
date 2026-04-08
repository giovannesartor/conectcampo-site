import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const [dbOk, quantovaleOk] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      Promise.race([
        fetch('https://api.quantovale.online/api/v1/health')
          .then((r) => r.ok || r.status < 500)
          .catch(() => false),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3_000)),
      ]),
    ]);

    if (!dbOk) {
      throw new HttpException(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          quantovale: quantovaleOk ? 'reachable' : 'unreachable',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      quantovale: quantovaleOk ? 'reachable' : 'unreachable',
      version: process.env.npm_package_version || '0.1.0',
    };
  }
}
