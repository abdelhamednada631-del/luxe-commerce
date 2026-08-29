/**
 * Next.js instrumentation — runs once at server boot in every runtime.
 * All Node-only work (SQLite, crypto, scheduler) lives in
 * ./instrumentation-node, which is aliased to an empty module for the
 * Edge compilation (see next.config.ts) and guarded here at runtime.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { bootNode } = await import('./instrumentation-node');
  await bootNode();
}
