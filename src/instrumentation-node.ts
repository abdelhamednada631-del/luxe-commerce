/**
 * Node-runtime boot sequence — only ever imported from instrumentation.ts
 * under the NEXT_RUNTIME === 'nodejs' guard. For the Edge compilation this
 * module is aliased to an empty module in next.config.ts.
 *
 * Order: data dirs → DB migrations (via getDb) → admin account →
 * policy rows → Telegram retry sweep.
 */
export async function bootNode(): Promise<void> {
  const { ensureDataDirs } = await import('@/lib/server/paths');
  ensureDataDirs();

  const { getDb } = await import('@/lib/db/client');
  getDb(); // runs migrations

  const { ensureAdminAccount } = await import('@/lib/server/auth');
  await ensureAdminAccount();

  const { ensurePolicies } = await import('@/lib/db/repos/content');
  ensurePolicies();

  const { startRetryScheduler } = await import('@/lib/server/order-delivery');
  startRetryScheduler();

  console.log('[luxe] boot complete — migrations applied, scheduler active');
}
