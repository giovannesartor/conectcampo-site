import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProducerProfileDto } from './dto/create-producer-profile.dto';
import { determineTier } from '@conectcampo/utils';

@Injectable()
export class ProducersService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateProducerProfileDto) {
    const tier = determineTier(dto.annualRevenue);

    return this.prisma.producerProfile.create({
      data: {
        userId,
        tier,
        annualRevenue: dto.annualRevenue,
        totalArea: dto.totalArea,
        crops: dto.crops,
        state: dto.state,
        city: dto.city,
        hasIrrigation: dto.hasIrrigation ?? false,
        hasInsurance: dto.hasInsurance ?? false,
        yearsInActivity: dto.yearsInActivity ?? 0,
        numberOfEmployees: dto.numberOfEmployees,
        companyId: dto.companyId,
      },
      include: {
        financialProfile: true,
      },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.producerProfile.findUnique({
      where: { userId },
      include: {
        financialProfile: true,
        riskScores: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        operations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de produtor não encontrado');
    }

    return profile;
  }

  async updateProfile(userId: string, data: Partial<CreateProducerProfileDto>) {
    const profile = await this.prisma.producerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado');
    }

    const tier = data.annualRevenue
      ? determineTier(data.annualRevenue)
      : undefined;

    return this.prisma.producerProfile.update({
      where: { userId },
      data: {
        ...data,
        ...(tier && { tier }),
      },
    });
  }

  async createFinancialProfile(userId: string, data: any) {
    const profile = await this.prisma.producerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de produtor não encontrado');
    }

    return this.prisma.financialProfile.upsert({
      where: { producerProfileId: profile.id },
      create: {
        producerProfileId: profile.id,
        annualRevenue: data.annualRevenue,
        totalDebt: data.totalDebt ?? 0,
        debtToRevenueRatio: data.totalDebt
          ? data.totalDebt / data.annualRevenue
          : 0,
        cashFlowMonthly: data.cashFlowMonthly ?? [],
        guaranteeValue: data.guaranteeValue ?? 0,
        hasNegativeRecords: data.hasNegativeRecords ?? false,
        creditHistoryYears: data.creditHistoryYears ?? 0,
      },
      update: {
        annualRevenue: data.annualRevenue,
        totalDebt: data.totalDebt,
        debtToRevenueRatio: data.totalDebt
          ? data.totalDebt / data.annualRevenue
          : undefined,
        cashFlowMonthly: data.cashFlowMonthly,
        guaranteeValue: data.guaranteeValue,
        hasNegativeRecords: data.hasNegativeRecords,
        creditHistoryYears: data.creditHistoryYears,
      },
    });
  }
}
