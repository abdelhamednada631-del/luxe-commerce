import { NextRequest } from 'next/server';
import { aboutPageInputSchema } from '@/lib/validation/schemas';
import { adminGuard } from '@/lib/server/auth';
import { getAboutPage, updateAboutPage } from '@/lib/db/repos/content';
import { revalidateStorefront } from '@/lib/server/admin-utils';

export const dynamic = 'force-dynamic';

/** Current about page content. */
export async function GET(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;
  return Response.json({ about: getAboutPage() });
}

/** Replace about page content. */
export async function PUT(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = aboutPageInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
  }

  updateAboutPage(parsed.data);
  revalidateStorefront();
  return Response.json({ ok: true });
}
