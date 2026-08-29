import { NextRequest } from 'next/server';
import { loginInputSchema } from '@/lib/validation/schemas';
import { verifyAdminPassword, createSession, verifyOrigin } from '@/lib/server/auth';
import { rateLimit, clientIp } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';

/** Admin login. Rate limited: 5 attempts / 5 min / IP. */
export async function POST(req: NextRequest) {
  if (!verifyOrigin(req)) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const rl = rateLimit(`login:${clientIp(req)}`, 5, 5 * 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: 'rate_limited', retryAfterSeconds: rl.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = loginInputSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'invalid' }, { status: 400 });

  const { valid, mustChange } = verifyAdminPassword(parsed.data.password);
  if (!valid) return Response.json({ error: 'invalid' }, { status: 401 });

  await createSession();
  return Response.json({ ok: true, mustChange });
}
