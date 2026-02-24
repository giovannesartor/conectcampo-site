import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AsaasService } from '../subscriptions/asaas.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole, SubscriptionPlan } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly asaasService: AsaasService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // Admin emails resolved from environment
  private readonly adminEmails: string[] = (
    process.env.ADMIN_EMAILS ?? ''
  )
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  private resolveRole(email: string, requested: UserRole): UserRole {
    return this.adminEmails.includes(email.toLowerCase()) ? UserRole.ADMIN : requested;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = this.resolveRole(dto.email, dto.role);
    const isFree = dto.plan === SubscriptionPlan.CORPORATE;

    // Conta inativa até pagamento (planos pagos) ou ativa direto (plano grátis)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role,
        phone: dto.phone,
        cpf: dto.cpf,
        cnpj: dto.cnpj,
        isActive: isFree, // free = ativo, paid = aguarda pagamento
        consentLgpd: true,
        consentLgpdAt: new Date(),
      },
    });

    // ── Plano gratuito (Instituição Financeira) ──────────────────────────────
    if (isFree) {
      await this.subscriptionsService.getOrCreateFreeSubscription(user.id);
      const verificationToken = await this.createEmailVerificationToken(user.id);
      this.mailService.sendWelcome(user.email, user.name).catch(() => null);
      this.mailService
        .sendEmailVerification(user.email, user.name, verificationToken)
        .catch(() => null);

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      this.logger.log(`Free user registered: ${user.email}`);

      return {
        requiresPayment: false,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        ...tokens,
      };
    }

    // ── Planos pagos — criar customer + assinatura no Asaas ──────────────────
    const cpfCnpj = (dto.cpf ?? dto.cnpj)!;

    let invoiceUrl: string | null = null;
    try {
      const result = await this.asaasService.createCustomerAndSubscription({
        userId: user.id,
        name: user.name,
        email: user.email,
        cpfCnpj,
        phone: dto.phone,
        plan: dto.plan,
      });
      invoiceUrl = result.invoiceUrl;
    } catch (err: any) {
      // Se Asaas falhar, remover usuário criado para não deixar registro órfão
      await this.prisma.user.delete({ where: { id: user.id } }).catch(() => null);
      this.logger.error(`Asaas error during register: ${err.message}`);
      throw new BadRequestException(
        'Erro ao processar pagamento. Verifique seus dados e tente novamente.',
      );
    }

    this.logger.log(`Paid user registered (pending payment): ${user.email}`);

    return {
      requiresPayment: true,
      invoiceUrl,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async login(dto: LoginDto) {
    try {
      this.logger.log(`Login attempt for: ${dto.email}`);

      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user || !user.isActive || user.deletedAt) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Update last login and upgrade role if needed
      const shouldUpgrade = this.adminEmails.includes(user.email.toLowerCase()) && user.role !== 'ADMIN';
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          ...(shouldUpgrade ? { role: 'ADMIN' } : {}),
        },
      });
      if (shouldUpgrade) {
        user.role = 'ADMIN' as any;
        this.logger.log(`Upgraded ${user.email} to ADMIN`);
      }

      this.logger.log(`Generating tokens for: ${user.email}`);
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      this.logger.log(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login failed for ${dto.email}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );

    return tokens;
  }

  async logout(userId: string) {
    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Logout realizado com sucesso' };
  }

  // ─── Forgot / Reset Password ─────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Sempre retornar mensagem genérica (security)
    if (!user || !user.isActive || user.deletedAt) {
      return { message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' };
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    await this.mailService.sendPasswordReset(user.email, user.name, token);

    this.logger.log(`Password reset requested for: ${user.email}`);

    return { message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Revogar todos os refresh tokens por segurança
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    this.mailService.sendPasswordChanged(record.user.email, record.user.name).catch(() => null);

    this.logger.log(`Password reset for: ${record.user.email}`);

    return { message: 'Senha redefinida com sucesso. Faça login com a nova senha.' };
  }

  // ─── Email Verification ───────────────────────────────────────────────────────

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log(`Email verified: ${record.user.email}`);

    return { message: 'E-mail confirmado com sucesso!' };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new BadRequestException('Usuário não encontrado');
    if (user.emailVerified) throw new BadRequestException('E-mail já verificado');

    const token = await this.createEmailVerificationToken(user.id);
    await this.mailService.sendEmailVerification(user.email, user.name, token);

    return { message: 'E-mail de verificação reenviado.' };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuário não encontrado');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Senha atual incorreta');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revogar todos os refresh tokens por segurança
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Password changed for user: ${user.email}`);
    return { message: 'Senha alterada com sucesso.' };
  }

  // ─── Private token helpers ────────────────────────────────────────────────────

  private async createEmailVerificationToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    await this.prisma.emailVerificationToken.create({
      data: { token, userId, expiresAt },
    });
    return token;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );

    // Parse duration string like '7d', '14d', '30d'
    const match = refreshExpiresIn.match(/^(\d+)d$/);
    const days = match ? parseInt(match[1]) : 7;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15min em segundos
    };
  }
}

