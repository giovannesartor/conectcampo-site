import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Serve a especificação OpenAPI da API no domínio do site (/docs-json).
 * Busca o spec gerado pelo backend e ajusta o "server" para o mesmo domínio,
 * de forma que o "Try it" da documentação use o proxy same-origin (/api/v1).
 */
export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_API_URL não configurada no ambiente do site.' },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(`${apiUrl}/docs-json`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Especificação indisponível (HTTP ${res.status}).` },
        { status: 502 },
      );
    }
    const spec = (await res.json()) as Record<string, any>;
    // Aponta o servidor para o mesmo domínio (proxy /api/v1), evitando CORS.
    spec.servers = [{ url: '/api/v1', description: 'Este site' }];
    return NextResponse.json(spec, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });
  } catch {
    return NextResponse.json({ error: 'Falha ao obter a especificação da API.' }, { status: 502 });
  }
}
