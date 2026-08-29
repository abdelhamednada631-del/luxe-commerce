import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The bare root is handled by src/app/page.tsx, which redirects to the
  // admin-configured default locale. Edge middleware cannot reach the
  // SQLite store, so the decision is made in the Node runtime instead.
  if (pathname === '/') {
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  // Skip API routes, Next internals, the data volume, and any file with an extension.
  matcher: ['/((?!api|_next|_vercel|data|.*\\..*).*)']
};
