import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard/admin/* — only ADMIN role may access
  if (pathname.startsWith('/dashboard/admin')) {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    try {
      // Decode JWT payload without verification (edge-compatible, no Buffer needed)
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
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/admin/:path*'],
};
