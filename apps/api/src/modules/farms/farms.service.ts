import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, Prisma } from '@prisma/client';
import { CreateFarmDto, UpdateFarmDto } from './dto/farm.dto';
import { CreatePlotDto, UpdatePlotDto } from './dto/plot.dto';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async assertFarmOwner(farmId: string, userId: string, role: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm || farm.deletedAt) throw new NotFoundException('Fazenda não encontrada');
    if (role !== UserRole.ADMIN && farm.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return farm;
  }

  // ─── Farms ──────────────────────────────────────────────────────────────────

  async createFarm(userId: string, dto: CreateFarmDto) {
    return this.prisma.farm.create({
      data: {
        userId,
        name: dto.name,
        carNumero: dto.carNumero,
        state: dto.state,
        city: dto.city,
        totalAreaHa: dto.totalAreaHa,
        cep: dto.cep,
        address: dto.address,
        district: dto.district,
        matricula: dto.matricula,
        inscricaoEstadual: dto.inscricaoEstadual,
        latitude: dto.latitude,
        longitude: dto.longitude,
        geometry: dto.geometry as Prisma.InputJsonValue,
        notes: dto.notes,
      },
    });
  }

  async findAllFarms(userId: string, role: string) {
    const where: Prisma.FarmWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;

    const farms = await this.prisma.farm.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { plots: true } },
        plots: {
          where: { deletedAt: null },
          select: { id: true, name: true, crop: true, areaHa: true, status: true, safra: true, latitude: true, longitude: true, geometry: true },
        },
      },
    });
    return farms;
  }

  async findFarmById(id: string, userId: string, role: string) {
    await this.assertFarmOwner(id, userId, role);
    return this.prisma.farm.findUnique({
      where: { id },
      include: {
        plots: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateFarm(id: string, userId: string, role: string, dto: UpdateFarmDto) {
    await this.assertFarmOwner(id, userId, role);
    return this.prisma.farm.update({
      where: { id },
      data: {
        ...dto,
        geometry: dto.geometry as Prisma.InputJsonValue,
      },
    });
  }

  async deleteFarm(id: string, userId: string, role: string) {
    await this.assertFarmOwner(id, userId, role);
    await this.prisma.farm.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  // ─── Plots ──────────────────────────────────────────────────────────────────

  async createPlot(farmId: string, userId: string, role: string, dto: CreatePlotDto) {
    await this.assertFarmOwner(farmId, userId, role);
    return this.prisma.plot.create({
      data: {
        farmId,
        name: dto.name,
        crop: dto.crop,
        areaHa: dto.areaHa,
        safra: dto.safra,
        status: dto.status,
        plantingDate: dto.plantingDate ? new Date(dto.plantingDate) : undefined,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : undefined,
        expectedYield: dto.expectedYield,
        latitude: dto.latitude,
        longitude: dto.longitude,
        geometry: dto.geometry as Prisma.InputJsonValue,
      },
    });
  }

  async updatePlot(plotId: string, userId: string, role: string, dto: UpdatePlotDto) {
    const plot = await this.prisma.plot.findUnique({ where: { id: plotId } });
    if (!plot || plot.deletedAt) throw new NotFoundException('Talhão não encontrado');
    await this.assertFarmOwner(plot.farmId, userId, role);
    return this.prisma.plot.update({
      where: { id: plotId },
      data: {
        ...dto,
        plantingDate: dto.plantingDate ? new Date(dto.plantingDate) : undefined,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : undefined,
        geometry: dto.geometry as Prisma.InputJsonValue,
      },
    });
  }

  async deletePlot(plotId: string, userId: string, role: string) {
    const plot = await this.prisma.plot.findUnique({ where: { id: plotId } });
    if (!plot || plot.deletedAt) throw new NotFoundException('Talhão não encontrado');
    await this.assertFarmOwner(plot.farmId, userId, role);
    await this.prisma.plot.update({
      where: { id: plotId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  // ─── Summary ────────────────────────────────────────────────────────────────

  async getSummary(userId: string, role: string) {
    const where: Prisma.FarmWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;

    const farms = await this.prisma.farm.findMany({
      where,
      include: {
        plots: { where: { deletedAt: null }, select: { areaHa: true, crop: true } },
      },
    });

    const totalFarms = farms.length;
    let totalAreaHa = 0;
    let totalPlots = 0;
    const cropAreas: Record<string, number> = {};

    for (const farm of farms) {
      totalAreaHa += Number(farm.totalAreaHa);
      for (const plot of farm.plots) {
        totalPlots += 1;
        const area = Number(plot.areaHa);
        cropAreas[plot.crop] = (cropAreas[plot.crop] ?? 0) + area;
      }
    }

    const cropDistribution = Object.entries(cropAreas)
      .map(([crop, area]) => ({ crop, area }))
      .sort((a, b) => b.area - a.area);

    return { totalFarms, totalPlots, totalAreaHa, cropDistribution };
  }

  /** Produção estimada por cultura (área × produtividade) — usado para prefill de CPR. */
  async getProductionSummary(userId: string, role: string) {
    const where: Prisma.PlotWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.farm = { userId, deletedAt: null };

    const plots = await this.prisma.plot.findMany({
      where,
      select: { crop: true, areaHa: true, expectedYield: true, safra: true },
    });

    const byCrop: Record<string, { crop: string; areaHa: number; estProduction: number; safra: string | null }> = {};
    for (const p of plots) {
      const area = Number(p.areaHa);
      const yieldPerHa = Number(p.expectedYield ?? 0);
      byCrop[p.crop] ??= { crop: p.crop, areaHa: 0, estProduction: 0, safra: p.safra };
      byCrop[p.crop].areaHa += area;
      byCrop[p.crop].estProduction += area * yieldPerHa;
    }

    return Object.values(byCrop)
      .map((c) => ({ ...c, estProduction: Number(c.estProduction.toFixed(0)) }))
      .sort((a, b) => b.areaHa - a.areaHa);
  }
}
