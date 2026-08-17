const SENSITIVE_KEYS = new Set([
  'accesstoken',
  'apikey',
  'authorization',
  'clientsecret',
  'cookie',
  'idtoken',
  'password',
  'refreshtoken',
  'secret',
  'setcookie',
  'token',
]);

const REDACTED = '[REDACTED]';

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_\s]/g, '');
  return SENSITIVE_KEYS.has(normalized) ||
    normalized.endsWith('token') ||
    normalized.includes('password') ||
    normalized.endsWith('secret');
}

export function redactUrl(value: string): string {
  try {
    const url = new URL(value, 'http://local');
    for (const key of Array.from(url.searchParams.keys())) {
      if (isSensitiveKey(key) || key.toLowerCase() === 'code') {
        url.searchParams.set(key, REDACTED);
      }
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value.replace(
      /([?&](?:access_?token|refresh_?token|id_?token|token|api_?key|client_?secret|password|secret|code)=)[^&\s]*/gi,
      `$1${REDACTED}`,
    );
  }
}

export function redactString(value: string): string {
  return value
    .replace(
      /([?&](?:access_?token|refresh_?token|id_?token|token|api_?key|client_?secret|password|secret|code)=)[^&\s]*/gi,
      `$1${REDACTED}`,
    )
    .replace(/(Bearer\s+)[A-Za-z0-9._~+\/-]+/gi, `$1${REDACTED}`)
    .replace(
      /((?:"|')?(?:access_?token|refresh_?token|id_?token|token|api_?key|client_?secret|password|secret|authorization)(?:"|')?\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^,}\s]+)/gi,
      `$1"${REDACTED}"`,
    );
}

export function redactSensitiveData(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') return redactString(value);
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';

  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      isSensitiveKey(key) ? REDACTED : redactSensitiveData(item, seen),
    ]),
  );
}
