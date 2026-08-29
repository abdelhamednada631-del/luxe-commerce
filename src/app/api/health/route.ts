import { getDb } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

/** Tables that must exist for the app to function (created by migrations). */
const REQUIRED_TABLES = ['settings', 'products', 'collections', 'orders', 'admin'];

/**
 * Railway healthcheck — verifies the process is alive, the DB is reachable,
 * AND migrations actually ran (real tables exist). A bare `SELECT 1` would
 * report ok even when the schema is missing and every page 500s.
 */
export async function GET() {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();

    const tables = new Set(
      (
        db
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
          .all() as { name: string }[]
      ).map((r) => r.name)
    );

    const missing = REQUIRED_TABLES.filter((t) => !tables.has(t));
    if (missing.length > 0) {
      return Response.json(
        { status: 'error', reason: 'missing_tables', missing },
        { status: 500 }
      );
    }

    return Response.json({ status: 'ok', tables: REQUIRED_TABLES.length });
  } catch (error) {
    return Response.json(
      { status: 'error', reason: error instanceof Error ? error.message : 'unknown' },
      { status: 500 }
    );
  }
}
