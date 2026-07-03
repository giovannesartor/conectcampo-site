import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ApiKeysService } from '../../api-keys/api-keys.service';

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
      const user = await this.apiKeys.validate(apiKey);
      if (!user) {
        return false;
      }
      request.user = { sub: user.id, email: user.email, role: user.role };
      request.authVia = 'api-key';
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
}
