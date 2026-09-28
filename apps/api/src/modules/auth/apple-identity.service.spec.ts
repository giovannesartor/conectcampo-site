import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { generateKeyPairSync } from 'crypto';
import axios from 'axios';
import { AppleIdentityService } from './apple-identity.service';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('axios');

describe('AppleIdentityService', () => {
  const jwt = new JwtService();
  const signing = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privateKey = signing.privateKey.export({ type: 'pkcs8', format: 'pem' });
  const jwk = { ...signing.publicKey.export({ format: 'jwk' }), kid: 'apple-test', alg: 'RS256', use: 'sig' };
  const ecKey = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  let service: AppleIdentityService;
  let prisma: any;

  function token(payload: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
    return jwt.sign({ sub: 'apple-subject', nonce: 'nonce', email: 'producer@example.com', email_verified: true, ...payload }, {
      privateKey, algorithm: 'RS256', keyid: 'apple-test', issuer: 'https://appleid.apple.com', audience: 'digital.conectcampo.app', expiresIn: 300, ...options,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = { appleChallenge: { findUnique: jest.fn(), updateMany: jest.fn() }, appleRegistration: { findUnique: jest.fn() } };
    service = new AppleIdentityService(prisma, new ConfigService({
      APPLE_SIGN_IN_ENABLED: 'true', APPLE_SIGN_IN_TEAM_ID: 'test-team', APPLE_SIGN_IN_KEY_ID: 'test-key',
      APPLE_SIGN_IN_PRIVATE_KEY_BASE64: Buffer.from(ecKey).toString('base64'), APPLE_SIGN_IN_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString('base64'),
    }), jwt);
    (axios.get as jest.Mock).mockResolvedValue({ data: { keys: [jwk] } });
  });

  it('verifies Apple signature, issuer, audience and nonce', async () => {
    expect((await service.verifyIdentityToken(token(), 'nonce')).sub).toBe('apple-subject');
  });
  it.each([
    [{ nonce: 'wrong' }, {}],
    [{}, { audience: 'another.app' }],
    [{}, { issuer: 'https://attacker.example' }],
    [{}, { expiresIn: -1 }],
    [{ iat: Math.floor(Date.now() / 1000) - 1000 }, {}],
  ])('rejects invalid claims (%j)', async (claims, options) => {
    await expect(service.verifyIdentityToken(token(claims, options), 'nonce')).rejects.toThrow(UnauthorizedException);
  });
  it('rejects a forged signature', async () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' });
    await expect(service.verifyIdentityToken(token({}, { privateKey: other }), 'nonce')).rejects.toThrow(UnauthorizedException);
  });
  it('rejects a consumed challenge without contacting the token endpoint', async () => {
    prisma.appleChallenge.findUnique.mockResolvedValue({ usedAt: new Date() });
    await expect(service.authenticate({ challengeId: 'id', authorizationCode: 'code' }, 'AUTH')).rejects.toThrow(UnauthorizedException);
    expect(axios.post).not.toHaveBeenCalled();
  });
  it('binds a linking challenge to both purpose and authenticated user', async () => {
    prisma.appleChallenge.findUnique.mockResolvedValue({ id: 'id', purpose: 'LINK', userId: 'user-a', expiresAt: new Date(Date.now() + 300000) });
    await expect(service.authenticate({ challengeId: 'id', authorizationCode: 'code' }, 'LINK', 'user-b')).rejects.toThrow(UnauthorizedException);
    expect(axios.post).not.toHaveBeenCalled();
  });
  it('prevents a replay race before code exchange', async () => {
    prisma.appleChallenge.findUnique.mockResolvedValue({ id: 'id', purpose: 'AUTH', userId: null, expiresAt: new Date(Date.now() + 300000) });
    prisma.appleChallenge.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.authenticate({ challengeId: 'id', authorizationCode: 'code' }, 'AUTH')).rejects.toThrow(UnauthorizedException);
    expect(axios.post).not.toHaveBeenCalled();
  });
  it('encrypts provider refresh tokens with randomized ciphertext', () => {
    const first = service.encrypt('secret-token');
    expect(first).not.toContain('secret-token');
    expect(service.encrypt('secret-token')).not.toBe(first);
    expect(first.split('.')).toHaveLength(4);
  });
  it('is disabled without the complete server configuration', () => {
    expect(new AppleIdentityService(prisma, new ConfigService({ APPLE_SIGN_IN_ENABLED: 'true' }), jwt).available).toBe(false);
  });
});
