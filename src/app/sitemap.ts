import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { queryProducts } from '@/lib/db/repos/products';
import { visibleCollections } from '@/lib/db/repos/collections';
import { visiblePolicies } from '@/lib/db/repos/content';
import { getSiteUrl } from '@/lib/server/site-url';

export const dynamic = 'force-dynamic';

/** Bilingual sitemap: static pages + active products + visible collections + policies. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getSiteUrl();
  const now = new Date();

  const staticPaths = ['', '/collections', '/new-arrivals', '/lookbook', '/about'];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages in both locales
  for (const path of staticPaths) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${base}/${locale}${path}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: path === '' ? 1 : 0.7
      });
    }
  }

  // Active products
  const products = queryProducts({ limit: 1000 }).products;
  for (const p of products) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${base}/${locale}/product/${p.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8
      });
    }
  }

  // Visible collections
  for (const c of visibleCollections()) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${base}/${locale}/collections/${c.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6
      });
    }
  }

  // Visible policies
  for (const policy of visiblePolicies()) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${base}/${locale}/policies/${policy.key}`,
        lastModified: now,
        changeFrequency: 'yearly',
        priority: 0.3
      });
    }
  }

  return entries;
}
