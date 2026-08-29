import { NextRequest } from 'next/server';
import { adminGuard } from '@/lib/server/auth';
import { deleteMedia } from '@/lib/server/media';

export const dynamic = 'force-dynamic';

/** Delete an unused media file. Refuses when still referenced. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  const { id } = await params;
  const mediaId = Number(id);
  if (!Number.isInteger(mediaId) || mediaId <= 0) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const result = deleteMedia(mediaId);
  if (result.ok) return Response.json({ ok: true });

  if (result.reason === 'in_use') {
    return Response.json({ error: 'in_use', useCount: result.useCount }, { status: 409 });
  }
  return Response.json({ error: 'not_found' }, { status: 404 });
}
