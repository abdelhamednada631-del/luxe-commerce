import { revalidatePath } from 'next/cache';

/**
 * Revalidate every storefront layout/page after an admin mutation.
 * (Most storefront pages are force-dynamic; this covers anything the
 * router may have cached so the store reflects changes immediately.)
 */
export function revalidateStorefront(): void {
  revalidatePath('/', 'layout');
}

/** better-sqlite3 UNIQUE constraint violation (e.g. duplicate slug). */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'SQLITE_CONSTRAINT_UNIQUE'
  );
}
