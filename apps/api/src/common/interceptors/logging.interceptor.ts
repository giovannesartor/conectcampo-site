import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * LoggingInterceptor — registra todas as requisições HTTP no console.
 *
 * Em produção (Railway) cada linha vira um evento de log indexável.
 * Formato: [HTTP] POST /api/v1/auth/login 201 143ms — user=abc123 ip=1.2.3.4
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl, ip, headers } = req;
    const userId: string = (req as any).user?.id ?? 'anon';
    const userAgent = headers['user-agent'] ?? '-';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const ms = Date.now() - start;
          this.logger.log(
            `${method} ${originalUrl} ${res.statusCode} ${ms}ms — user=${userId} ip=${ip} ua="${userAgent}"`,
          );
        },
        error: (err: any) => {
          const ms = Date.now() - start;
          const status: number = err?.status ?? 500;
          this.logger.warn(
            `${method} ${originalUrl} ${status} ${ms}ms — user=${userId} ip=${ip} err="${err?.message}"`,
          );
        },
      }),
    );
  }
}
