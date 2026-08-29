import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH, ensureDataDirs } from '@/lib/server/paths';
import { MIGRATIONS, type Migration } from '@/lib/db/migrations';

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

  const applied = new Set(
    (db.prepare('SELECT name FROM _migrations').all() as { name: string }[]).map((r) => r.name)
  );

  // Embedded migrations are the source of truth — they guarantee a fresh
  // deployment always creates every table, even when the source tree (and
  // its .sql files) is not present in the runtime image.
  const all = [...MIGRATIONS];

  // On-disk .sql files are still honored as extras (forward extensibility),
  // e.g. hand-added migrations in a fork. Embedded names win on conflict.
  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const embeddedNames = new Set(MIGRATIONS.map((m) => m.name));
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql') && !embeddedNames.has(f))
      .sort();
    for (const file of files) {
      all.push({ name: file, sql: fs.readFileSync(path.join(migrationsDir, file), 'utf8') });
    }
  }

  for (const migration of all) {
    if (applied.has(migration.name)) continue;
    const run = db.transaction(() => {
      db.exec(migration.sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name);
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
