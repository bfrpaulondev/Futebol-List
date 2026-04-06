import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('futebol-token')?.value;
  const { pathname } = request.nextUrl;

  // Skip auth routes, API routes, static files
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode token to check role/playerType
  const payload = verifyToken(token);
  if (!payload) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isAdmin = payload.role === 'admin' || payload.role === 'master';
  const isMensalista = payload.playerType === 'mensalista';

  // Protect admin routes - only admins
  if (pathname.startsWith('/admin') && !isAdmin) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Protect finances routes - only mensalistas and admins
  if (pathname.startsWith('/finances') && !isMensalista && !isAdmin) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Protect payments routes - only mensalistas and admins
  if (pathname.startsWith('/payments') && !isMensalista && !isAdmin) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
