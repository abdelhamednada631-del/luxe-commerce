import { NextRequest } from 'next/server';
import { passwordChangeSchema } from '@/lib/validation/schemas';
import { adminGuard, changeAdminPassword } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/** Change the admin password (also clears the must-change flag). */
export async function POST(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'validation_failed', fieldErrors: { newPassword: parsed.error.issues[0]?.message } },
      { status: 400 }
    );
  }

  const ok = changeAdminPassword(parsed.data.currentPassword, parsed.data.newPassword);
  if (!ok) return Response.json({ error: 'wrong_password' }, { status: 401 });

  return Response.json({ ok: true });
}
