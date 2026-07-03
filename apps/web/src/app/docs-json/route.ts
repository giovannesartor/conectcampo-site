import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Compatibilidade: /docs-json redireciona para a especificação OpenAPI servida
 * sob o prefixo /api/v1 (mesmo proxy que atende toda a API, sem 404 de ingress).
 */
export function GET(request: Request) {
  return NextResponse.redirect(new URL('/api/v1/openapi.json', request.url), 308);
}
