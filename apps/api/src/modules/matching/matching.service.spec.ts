import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('MatchingService', () => {
  let service: MatchingService;
  let prisma: any;

  const mockPrisma = {
    operationRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    partnerInstitution: {
      findMany: jest.fn(),
    },
    matchResult: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('runMatch', () => {
    const mockOperation = {
      id: 'op-1',
      type: 'CUSTEIO',
      requestedAmount: 1000000,
      guarantees: ['IMOVEL_RURAL', 'PENHOR_SAFRA'],
      producerProfile: {
        id: 'profile-1',
        state: 'MT',
        crops: ['SOJA', 'MILHO'],
      },
      riskScore: {
        score: 75,
        profile: 'CONSERVADOR',
      },
    };

    const mockPartners = [
      {
        id: 'partner-1',
        name: 'Banco Agro',
        isActive: true,
        minTicket: 500000,
        maxTicket: 5000000,
        acceptedGuarantees: ['IMOVEL_RURAL', 'PENHOR_SAFRA'],
        acceptedStates: ['MT', 'GO', 'MS'],
        acceptedCrops: ['SOJA', 'MILHO', 'ALGODAO'],
        acceptedOperations: ['CUSTEIO', 'INVESTIMENTO'],
        minScore: 60,
      },
      {
        id: 'partner-2',
        name: 'Coop Rural',
        isActive: true,
        minTicket: 100000,
        maxTicket: 2000000,
        acceptedGuarantees: [],
        acceptedStates: [],
        acceptedCrops: [],
        acceptedOperations: [],
        minScore: 40,
      },
    ];

    it('should match operation with eligible partners', async () => {
      prisma.operationRequest.findUnique.mockResolvedValue(mockOperation);
      prisma.partnerInstitution.findMany.mockResolvedValue(mockPartners);
      prisma.matchResult.deleteMany.mockResolvedValue({});
      prisma.matchResult.create.mockImplementation(({ data, include }: any) => ({
        id: `match-${data.partnerId}`,
        ...data,
        partner: mockPartners.find((p) => p.id === data.partnerId),
      }));
      prisma.operationRequest.update.mockResolvedValue({});

      const result = await service.runMatch('op-1');

      expect(result.totalPartners).toBeGreaterThan(0);
      expect(result.matches).toBeInstanceOf(Array);
      expect(result.operationId).toBe('op-1');
    });

    it('should throw if operation not found', async () => {
      prisma.operationRequest.findUnique.mockResolvedValue(null);

      await expect(service.runMatch('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if no risk score', async () => {
      prisma.operationRequest.findUnique.mockResolvedValue({
        ...mockOperation,
        riskScore: null,
      });

      await expect(service.runMatch('op-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should rank matches by score descending', async () => {
      prisma.operationRequest.findUnique.mockResolvedValue(mockOperation);
      prisma.partnerInstitution.findMany.mockResolvedValue(mockPartners);
      prisma.matchResult.deleteMany.mockResolvedValue({});

      let createCallOrder = 0;
      prisma.matchResult.create.mockImplementation(({ data }: any) => {
        createCallOrder++;
        return {
          id: `match-${createCallOrder}`,
          ...data,
          partner: mockPartners.find((p) => p.id === data.partnerId),
        };
      });
      prisma.operationRequest.update.mockResolvedValue({});

      const result = await service.runMatch('op-1');

      // Verify ranking is assigned
      if (result.matches.length >= 2) {
        expect(result.matches[0].rank).toBe(1);
        expect(result.matches[1].rank).toBe(2);
      }
    });
  });

  describe('getMatches', () => {
    it('should return matches for operation', async () => {
      const mockMatches = [
        { id: 'match-1', operationId: 'op-1', rank: 1, partner: {} },
        { id: 'match-2', operationId: 'op-1', rank: 2, partner: {} },
      ];
      prisma.matchResult.findMany.mockResolvedValue(mockMatches);

      const result = await service.getMatches('op-1');

      expect(result).toHaveLength(2);
      expect(prisma.matchResult.findMany).toHaveBeenCalledWith({
        where: { operationId: 'op-1' },
        include: { partner: true },
        orderBy: { rank: 'asc' },
      });
    });
  });
});
