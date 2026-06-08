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

    // If JWT_SECRET is not configured (e.g. dev without env), fall back to
    // decode-only so the app doesn't hard-break — but log the warning.
    if (!secret) {
      console.warn(
        '[middleware] JWT_SECRET not set — falling back to unverified decode. Set JWT_SECRET in production!',
      );
      try {
        const base64Payload = token.split('.')[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        const payload = JSON.parse(atob(base64Payload));
        if (payload.role !== 'ADMIN') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
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
