import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { WeatherService } from '../weather/weather.service';

export interface PlotRisk {
  plotId: string;
  plotName: string;
  farmName: string;
  crop: string;
  state: string;
  riskScore: number; // 0 (baixo) .. 100 (alto)
  riskLevel: 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRITICO';
  factors: string[];
}

@Injectable()
export class ClimateScoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly weather: WeatherService,
  ) {}

  private levelFrom(score: number): PlotRisk['riskLevel'] {
    if (score >= 70) return 'CRITICO';
    if (score >= 50) return 'ALTO';
    if (score >= 30) return 'MODERADO';
    return 'BAIXO';
  }

  async assess(userId: string, role: string) {
    const farms = await this.prisma.farm.findMany({
      where: role === UserRole.ADMIN ? { deletedAt: null } : { userId, deletedAt: null },
      include: {
        plots: {
          where: { deletedAt: null },
          include: { ndviReadings: { orderBy: { date: 'desc' }, take: 1 } },
        },
      },
    });

    const plots: PlotRisk[] = [];

    for (const farm of farms) {
      const forecast = this.weather.getForecast(farm.state, farm.city);
      const hasSeca = forecast.alerts.some((a) => a.type === 'SECA');
      const hasGeada = forecast.alerts.some((a) => a.type === 'GEADA');
      const hasChuvaForte = forecast.alerts.some((a) => a.type === 'CHUVA_FORTE');

      for (const plot of farm.plots) {
        let score = 20; // risco base
        const factors: string[] = [];

        if (hasSeca) {
          score += 25;
          factors.push('Alerta de baixa precipitação na região');
        }
        if (hasGeada && ['SOJA', 'MILHO', 'CAFE'].includes(plot.crop)) {
          score += 20;
          factors.push('Risco de geada para a cultura');
        }
        if (hasChuvaForte) {
          score += 12;
          factors.push('Excesso de chuva previsto');
        }

        const ndvi = plot.ndviReadings[0]?.ndviMean ?? null;
        if (ndvi != null) {
          if (ndvi < 0.3) {
            score += 25;
            factors.push('Vigor vegetativo (NDVI) crítico');
          } else if (ndvi < 0.5) {
            score += 12;
            factors.push('Vigor vegetativo (NDVI) abaixo do ideal');
          } else {
            score -= 8;
            factors.push('Vigor vegetativo saudável');
          }
        } else {
          factors.push('Sem dados de satélite (NDVI)');
        }

        score = Math.max(0, Math.min(100, score));
        plots.push({
          plotId: plot.id,
          plotName: plot.name,
          farmName: farm.name,
          crop: plot.crop,
          state: farm.state,
          riskScore: score,
          riskLevel: this.levelFrom(score),
          factors,
        });
      }
    }

    const overallScore = plots.length
      ? Math.round(plots.reduce((s, p) => s + p.riskScore, 0) / plots.length)
      : 0;

    return {
      overallScore,
      overallLevel: this.levelFrom(overallScore),
      plotsAssessed: plots.length,
      plots: plots.sort((a, b) => b.riskScore - a.riskScore),
    };
  }
}
