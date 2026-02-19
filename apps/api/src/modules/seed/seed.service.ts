import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      await this.seedAdminUser();
    } catch (err) {
      this.logger.error('Seed failed (non-fatal):', err?.message ?? err);
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
}
