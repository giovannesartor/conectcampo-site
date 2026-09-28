import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cron } from '@nestjs/schedule';
import { createHash, createPublicKey, randomBytes } from 'crypto';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleAuthDto } from './dto/google-auth.dto';

type GoogleKey = { kid: string; kty: string; alg: string; use: string; n: string; e: string };
type GoogleClaims = { sub: string; email?: string; email_verified?: boolean; hd?: string; name?: string; nonce?: string; exp: number; iat: number; azp?: string };

@Injectable()
export class GoogleIdentityService {
  private keys: GoogleKey[] = [];
  private keysUntil = 0;
  private keysFetch?: Promise<void>;
  private lastFetch = 0;
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly jwt: JwtService) {}
  get clientId() { return this.config.get<string>('GOOGLE_WEB_CLIENT_ID', ''); }
  get available() { return this.config.get('GOOGLE_SIGN_IN_ENABLED') === 'true' && /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(this.clientId); }
  hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
  async status() { return { available: this.available, nativeConfigured: this.available && !!this.config.get('GOOGLE_IOS_CLIENT_ID'), linkedAccounts: await this.prisma.googleIdentity.count() }; }

  async challenge(purpose: 'AUTH' | 'LINK', userId?: string) {
    if (!this.available) throw new ServiceUnavailableException('Login Google indisponível no momento.');
    const nonce = randomBytes(32).toString('hex');
    const record = await this.prisma.googleChallenge.create({ data: { nonce, purpose, userId, expiresAt: new Date(Date.now() + 300_000) } });
    return { challengeId: record.id, nonce };
  }

  private async refreshKeys() {
    if (this.keysFetch) return this.keysFetch;
    // Bound unknown-kid traffic while still allowing Google's normal key rotation.
    if (Date.now() - this.lastFetch < 30_000 && this.keys.length) return;
    this.lastFetch = Date.now();
    this.keysFetch = (async () => {
      try {
        const { data, headers } = await axios.get('https://www.googleapis.com/oauth2/v3/certs', { timeout: 10_000, maxRedirects: 0, maxContentLength: 100_000 });
        if (!Array.isArray(data?.keys) || !data.keys.length || data.keys.length > 20) throw new Error('Invalid keys');
        this.keys = data.keys;
        const seconds = Number(/max-age=(\d+)/.exec(String(headers?.['cache-control'] ?? ''))?.[1] ?? 3600);
        this.keysUntil = Date.now() + Math.min(Math.max(seconds, 30), 21600) * 1000;
      } catch { throw new ServiceUnavailableException('Validação Google indisponível. Tente novamente.'); }
    })().finally(() => { this.keysFetch = undefined; });
    return this.keysFetch;
  }

  async verifyIdentityToken(token: string, nonce: string) {
    const decoded = this.jwt.decode(token, { complete: true }) as { header?: { kid?: string; alg?: string } } | null;
    if (!decoded?.header?.kid || decoded.header.alg !== 'RS256') throw new UnauthorizedException('Credencial Google inválida.');
    if (Date.now() >= this.keysUntil || !this.keys.some(k => k.kid === decoded.header!.kid)) await this.refreshKeys();
    const key = this.keys.find(k => k.kid === decoded.header!.kid && k.kty === 'RSA' && k.alg === 'RS256' && k.use === 'sig');
    if (!key) throw new UnauthorizedException('Credencial Google inválida.');
    try {
      const publicKey = createPublicKey({ key, format: 'jwk' }).export({ type: 'spki', format: 'pem' }).toString();
      const claims = await this.jwt.verifyAsync<GoogleClaims>(token, { publicKey, algorithms: ['RS256'], issuer: ['accounts.google.com', 'https://accounts.google.com'], audience: this.clientId });
      const authorizedPresenters = [this.clientId, this.config.get<string>('GOOGLE_IOS_CLIENT_ID')].filter(Boolean);
      if (typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 255 || claims.nonce !== nonce || !Number.isFinite(claims.exp) || !Number.isFinite(claims.iat) || Math.abs(Date.now() / 1000 - claims.iat) > 600 || (claims.azp && !authorizedPresenters.includes(claims.azp))) throw new Error('Invalid claims');
      return claims;
    } catch { throw new UnauthorizedException('Credencial Google inválida ou expirada.'); }
  }

  async authenticate(dto: GoogleAuthDto, purpose: 'AUTH' | 'LINK', userId?: string) {
    if (!this.available) throw new ServiceUnavailableException('Login Google indisponível no momento.');
    const challenge = await this.prisma.googleChallenge.findUnique({ where: { id: dto.challengeId } });
    if (!challenge || challenge.usedAt || challenge.expiresAt <= new Date() || challenge.purpose !== purpose || challenge.userId !== (userId ?? null)) throw new UnauthorizedException('Sessão Google expirada. Tente novamente.');
    const claims = await this.verifyIdentityToken(dto.credential, challenge.nonce);
    const used = await this.prisma.googleChallenge.updateMany({ where: { id: challenge.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
    if (used.count !== 1) throw new UnauthorizedException('Sessão Google já utilizada.');
    const email = typeof claims.email === 'string' && claims.email_verified === true ? claims.email.trim().toLowerCase() : undefined;
    return { subject: claims.sub, email, emailVerified: !!email && (email.endsWith('@gmail.com') || !!claims.hd), name: typeof claims.name === 'string' ? claims.name.trim().slice(0, 150) : '' };
  }

  async registration(token: string) {
    const record = await this.prisma.googleRegistration.findUnique({ where: { tokenHash: this.hash(token) } });
    if (!record || record.expiresAt <= new Date()) throw new BadRequestException('Confirmação Google expirada. Entre com Google novamente.');
    return record;
  }

  @Cron('*/10 * * * *')
  async cleanup() {
    await this.prisma.googleChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await this.prisma.googleRegistration.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }
}
