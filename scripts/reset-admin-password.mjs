/**
 * One-off: reset the admin (id=1) password directly in SQLite.
 * Uses the exact same scrypt params as src/lib/server/crypto.ts
 * (N=16384, r=8, p=1, 32-byte output, 16-byte hex salt).
 * Prints the new password; forces change on next login.
 */
import Database from 'better-sqlite3';
import crypto from 'node:crypto';

const db = new Database('data/store.db');
const password = crypto.randomBytes(9).toString('base64url'); // 12-char strong token
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto
  .scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 })
  .toString('hex');

const info = db
  .prepare(
    `UPDATE admin SET password_hash = ?, password_salt = ?, must_change_password = 1, updated_at = datetime('now') WHERE id = 1`
  )
  .run(hash, salt);

if (info.changes === 0) {
  console.error('ERROR: admin row id=1 not found');
  process.exit(1);
}
console.log('NEW_ADMIN_PASSWORD=' + password);
db.close();
