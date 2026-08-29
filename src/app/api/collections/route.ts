import { visibleCollections } from '@/lib/db/repos/collections';

export const dynamic = 'force-dynamic';

/** Public collections list. */
export async function GET() {
  return Response.json({ collections: visibleCollections() });
}
