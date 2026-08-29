import { NextRequest } from 'next/server';
import { lookbookInputSchema } from '@/lib/validation/schemas';
import { adminGuard } from '@/lib/server/auth';
import { allLookbookForAdmin, createLookbookItem } from '@/lib/db/repos/content';
import { revalidateStorefront } from '@/lib/server/admin-utils';

export const dynamic = 'force-dynamic';

/** List every lookbook entry (admin view — any visibility). */
export async function GET(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;
  return Response.json({ items: allLookbookForAdmin() });
}

/** Create a lookbook entry. */
export async function POST(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = lookbookInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
  }

  const id = createLookbookItem(parsed.data);
  revalidateStorefront();
  return Response.json({ ok: true, id }, { status: 201 });
}
