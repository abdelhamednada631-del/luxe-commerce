import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '@/lib/db/client';
import { UPLOADS_DIR, ensureDataDirs } from '@/lib/server/paths';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_EDGE = 2000;
const ALLOWED_INPUT = new Set(['jpeg', 'png', 'webp', 'avif']);

export interface MediaRecord {
  id: number;
  filename: string;
  mime: string;
  width: number;
  height: number;
  size_bytes: number;
}

export type UploadResult =
  | { ok: true; media: MediaRecord }
  | { ok: false; error: 'invalid_type' | 'too_large' | 'decode_failed' };

/**
 * Validate + process an upload:
 * magic-byte decode via sharp (extension/header ignored) → resize ≤2000px
 * → WebP q82 → content-hash filename → /data/uploads → media row.
 */
export async function processUpload(file: File): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'too_large' };

  const buffer = Buffer.from(await file.arrayBuffer());

  let image = sharp(buffer, { failOn: 'error' });
  let meta: sharp.Metadata;
  try {
    meta = await image.metadata();
  } catch {
    return { ok: false, error: 'decode_failed' };
  }
  if (!meta.format || !ALLOWED_INPUT.has(meta.format)) {
    return { ok: false, error: 'invalid_type' };
  }

  ensureDataDirs();
  const outBuffer = await image
    .rotate() // respect EXIF orientation
    .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const outMeta = await sharp(outBuffer).metadata();
  const hash = crypto.createHash('sha256').update(outBuffer).digest('hex').slice(0, 32);
  const filename = `${hash}.webp`;

  const db = getDb();
  const existing = db
    .prepare('SELECT id, filename, mime, width, height, size_bytes FROM media WHERE filename = ?')
    .get(filename) as MediaRecord | undefined;
  if (existing) return { ok: true, media: existing }; // content-dedup

  fs.writeFileSync(path.join(UPLOADS_DIR, filename), outBuffer);

  const info = db
    .prepare('INSERT INTO media (filename, mime, width, height, size_bytes) VALUES (?, ?, ?, ?, ?)')
    .run(filename, 'image/webp', outMeta.width ?? 0, outMeta.height ?? 0, outBuffer.length);

  return {
    ok: true,
    media: {
      id: Number(info.lastInsertRowid),
      filename,
      mime: 'image/webp',
      width: outMeta.width ?? 0,
      height: outMeta.height ?? 0,
      size_bytes: outBuffer.length
    }
  };
}

export function getMedia(id: number): MediaRecord | undefined {
  return getDb()
    .prepare('SELECT id, filename, mime, width, height, size_bytes FROM media WHERE id = ?')
    .get(id) as MediaRecord | undefined;
}

export function mediaFilePath(filename: string): string {
  return path.join(UNLOADS_SAFE(), filename);
}

function UNLOADS_SAFE(): string {
  return UPLOADS_DIR;
}

/**
 * Delete a media file if it is not referenced anywhere.
 * Returns false when still in use (with useCount > 0 detail).
 */
export function deleteMedia(
  id: number
): { ok: true } | { ok: false; reason: 'not_found' | 'in_use'; useCount: number } {
  const db = getDb();
  const media = getMedia(id);
  if (!media) return { ok: false, reason: 'not_found', useCount: 0 };

  const useCount = countReferences(db, id);
  if (useCount > 0) return { ok: false, reason: 'in_use', useCount };

  db.prepare('DELETE FROM media WHERE id = ?').run(id);
  try {
    fs.unlinkSync(path.join(UPLOADS_DIR, media.filename));
  } catch {
    // File already gone — DB cleanup is what matters.
  }
  return { ok: true };
}

function countReferences(db: import('better-sqlite3').Database, mediaId: number): number {
  let count = 0;

  const settings = db
    .prepare('SELECT branding FROM settings WHERE id = 1')
    .get() as { branding: string } | undefined;
  if (settings) {
    try {
      const b = JSON.parse(settings.branding);
      if (b.logoMediaId === mediaId || b.faviconMediaId === mediaId) count++;
    } catch {
      /* ignore malformed */
    }
  }

  const productRows = db
    .prepare("SELECT image_ids FROM products WHERE image_ids != '[]'")
    .all() as { image_ids: string }[];
  for (const row of productRows) {
    try {
      if ((JSON.parse(row.image_ids) as number[]).includes(mediaId)) count++;
    } catch {
      /* ignore */
    }
  }

  count += (
    db.prepare('SELECT COUNT(*) AS c FROM collections WHERE image_media_id = ?').get(mediaId) as { c: number }
  ).c;
  count += (
    db.prepare('SELECT COUNT(*) AS c FROM lookbook_items WHERE image_media_id = ?').get(mediaId) as { c: number }
  ).c;

  const sectionRows = db.prepare('SELECT config FROM home_sections').all() as { config: string }[];
  for (const row of sectionRows) {
    try {
      const c = JSON.parse(row.config);
      if (c.imageMediaId === mediaId) count++;
    } catch {
      /* ignore */
    }
  }

  const pageRow = db.prepare("SELECT image_ids FROM pages WHERE key = 'about'").get() as
    | { image_ids: string }
    | undefined;
  if (pageRow) {
    try {
      if ((JSON.parse(pageRow.image_ids) as number[]).includes(mediaId)) count++;
    } catch {
      /* ignore */
    }
  }

  return count;
}

/** List media (admin gallery), newest first. */
export function listMedia(limit = 200): (MediaRecord & { usedCount: number })[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, filename, mime, width, height, size_bytes FROM media ORDER BY id DESC LIMIT ?')
    .all(limit) as MediaRecord[];
  return rows.map((r) => ({ ...r, usedCount: countReferences(db, r.id) }));
}
