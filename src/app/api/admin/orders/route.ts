import { NextRequest } from 'next/server';
import { adminGuard } from '@/lib/server/auth';
import { listOrdersForAdmin } from '@/lib/db/repos/orders';

export const dynamic = 'force-dynamic';

/** List orders (newest first, capped at 200). */
export async function GET(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;
  return Response.json({ orders: listOrdersForAdmin() });
}
