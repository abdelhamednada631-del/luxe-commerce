import { cookies } from 'next/headers';
import { getDb } from '@/lib/db/client';
import { generateToken, sha256, hashPassword, verifyPassword } from '@/lib/server/crypto';
import { timingSafeEqual } from '@/lib/server/crypto';

const SESSION_COOKIE = 'luxe_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h sliding

interface AdminRow {
  password_hash: string;
  password_salt: string;
  must_change_password: number;
}

/**
 * Ensure the admin account exists on first boot.
 * Password source: ADMIN_PASSWORD env → random (printed once to log,
 * forced change on first login).
 */
export function ensureAdminAccount(): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM admin WHERE id = 1').get();
  if (existing) return;

  const envPassword = process.env.ADMIN_PASSWORD;
  let password = envPassword ?? '';
  let mustChange = 0;

  if (!envPassword || envPassword.length < 8) {
    password = generateToken(12); // random, strong
    mustChange = 1;
    console.log('──────────────────────────────────────────────');
    console.log('  LUXE — first boot: generated admin password');
    console.log(`  ${password}`);
    console.log('  (Change it immediately after first login.)');
    console.log('──────────────────────────────────────────────');
  }

  const { hash, salt } = hashPassword(password);
  db.prepare(
    'INSERT INTO admin (id, password_hash, password_salt, must_change_password) VALUES (1, ?, ?, ?)'
  ).run(hash, salt, mustChange);
}

export function verifyAdminPassword(password: string): { valid: boolean; mustChange: boolean } {
  const db = getDb();
  const row = db
    .prepare('SELECT password_hash, password_salt, must_change_password FROM admin WHERE id = 1')
    .get() as AdminRow | undefined;
  if (!row) return { valid: false, mustChange: false };
  return {
    valid: verifyPassword(password, row.password_hash, row.password_salt),
    mustChange: row.must_change_password === 1
  };
}

export function changeAdminPassword(currentPassword: string, newPassword: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT password_hash, password_salt FROM admin WHERE id = 1')
    .get() as AdminRow | undefined;
  if (!row || !verifyPassword(currentPassword, row.password_hash, row.password_salt)) {
    return false;
  }
  const { hash, salt } = hashPassword(newPassword);
  db.prepare(
    `UPDATE admin SET password_hash = ?, password_salt = ?, must_change_password = 0, updated_at = datetime('now') WHERE id = 1`
  ).run(hash, salt);
  return true;
}

/** Create a session: raw token in cookie, sha256 hash in DB. */
export async function createSession(): Promise<void> {
  const db = getDb();
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  db.prepare('INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)').run(sha256(token), expiresAt);
  // Opportunistic cleanup of expired sessions.
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  }
  store.delete(SESSION_COOKIE);
}

/** Validate the current session; slides expiry forward on success. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const db = getDb();
  const row = db
    .prepare('SELECT expires_at FROM sessions WHERE token_hash = ?')
    .get(sha256(token)) as { expires_at: string } | undefined;

  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
    return false;
  }

  // Sliding expiry
  const newExpiry = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').run(newExpiry, sha256(token));
  return true;
}

/**
 * CSRF defense for state-changing requests: verify Origin matches Host.
 * Combined with SameSite=Lax cookies this blocks cross-site mutations.
 */
export function verifyOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // Same-origin fetches may omit Origin (e.g. same-server GET)
  try {
    const originHost = new URL(origin).host;
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    return !!host && originHost === host;
  } catch {
    return false;
  }
}

/** Guard for admin API routes: session + origin. Returns a Response on failure. */
export async function adminGuard(req: Request): Promise<Response | null> {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!verifyOrigin(req)) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  return null;
}

export { timingSafeEqual };
