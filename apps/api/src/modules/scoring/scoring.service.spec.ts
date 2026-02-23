import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { RiskProfile } from '@prisma/client';

describe('ScoringService', () => {
  let service: ScoringService;
  let prisma: any;

  const mockPrisma = {
    operationRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    riskScore: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('calculateScore', () => {
    const mockOperation = {
      id: 'op-1',
      requestedAmount: 1000000,
      guarantees: ['IMOVEL_RURAL'],
      type: 'CUSTEIO',
      producerProfile: {
        id: 'profile-1',
        yearsInActivity: 10,
        tier: 'FAIXA_C',
        hasInsurance: true,
        crops: ['SOJA'],
        state: 'MT',
        financialProfile: {
          annualRevenue: 5000000,
          guaranteeValue: 1500000,
          debtToRevenueRatio: 0.2,
          cashFlowMonthly: [200000, 250000, 180000, 300000, 220000, 260000],
          creditHistoryYears: 8,
          hasNegativeRecords: false,
        },
      },
    };

    it('should calculate score correctly for a strong profile', async () => {
      prisma.operationRequest.findUnique.mockResolvedValue(mockOperation);
      prisma.riskScore.create.mockImplementation(({ data }: any) => ({
        id: 'score-1',
        ...data,
      }));
      prisma.operationRequest.update.mockResolvedValue({});

      const result = await service.calculateScore('op-1');

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.profile).toBeDefined();
      expect(result.factors).toHaveLength(7);
      expect(result.eligibility).toBeInstanceOf(Array);
    });

    it('should assign CONSERVADOR profile for high scores', async () => {
      prisma.operationRequest.findUnique.mockResolvedValue(mockOperation);
      prisma.riskScore.create.mockImplementation(({ data }: any) => ({
        id: 'score-1',
        ...data,
      }));
      prisma.operationRequest.update.mockResolvedValue({});

      const result = await service.calculateScore('op-1');

      // With the strong mock profile, expect a high score
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.profile).toBe(RiskProfile.CONSERVADOR);
    });

    it('should throw if operation not found', async () => {
      prisma.operationRequest.findUnique.mockResolvedValue(null);

      await expect(service.calculateScore('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if financial profile missing', async () => {
      prisma.operationRequest.findUnique.mockResolvedValue({
        ...mockOperation,
        producerProfile: {
          ...mockOperation.producerProfile,
          financialProfile: null,
        },
      });

      await expect(service.calculateScore('op-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getScoreByOperation', () => {
    it('should return score by operation id', async () => {
      const mockScore = { id: 'score-1', operationId: 'op-1', score: 75 };
      prisma.riskScore.findUnique.mockResolvedValue(mockScore);

      const result = await service.getScoreByOperation('op-1');

      expect(result).toEqual(mockScore);
    });
  });
});
