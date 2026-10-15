import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// No self-service signup: tenants and users are provisioned by a seed/CLI
// (docs/architecture/multi-tenancy.md#provisioning).
const AUTH_ROUTES = ['/login'];

function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get('access-token')?.value ?? null;
}

// Next.js 16+: the export name must be "proxy" (previously "middleware").
// This is a UX redirect only. Authorization is enforced by the API.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromRequest(request);
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isAuthRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
