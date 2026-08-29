import { NextRequest } from 'next/server';
import { queryProducts } from '@/lib/db/repos/products';

export const dynamic = 'force-dynamic';

/** Public product search/list. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q')?.trim().slice(0, 100) || undefined;
  const collection = sp.get('collection')?.trim().slice(0, 120) || undefined;
  const sortParam = sp.get('sort');
  const sort =
    sortParam === 'newest' || sortParam === 'price-asc' || sortParam === 'price-desc'
      ? sortParam
      : 'default';
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 24, 1), 48);
  const offset = Math.max(Number(sp.get('offset')) || 0, 0);

  const { products, total } = queryProducts({
    q,
    collectionSlug: collection,
    sort,
    limit,
    offset
  });

  return Response.json({ products, total });
}
