import { NextRequest } from 'next/server';
import { adminGuard } from '@/lib/server/auth';
import { processUpload, listMedia } from '@/lib/server/media';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';

/** Media gallery list (with reference counts). */
export async function GET(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;
  return Response.json({ media: listMedia() });
}

/**
 * Upload an image: magic-byte validated, resized ≤2000px, WebP q82,
 * content-hash deduplicated. Rate limited: 30 uploads / 5 min.
 */
export async function POST(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  const rl = rateLimit('media-upload', 30, 5 * 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: 'rate_limited', retryAfterSeconds: rl.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: 'invalid_form' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'no_file' }, { status: 400 });
  }

  const result = await processUpload(file);
  if (!result.ok) {
    const status = result.error === 'too_large' ? 413 : 415;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json({ ok: true, media: result.media }, { status: 201 });
}
