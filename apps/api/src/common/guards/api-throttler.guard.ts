import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limit por API Key (header X-API-Key) quando presente; caso contrário, por IP.
 * O ThrottlerGuard (v6) já emite os headers X-RateLimit-Limit/Remaining/Reset e Retry-After.
 */
@Injectable()
export class ApiThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const apiKey = req?.headers?.['x-api-key'] || req?.headers?.['X-API-Key'];
    if (apiKey) {
      return `key:${String(apiKey).slice(0, 24)}`;
    }
    const ip = Array.isArray(req?.ips) && req.ips.length ? req.ips[0] : req?.ip;
    return `ip:${ip}`;
  }
}
