import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { AsaasService } from '../subscriptions/asaas.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole, SubscriptionPlan } from '@prisma/client';

jest.mock('bcryptjs');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let mailService: any;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAsaasService = {
    createCustomerAndSubscription: jest.fn(),
  };

  const mockSubscriptionsService = {
    getOrCreateFreeSubscription: jest.fn().mockResolvedValue({}),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-access-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: string) => {
      const map: Record<string, string> = {
        JWT_REFRESH_EXPIRATION: '7d',
        ADMIN_EMAILS: '',
      };
      return map[key] ?? defaultVal ?? '';
    }),
  };

  const mockMailService = {
    sendWelcome: jest.fn().mockResolvedValue(undefined),
    sendEmailVerification: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    sendPasswordChanged: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
        { provide: AsaasService, useValue: mockAsaasService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    // CORPORATE = free plan, returns tokens directly without Asaas redirect
    const registerDto = {
      email: 'test@example.com',
      password: 'Senha@123',
      name: 'Test User',
      role: UserRole.PRODUCER,
      plan: SubscriptionPlan.CORPORATE,
    };

    it('should register a new user with free plan', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const createdUser = {
        id: 'user-1',
        email: registerDto.email,
        name: registerDto.name,
        role: UserRole.PRODUCER,
      };
      prisma.user.create.mockResolvedValue(createdUser);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.emailVerificationToken.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result.user.email).toBe(registerDto.email);
      // Free plan returns tokens immediately (no Asaas redirect)
      expect('accessToken' in result).toBe(true);
      if ('accessToken' in result) {
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
      }
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'Senha@123' };

    it('should login with valid credentials', async () => {
      const user = {
        id: 'user-1',
        email: loginDto.email,
        name: 'Test',
        role: UserRole.PRODUCER,
        isActive: true,
        deletedAt: null,
        passwordHash: 'hashed',
      };

      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue(user);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result.user.email).toBe(loginDto.email);
      expect(result.accessToken).toBeDefined();
    });

    it('should throw on invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        isActive: true,
        deletedAt: null,
        passwordHash: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        isActive: false,
        deletedAt: null,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      const stored = {
        id: 'rt-1',
        token: 'rt-value',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1', email: 'test@example.com', role: 'PRODUCER' },
      };

      prisma.refreshToken.findUnique.mockResolvedValue(stored);
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshToken('rt-value');

      expect(result.accessToken).toBeDefined();
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw on expired token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 86400000),
        user: {},
      });

      await expect(service.refreshToken('expired')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
