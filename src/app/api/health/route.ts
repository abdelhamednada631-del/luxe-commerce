import { getDb } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

/** Railway healthcheck — verifies the process and DB are alive. */
export async function GET() {
  try {
    getDb().prepare('SELECT 1').get();
    return Response.json({ status: 'ok' });
  } catch {
    return Response.json({ status: 'error' }, { status: 500 });
  }
}
