import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { redactString, redactUrl } from '../logging/redact';

/**
 * LoggingInterceptor — registra todas as requisições HTTP no console.
 *
 * Em produção (Railway) cada linha vira um evento de log indexável.
 * Formato: [HTTP] POST /api/v1/auth/login 201 143ms — req=... user=abc123 ip=1.2.3.4
 * Propaga um request-id (header X-Request-Id) para correlação de logs.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl, ip, headers } = req;
    const safeUrl = redactUrl(originalUrl);

    // Request-id: reaproveita o recebido (ex.: proxy) ou gera um novo.
    const receivedRequestId = headers['x-request-id'];
    const requestId = typeof receivedRequestId === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(receivedRequestId)
      ? receivedRequestId
      : randomUUID();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const userId: string = (req as any).user?.sub ?? (req as any).user?.id ?? 'anon';
    const userAgent = redactString(String(headers['user-agent'] ?? '-')).replace(/[\r\n"]/g, ' ');
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const via = (req as any).authVia === 'api-key' ? ' via=api-key' : '';
          this.logger.log(
            `${method} ${safeUrl} ${res.statusCode} ${ms}ms — req=${requestId} user=${userId}${via} ip=${ip} ua="${userAgent}"`,
          );
        },
        error: (err: any) => {
          const ms = Date.now() - start;
          const status: number = err?.status ?? 500;
          this.logger.warn(
            `${method} ${safeUrl} ${status} ${ms}ms — req=${requestId} user=${userId} ip=${ip} err="${redactString(String(err?.message ?? 'Erro'))}"`,
          );
        },
      }),
    );
  }
}
