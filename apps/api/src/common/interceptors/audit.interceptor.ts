import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

const METHOD_ACTION: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

/**
 * Registra automaticamente, no log de auditoria, toda mutação (POST/PUT/PATCH/DELETE)
 * feita por um usuário autenticado. Eventos de autenticação (login/logout/registro)
 * são registrados explicitamente no AuthService, então /auth/* é ignorado aqui.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const action = METHOD_ACTION[req.method];

    return next.handle().pipe(
      tap(() => {
        try {
          const userId: string | undefined = req.user?.sub ?? req.user?.id;
          if (!action || !userId) return; // só mutações de usuários autenticados

          const path: string = req.route?.path ?? req.originalUrl ?? req.url ?? '';
          if (path.includes('/auth/')) return; // tratado explicitamente no AuthService

          // entidade = primeiro segmento significativo da rota
          const segments = String(req.originalUrl || path)
            .split('?')[0]
            .split('/')
            .filter((s) => s && s !== 'api' && !/^v\d+$/.test(s));
          const entity = segments[0] ?? 'desconhecido';
          const entityId =
            req.params?.id ?? (segments[1] && !segments[1].includes(':') ? segments[1] : '');

          void this.audit.log({
            userId,
            action,
            entity,
            entityId: entityId || '',
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent'],
          });
        } catch {
          // auditoria nunca pode quebrar a requisição
        }
      }),
    );
  }
}
