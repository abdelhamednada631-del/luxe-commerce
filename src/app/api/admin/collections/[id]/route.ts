import { NextRequest } from 'next/server';
import { collectionInputSchema } from '@/lib/validation/schemas';
import { adminGuard } from '@/lib/server/auth';
import { updateCollection, deleteCollection } from '@/lib/db/repos/collections';
import { revalidateStorefront, isUniqueViolation } from '@/lib/server/admin-utils';

export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ error: 'not_found' }, { status: 404 });

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
    const ok = updateCollection(id, parsed.data);
    if (!ok) return Response.json({ error: 'not_found' }, { status: 404 });
    revalidateStorefront();
    return Response.json({ ok: true });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return Response.json({ error: 'slug_taken' }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ error: 'not_found' }, { status: 404 });

  const ok = deleteCollection(id);
  if (!ok) return Response.json({ error: 'not_found' }, { status: 404 });
  revalidateStorefront();
  return Response.json({ ok: true });
}
