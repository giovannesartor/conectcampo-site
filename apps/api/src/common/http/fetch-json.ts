import { Logger } from '@nestjs/common';

const logger = new Logger('fetchJson');

export interface FetchJsonOptions extends RequestInit {
  /** Timeout por tentativa (ms). Padrão 8000. */
  timeoutMs?: number;
  /** Número de novas tentativas em erro de rede/5xx. Padrão 2. */
  retries?: number;
  /** Backoff base (ms) entre tentativas. Padrão 300. */
  backoffMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Erro que não deve ser repetido (ex.: HTTP 4xx). */
class NonRetryableError extends Error {}

/**
 * fetch com timeout, retry exponencial e parsing JSON.
 * Repete em erro de rede ou HTTP 5xx; não repete em 4xx.
 * Lança em falha final (ou quando ok=false após esgotar tentativas).
 */
export async function fetchJson<T = any>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = 8000, retries = 2, backoffMs = 300, ...init } = options;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (res.ok) {
        return (await res.json()) as T;
      }
      // 4xx: não adianta repetir
      if (res.status < 500) {
        throw new NonRetryableError(`HTTP ${res.status} em ${url}`);
      }
      lastErr = new Error(`HTTP ${res.status} em ${url}`);
    } catch (err) {
      if (err instanceof NonRetryableError) {
        logger.warn(`Falha ao consultar ${url}: ${err.message}`);
        throw err;
      }
      lastErr = err;
      // AbortError (timeout) ou erro de rede — elegível para retry
    } finally {
      clearTimeout(timer);
    }

    if (attempt < retries) {
      await sleep(backoffMs * Math.pow(2, attempt));
    }
  }

  logger.warn(`Falha ao consultar ${url}: ${(lastErr as Error)?.message ?? lastErr}`);
  throw lastErr instanceof Error ? lastErr : new Error(`Falha ao consultar ${url}`);
}
