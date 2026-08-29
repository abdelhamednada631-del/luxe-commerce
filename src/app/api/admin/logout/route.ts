import { NextRequest } from 'next/server';
import { destroySession, verifyOrigin } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!verifyOrigin(req)) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  await destroySession();
  return Response.json({ ok: true });
}
