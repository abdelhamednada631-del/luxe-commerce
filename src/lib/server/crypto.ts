import crypto from 'node:crypto';

/** Constant-time string comparison. */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Compare against self to keep timing constant, then fail.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/** scrypt password hashing — N=16384, 32-byte output, random salt. */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 })
    .toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = crypto
    .scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 })
    .toString('hex');
  return timingSafeEqual(candidate, hash);
}

/** Generate a cryptographically random URL-safe token. */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

/**
 * AES-256-GCM secret encryption at rest.
 * Key source: ENCRYPTION_KEY env (64 hex chars) → auto-generated key file
 * inside the secrets dir (survives restarts on the persistent volume).
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && /^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }
  // Lazy import cycle-safe: paths has no dependency on this module.
  const fs = require('node:fs') as typeof import('node:fs');
  const path = require('node:path') as typeof import('node:path');
  const { SECRETS_DIR, ensureDataDirs } = require('./paths') as typeof import('./paths');
  ensureDataDirs();
  const keyPath = path.join(SECRETS_DIR, 'enc.key');
  if (fs.existsSync(keyPath)) {
    return Buffer.from(fs.readFileSync(keyPath, 'utf8').trim(), 'hex');
  }
  const key = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(keyPath, key, { mode: 0o600 });
  return Buffer.from(key, 'hex');
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${enc.toString('base64')}.${tag.toString('base64')}`;
}

export function decryptSecret(payload: string): string | null {
  try {
    const [ivB64, encB64, tagB64] = payload.split('.');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      Buffer.from(ivB64, 'base64')
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(encB64, 'base64')),
      decipher.final()
    ]);
    return dec.toString('utf8');
  } catch {
    return null; // Wrong key or tampered payload — treat as unavailable.
  }
}
