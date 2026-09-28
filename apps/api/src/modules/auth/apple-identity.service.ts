import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cron } from '@nestjs/schedule';
import { createCipheriv, createDecipheriv, createHash, createPrivateKey, createPublicKey, randomBytes, sign } from 'crypto';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { AppleAuthDto } from './dto/apple-auth.dto';

const APPLE = 'https://appleid.apple.com';
const CLIENT_ID = 'digital.conectcampo.app';
type AppleClaims = { sub: string; email?: string; email_verified?: boolean | string; nonce?: string; exp: number; iat: number };
type AppleKey = { kid: string; kty: string; alg: string; use: string; n: string; e: string };

@Injectable()
export class AppleIdentityService {
  private keys: AppleKey[] = [];
  private keysUntil = 0;
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly jwt: JwtService) {}

  get available() {
    try {
      return this.config.get('APPLE_SIGN_IN_ENABLED') === 'true'
        && !!this.config.get('APPLE_SIGN_IN_TEAM_ID') && !!this.config.get('APPLE_SIGN_IN_KEY_ID')
        && createPrivateKey(this.privateKey()).asymmetricKeyType === 'ec'
        && this.encryptionKey().length === 32;
    } catch { return false; }
  }

  private privateKey() { return Buffer.from(this.config.get<string>('APPLE_SIGN_IN_PRIVATE_KEY_BASE64', ''), 'base64').toString('utf8'); }
  private encryptionKey() {
    const key = Buffer.from(this.config.get<string>('APPLE_SIGN_IN_ENCRYPTION_KEY', ''), 'base64');
    if (key.length !== 32) throw new Error('Apple encryption key missing');
    return key;
  }
  encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    return [iv, cipher.update(value, 'utf8'), cipher.final(), cipher.getAuthTag()].map(x => x.toString('base64url')).join('.');
  }
  private decrypt(value: string) {
    const [iv, data, final, tag] = value.split('.').map(x => Buffer.from(x, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(Buffer.concat([data, final])), decipher.final()]).toString('utf8');
  }
  hash(value: string) { return createHash('sha256').update(value).digest('hex'); }

  async status() {
    const [linkedAccounts, pendingRevocations] = await Promise.all([
      this.prisma.appleIdentity.count(), this.prisma.appleRevocation.count(),
    ]);
    return { available: this.available, linkedAccounts, pendingRevocations };
  }

  private clientSecret() {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: this.config.get('APPLE_SIGN_IN_KEY_ID') })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ iss: this.config.get('APPLE_SIGN_IN_TEAM_ID'), sub: CLIENT_ID, aud: APPLE, iat: now, exp: now + 300 })).toString('base64url');
    const content = `${header}.${payload}`;
    return `${content}.${sign('sha256', Buffer.from(content), { key: this.privateKey(), dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
  }

  async challenge(purpose: 'AUTH' | 'LINK' | 'DELETE', userId?: string) {
    if (!this.available) throw new ServiceUnavailableException('Login Apple indisponível no momento.');
    const nonce = randomBytes(32).toString('hex');
    const record = await this.prisma.appleChallenge.create({ data: { nonce, purpose, userId, expiresAt: new Date(Date.now() + 300_000) } });
    return { challengeId: record.id, nonce };
  }

  async verifyIdentityToken(token: string, nonce: string): Promise<AppleClaims> {
    const header = this.jwt.decode(token, { complete: true }) as { header?: { kid?: string; alg?: string } } | null;
    if (!header?.header?.kid || header.header.alg !== 'RS256') throw new UnauthorizedException('Credencial Apple inválida.');
    const kid = header.header.kid;
    if (Date.now() > this.keysUntil || !this.keys.some(k => k.kid === kid)) {
      try {
        const response = await axios.get(`${APPLE}/auth/keys`, { timeout: 10_000, maxRedirects: 0 });
        if (!Array.isArray(response.data?.keys)) throw new Error('Invalid keys');
        this.keys = response.data.keys;
        this.keysUntil = Date.now() + 3600_000;
      } catch { throw new ServiceUnavailableException('Validação Apple indisponível. Tente novamente.'); }
    }
    const jwk = this.keys.find(k => k.kid === kid && k.kty === 'RSA' && k.alg === 'RS256' && k.use === 'sig');
    if (!jwk) throw new UnauthorizedException('Credencial Apple inválida.');
    try {
      const publicKey = createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' }).toString();
      const claims = await this.jwt.verifyAsync<AppleClaims>(token, { publicKey, algorithms: ['RS256'], issuer: APPLE, audience: CLIENT_ID });
      if (!claims.sub || claims.nonce !== nonce || !Number.isFinite(claims.exp) || !Number.isFinite(claims.iat) || Math.abs(Date.now() / 1000 - claims.iat) > 600) {
        throw new Error('Invalid claims');
      }
      return claims;
    } catch { throw new UnauthorizedException('Credencial Apple inválida ou expirada.'); }
  }

  async authenticate(dto: AppleAuthDto, purpose: 'AUTH' | 'LINK' | 'DELETE', userId?: string) {
    if (!this.available) throw new ServiceUnavailableException('Login Apple indisponível no momento.');
    const challenge = await this.prisma.appleChallenge.findUnique({ where: { id: dto.challengeId } });
    if (!challenge || challenge.usedAt || challenge.expiresAt <= new Date() || challenge.purpose !== purpose || challenge.userId !== (userId ?? null)) {
      throw new UnauthorizedException('Sessão Apple expirada. Tente novamente.');
    }
    const used = await this.prisma.appleChallenge.updateMany({ where: { id: challenge.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
    if (used.count !== 1) throw new UnauthorizedException('Sessão Apple já utilizada.');
    let data: { id_token: string; refresh_token: string };
    try {
      const response = await axios.post(`${APPLE}/auth/token`, new URLSearchParams({ client_id: CLIENT_ID, client_secret: this.clientSecret(), code: dto.authorizationCode, grant_type: 'authorization_code' }).toString(), { timeout: 10_000, maxRedirects: 0, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      data = response.data;
    } catch { throw new UnauthorizedException('Não foi possível confirmar o acesso com a Apple. Tente novamente.'); }
    if (!data.id_token || !data.refresh_token) throw new UnauthorizedException('Resposta Apple incompleta.');
    const claims = await this.verifyIdentityToken(data.id_token, challenge.nonce);
    return { subject: claims.sub, email: (claims.email_verified === true || claims.email_verified === 'true') ? claims.email?.toLowerCase() : undefined, refreshToken: this.encrypt(data.refresh_token), name: dto.name?.trim().slice(0, 150) };
  }

  async registration(token: string) {
    const record = await this.prisma.appleRegistration.findUnique({ where: { tokenHash: this.hash(token) } });
    if (!record || record.expiresAt <= new Date()) throw new BadRequestException('Confirmação Apple expirada. Entre com Apple novamente.');
    return record;
  }

  @Cron('*/10 * * * *')
  async cleanupAndRevoke() {
    if (!this.available) return;
    // Delete only temporary, expired auth material; never user/business records.
    await this.prisma.appleChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await this.prisma.appleRegistration.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const jobs = await this.prisma.appleRevocation.findMany({ where: { nextAttemptAt: { lte: new Date() } }, take: 20 });
    for (const job of jobs) {
      const locked = await this.prisma.appleRevocation.updateMany({ where: { id: job.id, nextAttemptAt: { lte: new Date() } }, data: { nextAttemptAt: new Date(Date.now() + 3600_000), attempts: { increment: 1 } } });
      if (!locked.count) continue;
      try {
        await axios.post(`${APPLE}/auth/revoke`, new URLSearchParams({ client_id: CLIENT_ID, client_secret: this.clientSecret(), token: this.decrypt(job.refreshToken), token_type_hint: 'refresh_token' }).toString(), { timeout: 10_000, maxRedirects: 0, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        await this.prisma.appleRevocation.delete({ where: { id: job.id } });
      } catch { /* Durable retry; never log Apple response/config containing credentials. */ }
    }
  }
}
