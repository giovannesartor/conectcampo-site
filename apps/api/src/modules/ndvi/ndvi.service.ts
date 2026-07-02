import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { SatelliteService } from './satellite.service';

export interface NdviHealth {
  status: 'EXCELENTE' | 'BOM' | 'ATENCAO' | 'CRITICO' | 'SEM_DADOS';
  label: string;
  ndviMean: number | null;
  trend: 'ALTA' | 'ESTAVEL' | 'BAIXA' | null;
}

@Injectable()
export class NdviService {
  private readonly logger = new Logger(NdviService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly satellite: SatelliteService,
  ) {}

  private async assertPlotAccess(plotId: string, userId: string, role: string) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
      include: { farm: true },
    });
    if (!plot || plot.deletedAt) throw new NotFoundException('Talhão não encontrado');
    if (role !== UserRole.ADMIN && plot.farm.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return plot;
  }

  private classify(ndviMean: number | null, trend: NdviHealth['trend']): NdviHealth {
    if (ndviMean == null) {
      return { status: 'SEM_DADOS', label: 'Sem dados', ndviMean: null, trend: null };
    }
    if (ndviMean >= 0.7) return { status: 'EXCELENTE', label: 'Vigor excelente', ndviMean, trend };
    if (ndviMean >= 0.5) return { status: 'BOM', label: 'Vigor bom', ndviMean, trend };
    if (ndviMean >= 0.3) return { status: 'ATENCAO', label: 'Requer atenção', ndviMean, trend };
    return { status: 'CRITICO', label: 'Vigor crítico', ndviMean, trend };
  }

  async listByPlot(plotId: string, userId: string, role: string) {
    await this.assertPlotAccess(plotId, userId, role);
    const readings = await this.prisma.ndviReading.findMany({
      where: { plotId },
      orderBy: { date: 'asc' },
    });

    let trend: NdviHealth['trend'] = null;
    if (readings.length >= 2) {
      const last = readings[readings.length - 1].ndviMean;
      const prev = readings[readings.length - 2].ndviMean;
      const delta = last - prev;
      trend = delta > 0.03 ? 'ALTA' : delta < -0.03 ? 'BAIXA' : 'ESTAVEL';
    }
    const latest = readings.length ? readings[readings.length - 1].ndviMean : null;

    return {
      readings,
      health: this.classify(latest, trend),
      source: readings[0]?.source ?? 'Sem dados',
    };
  }

  /**
   * Gera/atualiza a série temporal NDVI do talhão.
   * Usa a Statistical API do Sentinel Hub (dados reais de satélite) quando as
   * credenciais estão configuradas e o talhão possui geometria; caso contrário,
   * gera uma série sintética sazonal de demonstração.
   */
  async generateForPlot(plotId: string, userId: string, role: string) {
    const plot = await this.assertPlotAccess(plotId, userId, role);

    const to = new Date();
    const from = plot.plantingDate
      ? new Date(plot.plantingDate)
      : new Date(Date.now() - 150 * 86400000);

    // 1) Sentinel Hub Statistical API — valores de NDVI medidos (fonte preferencial)
    if (this.satellite.isSentinelHubConfigured() && plot.geometry) {
      try {
        const series = await this.satellite.fetchNdviTimeSeries(plot.geometry, from, to);
        if (series && series.length > 0) {
          await this.prisma.ndviReading.deleteMany({ where: { plotId } });
          await this.prisma.ndviReading.createMany({
            data: series.map((p) => ({
              plotId,
              date: p.date,
              ndviMean: p.ndviMean,
              ndviMin: p.ndviMin,
              ndviMax: p.ndviMax,
              cloudCover: p.cloudCover,
              source: 'Sentinel-2 L2A (Sentinel Hub)',
            })),
          });
          return this.listByPlot(plotId, userId, role);
        }
      } catch (err) {
        this.logger.warn(
          `NDVI (Sentinel Hub) indisponível para talhão ${plotId}: ${(err as Error).message}`,
        );
      }
    }

    // 2) Planet Data API — cobertura real de cenas (datas + nuvem), NDVI modelado
    if (this.satellite.isPlanetConfigured() && plot.geometry) {
      try {
        const scenes = await this.satellite.fetchPlanetScenes(plot.geometry, from, to);
        if (scenes && scenes.length > 0) {
          await this.prisma.ndviReading.deleteMany({ where: { plotId } });
          await this.prisma.ndviReading.createMany({
            data: this.buildReadingsFromPlanetScenes(plotId, scenes, from),
          });
          return this.listByPlot(plotId, userId, role);
        }
      } catch (err) {
        this.logger.warn(
          `Cobertura Planet indisponível para talhão ${plotId}: ${(err as Error).message}`,
        );
      }
    }

    // 3) Fallback: série sintética sazonal
    return this.generateSyntheticForPlot(plot, plotId, userId, role, from);
  }

  /**
   * Constrói leituras usando as datas de captura e a nuvem reais das cenas PlanetScope,
   * modelando o NDVI a partir da curva sazonal do ciclo (valor estimado, datas reais).
   */
  private buildReadingsFromPlanetScenes(
    plotId: string,
    scenes: { acquired: Date; cloudCover: number | null }[],
    start: Date,
  ) {
    const cycleDays = 150;
    let seed = 0;
    for (const ch of plotId) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };
    return scenes.map((scene) => {
      const days = (scene.acquired.getTime() - start.getTime()) / 86400000;
      const t = Math.max(0, Math.min(1, days / cycleDays));
      const base = Math.sin(Math.PI * Math.min(t / 0.75, 1)) * 0.55 + 0.2;
      const noise = (rand() - 0.5) * 0.05;
      const ndviMean = Math.max(0.05, Math.min(0.92, base + noise));
      const spread = 0.05 + rand() * 0.05;
      return {
        plotId,
        date: scene.acquired,
        ndviMean: Number(ndviMean.toFixed(3)),
        ndviMin: Number(Math.max(0.02, ndviMean - spread).toFixed(3)),
        ndviMax: Number(Math.min(0.98, ndviMean + spread).toFixed(3)),
        cloudCover: scene.cloudCover != null ? Number((scene.cloudCover * 100).toFixed(1)) : null,
        source: 'PlanetScope (cobertura real · NDVI estimado)',
      };
    });
  }

  private async generateSyntheticForPlot(
    plot: { plantingDate: Date | null },
    plotId: string,
    userId: string,
    role: string,
    start: Date,
  ) {
    // Limpa leituras anteriores para regenerar
    await this.prisma.ndviReading.deleteMany({ where: { plotId } });

    const cycleDays = 150; // ciclo médio de uma cultura anual
    const points = 12;
    const stepDays = Math.floor(cycleDays / points);

    // Semente determinística a partir do id do talhão
    let seed = 0;
    for (const ch of plotId) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };

    const readings = [];
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1); // 0..1
      // Curva sazonal: sobe, atinge pico ~70% do ciclo, depois cai (senescência)
      const base = Math.sin(Math.PI * Math.min(t / 0.75, 1)) * 0.55 + 0.2;
      const noise = (rand() - 0.5) * 0.06;
      const ndviMean = Math.max(0.05, Math.min(0.92, base + noise));
      const spread = 0.05 + rand() * 0.05;
      const date = new Date(start.getTime() + i * stepDays * 86400000);
      readings.push({
        plotId,
        date,
        ndviMean: Number(ndviMean.toFixed(3)),
        ndviMin: Number(Math.max(0.02, ndviMean - spread).toFixed(3)),
        ndviMax: Number(Math.min(0.98, ndviMean + spread).toFixed(3)),
        cloudCover: Number((rand() * 20).toFixed(1)),
        source: 'Sentinel-2 (simulado)',
      });
    }

    await this.prisma.ndviReading.createMany({ data: readings });
    return this.listByPlot(plotId, userId, role);
  }

  /** Visão geral de NDVI para todos os talhões do usuário. */
  async overview(userId: string, role: string) {
    const farms = await this.prisma.farm.findMany({
      where: role === UserRole.ADMIN ? { deletedAt: null } : { userId, deletedAt: null },
      include: {
        plots: {
          where: { deletedAt: null },
          include: {
            ndviReadings: { orderBy: { date: 'desc' }, take: 1 },
          },
        },
      },
    });

    const plots = farms.flatMap((farm) =>
      farm.plots.map((plot) => {
        const latest = plot.ndviReadings[0]?.ndviMean ?? null;
        return {
          plotId: plot.id,
          plotName: plot.name,
          farmName: farm.name,
          crop: plot.crop,
          areaHa: Number(plot.areaHa),
          health: this.classify(latest, null),
          lastReadingAt: plot.ndviReadings[0]?.date ?? null,
        };
      }),
    );

    return { plots };
  }
}
