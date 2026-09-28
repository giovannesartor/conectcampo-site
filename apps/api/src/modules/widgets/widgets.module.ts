import { Controller, Get, Header, Module } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { DeralService } from '../quotes/deral.service';

@Controller('widgets')
export class WidgetsController {
  constructor(private readonly prisma: PrismaService, private readonly market: DeralService) {}

  @Public()
  @Get('market')
  @Header('Cache-Control', 'public, max-age=900')
  getMarket() { return this.market.getMarket(); }

  @Get('context')
  @Header('Cache-Control', 'no-store')
  async context(@CurrentUser('sub') userId: string) {
    // Always the signed-in owner's data, including for administrators.
    // No financial amounts, names, notes, documents or credentials leave this endpoint.
    const now = new Date();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now);
    // dueDate stores calendar dates as UTC midnight, not local instants.
    const from = new Date(`${today}T00:00:00Z`);
    const [events, farms] = await Promise.all([
      this.prisma.financialEvent.findMany({ where: { userId, deletedAt: null, status: { in: ['PENDENTE', 'ATRASADO'] }, dueDate: { gte: from, lt: new Date(from.getTime() + 30 * 86400000) } }, select: { dueDate: true } }),
      this.prisma.farm.findMany({ where: { userId, deletedAt: null }, select: { id: true, name: true, city: true, state: true, latitude: true, longitude: true }, orderBy: { name: 'asc' } }),
    ]);
    const counts: Record<string, number> = {};
    for (const event of events) {
      const day = event.dueDate.toISOString().slice(0, 10);
      counts[day] = (counts[day] ?? 0) + 1;
    }
    return {
      generatedAt: now.toISOString(),
      days: Object.entries(counts).sort().map(([date, count]) => ({ date, count })),
      farms: farms.map(farm => ({ ...farm, latitude: farm.latitude === null ? null : Number(farm.latitude), longitude: farm.longitude === null ? null : Number(farm.longitude) })),
    };
  }
}

@Module({ controllers: [WidgetsController], providers: [DeralService] })
export class WidgetsModule {}
