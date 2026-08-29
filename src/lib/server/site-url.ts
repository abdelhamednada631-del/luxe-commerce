import { headers } from 'next/headers';

/**
 * Canonical public site URL resolution order:
 * 1. NEXT_PUBLIC_SITE_URL env var
 * 2. Railway's public domain (RAILWAY_PUBLIC_DOMAIN)
 * 3. Host header of the incoming request
 * 4. http://localhost:3000 fallback
 */
export async function getSiteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railwayDomain) return `https://${railwayDomain}`;

  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    if (host) return `${proto}://${host}`;
  } catch {
    /* not in a request scope */
  }
  return 'http://localhost:3000';
}
