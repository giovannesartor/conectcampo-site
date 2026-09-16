import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import {
  UserRole,
  SubscriptionPlan,
  PaymentStatus,
  ProducerTier,
  CropType,
  BrazilianState,
  OperationType,
  OperationStatus,
  GuaranteeType,
  ProposalStatus,
  PartnerType,
} from '@prisma/client';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const seedAdmins = process.env.SEED_ADMIN_USERS === 'true';
      const seedTestUsers = process.env.SEED_TEST_USERS === 'true';
      const seedAppReviewUser = process.env.SEED_APP_REVIEW_USER === 'true';

      if (!isProduction || seedAdmins) {
        await this.seedAdminUser();
      } else {
        this.logger.log('Production admin seed disabled.');
      }

      if (!isProduction || seedTestUsers) {
        await this.seedTestUsers();
      } else {
        this.logger.log('Production test-user seed disabled.');
      }

      if (seedAppReviewUser) {
        await this.seedAppReviewUser();
      } else {
        this.logger.log('App Review seed disabled.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Seed failed (non-fatal): ${msg}`);
    }
  }

  private async seedAdminUser() {
    const email = process.env.ADMIN_EMAIL ?? 'giovannesartor@gmail.com';
    const password = process.env.ADMIN_SEED_PASSWORD;

    if (!password) {
      this.logger.warn(
        'ADMIN_SEED_PASSWORD env var not set — skipping admin seed.',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: UserRole.ADMIN, isActive: true },
      create: {
        email,
        passwordHash,
        name: 'Giovanne Sartor',
        role: UserRole.ADMIN,
        consentLgpd: true,
        consentLgpdAt: new Date(),
      },
    });

    this.logger.log(`Primary admin user ready (${user.role}).`);

    // Second admin
    const jeanPassword = process.env.JEAN_ADMIN_PASSWORD;
    if (jeanPassword) {
      const jeanHash = await bcrypt.hash(jeanPassword, 12);
      const secondAdmin = await this.prisma.user.upsert({
        where: { email: 'jeansartor@gmail.com' },
        update: { role: UserRole.ADMIN, isActive: true, passwordHash: jeanHash },
        create: {
          email: 'jeansartor@gmail.com',
          passwordHash: jeanHash,
          name: 'Jean Sartor',
          role: UserRole.ADMIN,
          consentLgpd: true,
          consentLgpdAt: new Date(),
        },
      });
      this.logger.log(`Secondary admin user ready (${secondAdmin.role}).`);
    }
  }

  // ── Test Users ─────────────────────────────────────────────────────────────
  private async seedTestUsers() {
    const password = process.env.TEST_USERS_PASSWORD;

    if (!password) {
      this.logger.warn(
        'TEST_USERS_PASSWORD env var not set — skipping test users seed.',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // ── 1. Investidor (oferece crédito) — FINANCIAL_INSTITUTION ──────────────
    const investidorEmail = 'investidor@teste.conectcampo.com';
    const investidor = await this.prisma.user.upsert({
      where: { email: investidorEmail },
      update: { passwordHash, isActive: true },
      create: {
        email: investidorEmail,
        passwordHash,
        name: 'Investidor Teste',
        role: UserRole.FINANCIAL_INSTITUTION,
        cnpj: '11222333000181',
        isActive: true,
        emailVerified: true,
        consentLgpd: true,
        consentLgpdAt: new Date(),
      },
    });

    // Garantir subscription ativa (plano CORPORATE — gratuito)
    const investidorSub = await this.prisma.subscription.findFirst({
      where: { userId: investidor.id, isActive: true },
    });
    if (!investidorSub) {
      await this.prisma.subscription.create({
        data: {
          userId: investidor.id,
          plan: SubscriptionPlan.CORPORATE,
          paymentStatus: PaymentStatus.ACTIVE,
          isActive: true,
          currentPeriodEnd: oneYearFromNow,
        },
      });
    }

    this.logger.log(`Test financial user ready (${investidor.role}).`);

    // ── 2. Empresa (busca crédito) — PRODUCER ───────────────────────────────
    const empresaEmail = 'empresa@teste.conectcampo.com';
    const empresa = await this.prisma.user.upsert({
      where: { email: empresaEmail },
      update: { passwordHash, isActive: true },
      create: {
        email: empresaEmail,
        passwordHash,
        name: 'Empresa Teste',
        role: UserRole.PRODUCER,
        cpf: '12345678909',
        isActive: true,
        emailVerified: true,
        consentLgpd: true,
        consentLgpdAt: new Date(),
      },
    });

    // Garantir subscription ativa (plano PRO — seed bypass pagamento)
    const empresaSub = await this.prisma.subscription.findFirst({
      where: { userId: empresa.id, isActive: true },
    });
    if (!empresaSub) {
      await this.prisma.subscription.create({
        data: {
          userId: empresa.id,
          plan: SubscriptionPlan.PRO,
          paymentStatus: PaymentStatus.ACTIVE,
          isActive: true,
          currentPeriodEnd: oneYearFromNow,
        },
      });
    }

    this.logger.log(`Test producer user ready (${empresa.role}).`);
  }

  private async seedAppReviewUser() {
    const email = process.env.APP_REVIEW_EMAIL ?? 'appreview@conectcampo.digital';
    const password = process.env.APP_REVIEW_PASSWORD;

    if (!password) {
      this.logger.warn('APP_REVIEW_PASSWORD env var not set — skipping App Review seed.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        name: 'Demonstração ConectCampo',
        role: UserRole.COMPANY,
        phone: null,
        cpf: null,
        cnpj: null,
        emailVerified: true,
        isActive: true,
        deletedAt: null,
        consentLgpd: true,
        consentLgpdAt: new Date(),
      },
      create: {
        email,
        passwordHash,
        name: 'Demonstração ConectCampo',
        role: UserRole.COMPANY,
        emailVerified: true,
        isActive: true,
        consentLgpd: true,
        consentLgpdAt: new Date(),
      },
    });

    const profile = await this.prisma.producerProfile.upsert({
      where: { userId: user.id },
      update: {
        tier: ProducerTier.FAIXA_B,
        annualRevenue: 4800000,
        totalArea: 780,
        crops: [CropType.SOJA, CropType.MILHO],
        state: BrazilianState.MT,
        city: 'Campo Verde',
        hasIrrigation: true,
        hasInsurance: true,
        yearsInActivity: 12,
        numberOfEmployees: 8,
        deletedAt: null,
      },
      create: {
        userId: user.id,
        tier: ProducerTier.FAIXA_B,
        annualRevenue: 4800000,
        totalArea: 780,
        crops: [CropType.SOJA, CropType.MILHO],
        state: BrazilianState.MT,
        city: 'Campo Verde',
        hasIrrigation: true,
        hasInsurance: true,
        yearsInActivity: 12,
        numberOfEmployees: 8,
      },
    });

    await this.prisma.financialProfile.upsert({
      where: { producerProfileId: profile.id },
      update: {
        annualRevenue: 4800000,
        totalDebt: 620000,
        debtToRevenueRatio: 0.1292,
        cashFlowMonthly: [310000, 335000, 370000, 410000, 455000, 520000, 490000, 430000, 405000, 390000, 420000, 465000],
        guaranteeValue: 2800000,
        hasNegativeRecords: false,
        creditHistoryYears: 10,
        deletedAt: null,
      },
      create: {
        producerProfileId: profile.id,
        annualRevenue: 4800000,
        totalDebt: 620000,
        debtToRevenueRatio: 0.1292,
        cashFlowMonthly: [310000, 335000, 370000, 410000, 455000, 520000, 490000, 430000, 405000, 390000, 420000, 465000],
        guaranteeValue: 2800000,
        hasNegativeRecords: false,
        creditHistoryYears: 10,
      },
    });

    const subscription = await this.prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    if (subscription) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: SubscriptionPlan.PRO,
          paymentStatus: PaymentStatus.ACTIVE,
          isActive: true,
          currentPeriodEnd: oneYearFromNow,
        },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          plan: SubscriptionPlan.PRO,
          paymentStatus: PaymentStatus.ACTIVE,
          isActive: true,
          currentPeriodEnd: oneYearFromNow,
        },
      });
    }

    const activeOperation = await this.prisma.operationRequest.findFirst({
      where: { producerProfileId: profile.id, notes: 'APP_REVIEW_SAMPLE_ACTIVE' },
    });
    const operation = activeOperation ?? await this.prisma.operationRequest.create({
      data: {
        producerProfileId: profile.id,
        type: OperationType.CUSTEIO,
        status: OperationStatus.PROPOSALS_RECEIVED,
        requestedAmount: 750000,
        termMonths: 12,
        purpose: 'Custeio da safra de soja — demonstração',
        guarantees: [GuaranteeType.PENHOR_SAFRA, GuaranteeType.CPR_FINANCEIRA],
        guaranteeValue: 1100000,
        notes: 'APP_REVIEW_SAMPLE_ACTIVE',
      },
    });

    const completedOperation = await this.prisma.operationRequest.findFirst({
      where: { producerProfileId: profile.id, notes: 'APP_REVIEW_SAMPLE_COMPLETED' },
    });
    if (!completedOperation) {
      await this.prisma.operationRequest.create({
        data: {
          producerProfileId: profile.id,
          type: OperationType.INVESTIMENTO,
          status: OperationStatus.COMPLETED,
          requestedAmount: 420000,
          termMonths: 24,
          purpose: 'Irrigação de precisão — demonstração',
          guarantees: [GuaranteeType.IMOVEL_RURAL],
          guaranteeValue: 980000,
          notes: 'APP_REVIEW_SAMPLE_COMPLETED',
        },
      });
    }

    const partner = await this.prisma.partnerInstitution.upsert({
      where: { cnpj: 'APP-REVIEW-PARTNER' },
      update: { name: 'Cooperativa Horizonte (Demonstração)', isActive: true },
      create: {
        name: 'Cooperativa Horizonte (Demonstração)',
        type: PartnerType.COOPERATIVA,
        cnpj: 'APP-REVIEW-PARTNER',
        contactEmail: 'parceiro@demo.conectcampo.invalid',
        minTicket: 100000,
        maxTicket: 5000000,
        acceptedGuarantees: [GuaranteeType.PENHOR_SAFRA, GuaranteeType.CPR_FINANCEIRA],
        acceptedCrops: [CropType.SOJA, CropType.MILHO],
        acceptedStates: [BrazilianState.MT],
        acceptedOperations: [OperationType.CUSTEIO, OperationType.INVESTIMENTO],
        minScore: 60,
        maxDebtRatio: 0.45,
      },
    });

    const proposal = await this.prisma.proposal.findFirst({
      where: { operationId: operation.id, partnerId: partner.id },
    });
    if (!proposal) {
      await this.prisma.proposal.create({
        data: {
          operationId: operation.id,
          partnerId: partner.id,
          amount: 720000,
          interestRate: 13.9,
          termMonths: 12,
          conditions: 'Condições exclusivamente demonstrativas para revisão do aplicativo.',
          requiredGuarantees: [GuaranteeType.PENHOR_SAFRA],
          status: ProposalStatus.PENDING,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const reviewNotification = await this.prisma.notification.findFirst({
      where: { userId: user.id, type: 'app-review-demo' },
    });
    if (!reviewNotification) {
      await this.prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Ambiente demonstrativo pronto',
          message: 'Explore operações, propostas, documentos, CPR, campo, mercado e configurações sem usar dados reais.',
          type: 'app-review-demo',
          link: '/dashboard',
        },
      });
    }

    this.logger.log(`App Review user ready (${user.role}).`);
  }
}
