import { Test, TestingModule } from '@nestjs/testing';
import { CarbonCreditsService } from './carbon-credits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CarbonProjectStatus, CarbonCreditStatus, CarbonProjectType, CarbonStandard } from './carbon-enums';

describe('CarbonCreditsService', () => {
  let service: CarbonCreditsService;
  let prisma: any;

  const mockPrisma = {
    producerProfile: { findUnique: jest.fn() },
    carbonProject: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    carbonInventory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    carbonCredit: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      aggregate: jest.fn(),
    },
    carbonTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const producerProfile = { id: 'profile-1', userId: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarbonCreditsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CarbonCreditsService>(CarbonCreditsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  // ─── createProject ──────────────────────────────────────────────────────────

  describe('createProject', () => {
    const dto = {
      name: 'Reflorestamento São Paulo',
      description: 'Projeto de reflorestamento',
      projectType: CarbonProjectType.REFORESTATION,
      standard: CarbonStandard.VERRA_VCS,
      state: 'SP',
      city: 'Campinas',
      totalAreaHa: 500,
      eligibleAreaHa: 450,
      projectedReduction: 1000,
      estimatedCreditPrice: 35,
    };

    it('should create a project and compute revenue', async () => {
      mockPrisma.producerProfile.findUnique.mockResolvedValue(producerProfile);
      mockPrisma.carbonProject.create.mockResolvedValue({ id: 'proj-1', ...dto });

      await service.createProject('user-1', dto as any);

      expect(mockPrisma.carbonProject.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            producerProfileId: 'profile-1',
            name: dto.name,
            // receita = 35 * 1000 * 20 = 700_000
            totalEstimatedRevenue: 700_000,
          }),
        }),
      );
    });

    it('should throw if producer profile not found', async () => {
      mockPrisma.producerProfile.findUnique.mockResolvedValue(null);

      await expect(service.createProject('user-1', dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── assertProjectOwner ─────────────────────────────────────────────────────

  describe('assertProjectOwner', () => {
    it('should throw ForbiddenException if user is not the owner', async () => {
      mockPrisma.carbonProject.findUnique.mockResolvedValue({
        id: 'proj-1',
        deletedAt: null,
        producerProfile: { userId: 'other-user' },
      });

      // @ts-ignore accessing private method for testing
      await expect(
        service['assertProjectOwner']('proj-1', 'user-1', UserRole.PRODUCER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN regardless of ownership', async () => {
      mockPrisma.carbonProject.findUnique.mockResolvedValue({
        id: 'proj-1',
        deletedAt: null,
        producerProfile: { userId: 'other-user' },
      });

      // ADMIN should not throw
      await expect(
        service['assertProjectOwner']('proj-1', 'admin-user', UserRole.ADMIN),
      ).resolves.toBeDefined();
    });

    it('should throw NotFoundException for missing project', async () => {
      mockPrisma.carbonProject.findUnique.mockResolvedValue(null);

      await expect(
        service['assertProjectOwner']('missing-proj', 'user-1', UserRole.PRODUCER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getMarketPrices ────────────────────────────────────────────────────────

  describe('getMarketPrices', () => {
    it('should return market price data', async () => {
      const result = await service.getMarketPrices();

      expect(result).toBeDefined();
      expect(Array.isArray(result.prices)).toBe(true);
      // Deve ter pelo menos um standard com preço
      expect(result.prices.length).toBeGreaterThan(0);
      expect(result.prices[0]).toHaveProperty('standard');
      expect(result.prices[0]).toHaveProperty('priceUsd');
    });
  });
});
