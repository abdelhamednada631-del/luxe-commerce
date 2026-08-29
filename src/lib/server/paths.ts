import path from 'node:path';
import fs from 'node:fs';

/**
 * Resolve the persistent data directory.
 * Priority: DATA_DIR env → /data (Railway volume) if it exists or we're on
 * Railway → ./data (local dev). The directory is created on first access.
 */
function resolveDataDir(): string {
  const env = process.env.DATA_DIR;
  if (env) return env;

  const railway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
  const candidate = path.join(path.sep, 'data');
  if (railway || fs.existsSync(candidate)) return candidate;

  return path.join(process.cwd(), 'data');
}

export const DATA_DIR = resolveDataDir();
export const DB_PATH = path.join(DATA_DIR, 'store.db');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const SECRETS_DIR = path.join(DATA_DIR, '.secrets');

/** Ensure all data subdirectories exist. Called once at boot. */
export function ensureDataDirs(): void {
  for (const dir of [DATA_DIR, UPLOADS_DIR, SECRETS_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
