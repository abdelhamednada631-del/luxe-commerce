import { NextRequest } from 'next/server';
import { collectionInputSchema } from '@/lib/validation/schemas';
import { adminGuard } from '@/lib/server/auth';
import { createCollection, allCollectionsForAdmin } from '@/lib/db/repos/collections';
import { revalidateStorefront, isUniqueViolation } from '@/lib/server/admin-utils';

export const dynamic = 'force-dynamic';

/** List every collection (admin view — any visibility). */
export async function GET(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;
  return Response.json({ collections: allCollectionsForAdmin() });
}

/** Create a collection. */
export async function POST(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = collectionInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
  }

  try {
    const id = createCollection(parsed.data);
    revalidateStorefront();
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return Response.json({ error: 'slug_taken' }, { status: 409 });
    }
    throw err;
  }
}
