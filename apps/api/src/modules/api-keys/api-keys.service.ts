import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

function sha256(v: string) {
  return createHash('sha256').update(v).digest('hex');
}

export interface ApiKeyPrincipal {
  id: string;
  role: string;
  email: string;
  scopes: string[];
  keyId: string;
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria uma chave; retorna o segredo em texto puro UMA única vez. */
  async create(userId: string, dto: CreateApiKeyDto) {
    const secret = `ck_live_${randomBytes(24).toString('hex')}`;
    const prefix = secret.slice(0, 12);

    const scopes = dto.scopes && dto.scopes.length > 0 ? Array.from(new Set(dto.scopes)) : ['read', 'write'];
    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 86400000)
      : null;

    const key = await this.prisma.apiKey.create({
      data: {
        userId,
        name: dto.name?.trim() || 'API Key',
        prefix,
        keyHash: sha256(secret),
        scopes,
        expiresAt,
      },
      select: { id: true, name: true, prefix: true, scopes: true, expiresAt: true, createdAt: true },
    });

    // O segredo só é retornado agora — depois fica irrecuperável.
    return { ...key, secret };
  }

  async list(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        expiresAt: true,
        lastUsedAt: true,
        requestCount: true,
        revokedAt: true,
        createdAt: true,
      },
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
  async validate(secret: string): Promise<ApiKeyPrincipal | null> {
    if (!secret) return null;
    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash: sha256(secret) },
      include: { user: { select: { id: true, role: true, email: true, isActive: true } } },
    });
    if (!key || key.revokedAt || !key.user?.isActive) return null;
    if (key.expiresAt && key.expiresAt.getTime() < Date.now()) return null;

    // atualiza uso sem bloquear a requisição
    void this.prisma.apiKey
      .update({ where: { id: key.id }, data: { lastUsedAt: new Date(), requestCount: { increment: 1 } } })
      .catch(() => null);

    return {
      id: key.user.id,
      role: key.user.role,
      email: key.user.email,
      scopes: key.scopes?.length ? key.scopes : ['read', 'write'],
      keyId: key.id,
    };
  }
}
