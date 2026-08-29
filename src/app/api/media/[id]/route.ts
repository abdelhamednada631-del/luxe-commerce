import { getMedia, mediaFilePath } from '@/lib/server/media';
import fs from 'node:fs';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Stream an uploaded image. Filenames are content-hashed and immutable,
 * so we cache aggressively.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mediaId = Number(id);
  if (!Number.isInteger(mediaId) || mediaId <= 0) {
    return new Response('Not found', { status: 404 });
  }

  const media = getMedia(mediaId);
  if (!media) return new Response('Not found', { status: 404 });

  let stat: fs.Stats;
  try {
    stat = fs.statSync(mediaFilePath(media.filename));
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const stream = fs.createReadStream(mediaFilePath(media.filename));
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': media.mime,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
