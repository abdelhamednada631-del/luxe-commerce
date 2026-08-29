import { NextRequest } from 'next/server';
import { policyInputSchema } from '@/lib/validation/schemas';
import { adminGuard } from '@/lib/server/auth';
import { allPoliciesForAdmin, updatePolicy } from '@/lib/db/repos/content';
import { revalidateStorefront } from '@/lib/server/admin-utils';

export const dynamic = 'force-dynamic';

/** List all policies (admin view — any visibility). */
export async function GET(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;
  return Response.json({ policies: allPoliciesForAdmin() });
}

/** Update one policy by key (shipping / returns / privacy / terms). */
export async function PUT(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = policyInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
  }

  const ok = updatePolicy(parsed.data);
  if (!ok) return Response.json({ error: 'not_found' }, { status: 404 });
  revalidateStorefront();
  return Response.json({ ok: true });
}
