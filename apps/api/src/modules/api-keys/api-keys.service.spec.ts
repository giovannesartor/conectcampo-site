import { ApiKeysService } from './api-keys.service';

function makePrisma(overrides: any = {}) {
  return {
    apiKey: {
      create: jest.fn(async ({ data, select }: any) => ({
        id: 'k1',
        name: data.name,
        prefix: data.prefix,
        scopes: data.scopes,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
      })),
      findMany: jest.fn(async () => []),
      findUnique: jest.fn(),
      update: jest.fn(async () => ({})),
      ...overrides.apiKey,
    },
  } as any;
}

describe('ApiKeysService', () => {
  describe('create', () => {
    it('usa scopes padrão [read, write] e sem expiração quando omitidos', async () => {
      const prisma = makePrisma();
      const service = new ApiKeysService(prisma);
      const res = await service.create('u1', {});
      const arg = prisma.apiKey.create.mock.calls[0][0].data;
      expect(arg.scopes).toEqual(['read', 'write']);
      expect(arg.expiresAt).toBeNull();
      expect(res.secret).toMatch(/^ck_live_/);
    });

    it('calcula expiresAt a partir de expiresInDays e deduplica scopes', async () => {
      const prisma = makePrisma();
      const service = new ApiKeysService(prisma);
      await service.create('u1', { scopes: ['read', 'read'] as any, expiresInDays: 30 });
      const arg = prisma.apiKey.create.mock.calls[0][0].data;
      expect(arg.scopes).toEqual(['read']);
      expect(arg.expiresAt).toBeInstanceOf(Date);
      expect(arg.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('validate', () => {
    const activeUser = { id: 'u1', role: 'PRODUCER', email: 'a@b.com', isActive: true };

    it('retorna null para chave inexistente', async () => {
      const prisma = makePrisma({ apiKey: { findUnique: jest.fn(async () => null) } });
      const service = new ApiKeysService(prisma);
      expect(await service.validate('x')).toBeNull();
    });

    it('retorna null para chave revogada', async () => {
      const prisma = makePrisma({
        apiKey: { findUnique: jest.fn(async () => ({ id: 'k1', revokedAt: new Date(), scopes: ['read'], user: activeUser })) },
      });
      const service = new ApiKeysService(prisma);
      expect(await service.validate('x')).toBeNull();
    });

    it('retorna null para chave expirada', async () => {
      const prisma = makePrisma({
        apiKey: {
          findUnique: jest.fn(async () => ({
            id: 'k1',
            revokedAt: null,
            expiresAt: new Date(Date.now() - 1000),
            scopes: ['read', 'write'],
            user: activeUser,
          })),
        },
      });
      const service = new ApiKeysService(prisma);
      expect(await service.validate('x')).toBeNull();
    });

    it('retorna principal com scopes para chave válida', async () => {
      const prisma = makePrisma({
        apiKey: {
          findUnique: jest.fn(async () => ({
            id: 'k1',
            revokedAt: null,
            expiresAt: null,
            scopes: ['read'],
            user: activeUser,
          })),
          update: jest.fn(async () => ({})),
        },
      });
      const service = new ApiKeysService(prisma);
      const principal = await service.validate('x');
      expect(principal).toMatchObject({ id: 'u1', role: 'PRODUCER', scopes: ['read'], keyId: 'k1' });
    });
  });
});
