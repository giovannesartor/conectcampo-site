import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getBackendUrl(): string {
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
    'http://localhost:3001'
  );
}

async function proxyRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const backendUrl = getBackendUrl();
  const target = `${backendUrl}/api/v1/${path.join('/')}`;

  // Forward query string
  const url = new URL(target);
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // Forward headers (remove host so backend sees its own)
  const headers = new Headers(req.headers);
  headers.delete('host');

  const fetchInit: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward body for methods that have one
  if (!['GET', 'HEAD'].includes(req.method)) {
    fetchInit.body = await req.arrayBuffer();
    // Ensure content-type is forwarded
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
  }

  try {
    const response = await fetch(url.toString(), fetchInit);

    const responseHeaders = new Headers(response.headers);
    // Remove headers that cause issues when proxied
    responseHeaders.delete('transfer-encoding');
    responseHeaders.delete('content-encoding');

    // SSE (text/event-stream): repassa o corpo em streaming, sem bufferizar.
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream') && response.body) {
      responseHeaders.set('content-type', 'text/event-stream');
      responseHeaders.set('cache-control', 'no-cache, no-transform');
      responseHeaders.set('connection', 'keep-alive');
      return new NextResponse(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[API Proxy] Failed to reach backend at ${url.toString()}:`, error);
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor. Tente novamente.' },
      { status: 502 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
