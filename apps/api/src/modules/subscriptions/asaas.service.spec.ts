import { Test, TestingModule } from '@nestjs/testing';
import { AsaasService } from './asaas.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

describe('AsaasService', () => {
  let service: AsaasService;
  let prisma: any;
  let configService: any;

  const mockPrisma = {
    subscription: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: string) => {
      const map: Record<string, string | undefined> = {
        ASAAS_API_KEY: undefined,           // não configurado → dev mode
        ASAAS_API_URL: undefined,
        ASAAS_WEBHOOK_TOKEN: 'secret-token',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return map[key] ?? defaultVal;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsaasService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AsaasService>(AsaasService);
    prisma = module.get(PrismaService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  // ─── verifyWebhookToken ─────────────────────────────────────────────────────

  describe('verifyWebhookToken', () => {
    it('should return true for correct token (timing-safe)', () => {
      expect(service.verifyWebhookToken('secret-token')).toBe(true);
    });

    it('should return false for wrong token', () => {
      expect(service.verifyWebhookToken('wrong-token')).toBe(false);
    });

    it('should return false for undefined token', () => {
      expect(service.verifyWebhookToken(undefined)).toBe(false);
    });

    it('should return true when ASAAS_WEBHOOK_TOKEN is not set (dev mode)', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'ASAAS_WEBHOOK_TOKEN') return undefined;
        return undefined;
      });
      // Recreate service without token configured
      const serviceWithoutToken = new (AsaasService as any)(
        { get: (k: string) => (k === 'ASAAS_WEBHOOK_TOKEN' ? undefined : undefined) },
        mockPrisma,
      );
      expect(serviceWithoutToken.verifyWebhookToken('any')).toBe(true);
    });
  });

  // ─── handleWebhook ──────────────────────────────────────────────────────────

  describe('handleWebhook', () => {
    it('should activate subscription on PAYMENT_RECEIVED', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        isActive: false,
        paymentStatus: PaymentStatus.PENDING,
      });
      mockPrisma.subscription.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.handleWebhook('PAYMENT_RECEIVED', {
        event: 'PAYMENT_RECEIVED',
        payment: { id: 'pay-1', subscription: 'asaas-sub-123' },
      });

      expect(result.userId).toBe('user-1');
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({ isActive: true, paymentStatus: PaymentStatus.ACTIVE }),
        }),
      );
    });

    it('should be idempotent — skip already active subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        isActive: true,
        paymentStatus: PaymentStatus.ACTIVE,
      });

      const result = await service.handleWebhook('PAYMENT_RECEIVED', {
        event: 'PAYMENT_RECEIVED',
        payment: { id: 'pay-1', subscription: 'asaas-sub-123' },
      });

      // Should return userId but NOT call update again
      expect(result.userId).toBe('user-1');
      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    });

    it('should mark subscription as OVERDUE on PAYMENT_OVERDUE', async () => {
      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.handleWebhook('PAYMENT_OVERDUE', {
        payment: { subscription: 'asaas-sub-123' },
      });

      expect(result.userId).toBeNull();
      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { asaasSubscriptionId: 'asaas-sub-123' },
          data: { paymentStatus: PaymentStatus.OVERDUE },
        }),
      );
    });

    it('should cancel subscription on SUBSCRIPTION_DELETED', async () => {
      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.handleWebhook('SUBSCRIPTION_DELETED', {
        subscription: { id: 'asaas-sub-123' },
      });

      expect(result.userId).toBeNull();
      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { asaasSubscriptionId: 'asaas-sub-123' },
          data: expect.objectContaining({
            isActive: false,
            paymentStatus: PaymentStatus.CANCELLED,
          }),
        }),
      );
    });

    it('should return null userId if payment has no subscription ID', async () => {
      const result = await service.handleWebhook('PAYMENT_RECEIVED', {
        payment: { id: 'pay-1' }, // sem subscription
      });

      expect(result.userId).toBeNull();
    });
  });
});
