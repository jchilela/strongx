import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/verify-phone',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

const DASHBOARD_PATHS = [
  '/dashboard',
  '/sms',
  '/email',
  '/whatsapp',
  '/applications',
  '/wallet',
  '/developer',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('strongx_auth');
  const isAuthenticated = authCookie?.value === '1';

  // Redirect authenticated users away from auth pages
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users from dashboard pages
  const isDashboardPath = DASHBOARD_PATHS.some((path) => pathname.startsWith(path));
  if (!isAuthenticated && isDashboardPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect root to dashboard or login
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
