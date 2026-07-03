import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ApiKeysService } from '../../api-keys/api-keys.service';

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly apiKeys: ApiKeysService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Autenticação por API Key (header X-API-Key) para integrações externas.
    // Quando presente, autentica a requisição em nome do usuário dono da chave.
    const request = context.switchToHttp().getRequest();
    const apiKey = (request.headers['x-api-key'] || request.headers['X-API-Key']) as
      | string
      | undefined;
    if (apiKey) {
      const principal = await this.apiKeys.validate(apiKey);
      if (!principal) {
        return false;
      }
      // Enforce de escopo: métodos de escrita exigem o scope "write".
      const method = (request.method || 'GET').toUpperCase();
      if (!READ_ONLY_METHODS.has(method) && !principal.scopes.includes('write')) {
        throw new ForbiddenException('Esta API Key é somente leitura (scope "read").');
      }
      request.user = { sub: principal.id, email: principal.email, role: principal.role };
      request.authVia = 'api-key';
      request.apiKeyId = principal.keyId;
      request.apiKeyScopes = principal.scopes;
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
}
