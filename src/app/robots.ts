import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/server/site-url';

export const dynamic = 'force-dynamic';

/** Keep crawlers out of the admin dashboard, cart/checkout and order pages. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/*/admin', '/*/cart', '/*/checkout', '/*/order/', '/*/search']
      }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
