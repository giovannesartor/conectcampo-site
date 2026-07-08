import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard/admin/* — only ADMIN role may access
  if (pathname.startsWith('/dashboard/admin')) {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const secret = getJwtSecret();

    // JWT_SECRET must be set in production. Without it we cannot verify tokens
    // and must deny access to protect admin routes.
    if (!secret) {
      console.error('[middleware] JWT_SECRET not configured — blocking admin access. Set JWT_SECRET in the web service environment.');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // ── Verified path: use jose (edge-compatible) ─────────────────────────
    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ['HS256'],
      });

      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Invalid or expired token
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/admin/:path*', '/callback', '/oauth/callback'],
};
