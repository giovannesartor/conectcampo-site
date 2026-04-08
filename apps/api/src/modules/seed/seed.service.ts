import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserRole, SubscriptionPlan, PaymentStatus } from '@prisma/client';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      await this.seedAdminUser();
      await this.seedTestUsers();
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

    this.logger.log(`Admin user ready: ${user.email} (${user.role})`);
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

    this.logger.log(
      `Test user ready: ${investidor.email} (${investidor.role}) — oferece crédito`,
    );

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

    this.logger.log(
      `Test user ready: ${empresa.email} (${empresa.role}) — busca crédito`,
    );
  }
}
