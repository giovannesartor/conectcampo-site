import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

function sha256(v: string) {
  return createHash('sha256').update(v).digest('hex');
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria uma chave; retorna o segredo em texto puro UMA única vez. */
  async create(userId: string, name: string) {
    const secret = `ck_live_${randomBytes(24).toString('hex')}`;
    const prefix = secret.slice(0, 12);

    const key = await this.prisma.apiKey.create({
      data: { userId, name: name?.trim() || 'API Key', prefix, keyHash: sha256(secret) },
      select: { id: true, name: true, prefix: true, createdAt: true },
    });

    // O segredo só é retornado agora — depois fica irrecuperável.
    return { ...key, secret };
  }

  async list(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, prefix: true, lastUsedAt: true, revokedAt: true, createdAt: true },
    });
  }

  async revoke(userId: string, id: string, role: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('Chave não encontrada');
    if (role !== UserRole.ADMIN && key.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
      select: { id: true, revokedAt: true },
    });
  }

  /** Valida uma chave (para autenticação via X-API-Key em integrações). */
  async validate(secret: string) {
    if (!secret) return null;
    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash: sha256(secret) },
      include: { user: { select: { id: true, role: true, email: true, isActive: true } } },
    });
    if (!key || key.revokedAt || !key.user?.isActive) return null;
    // atualiza lastUsedAt sem bloquear
    void this.prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => null);
    return key.user;
  }
}
