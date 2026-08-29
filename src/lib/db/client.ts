import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH, ensureDataDirs } from '@/lib/server/paths';

/**
 * Embedded SQLite layer.
 * - WAL mode for durability + concurrent read performance
 * - busy_timeout for safe multi-request access
 * - Sequential file migrations tracked in _migrations, auto-run at boot
 * - foreign_keys enforced
 */
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  ensureDataDirs();
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');

  migrate(db);
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const applied = new Set(
    (db.prepare('SELECT name FROM _migrations').all() as { name: string }[]).map((r) => r.name)
  );

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const run = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
    });
    run();
  }
}

/** Test helper — close and reset the singleton. */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
