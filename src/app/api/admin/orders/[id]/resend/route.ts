import { NextRequest } from 'next/server';
import { adminGuard } from '@/lib/server/auth';
import { adminResend } from '@/lib/server/order-delivery';
import { rateLimit, clientIp } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Manually resend one order to Telegram (resets the attempt counter). */
export async function POST(req: NextRequest, { params }: Ctx) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const limit = rateLimit(`resend:${clientIp(req)}`, 10, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429 }
    );
  }

  const result = await adminResend(id);
  if (!result.ok) {
    if (result.error === 'Order not found') return Response.json({ error: 'not_found' }, { status: 404 });
    return Response.json({ error: 'resend_failed', detail: result.error }, { status: 502 });
  }
  return Response.json({ ok: true });
}
