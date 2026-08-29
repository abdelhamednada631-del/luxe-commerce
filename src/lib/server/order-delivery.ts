import { getDb } from '@/lib/db/client';
import { ordersNeedingRetry, parseOrderItems, markOrderDelivered, markOrderFailed, incrementAttempt, type OrderRow } from '@/lib/db/repos/orders';
import { deliverOrderToTelegram, type OrderForTelegram } from '@/lib/server/telegram';
import { getSettings } from '@/lib/db/repos/settings';

/**
 * Telegram delivery retry engine.
 * Backoff schedule: 1m, 5m, 15m, 1h, 6h (then every 6h up to 10 attempts).
 * The order row is ALWAYS persisted before any delivery attempt, so an
 * order can never silently disappear.
 */

const BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 6 * 60 * 60_000];
const MAX_ATTEMPTS = 10;

let timer: ReturnType<typeof setInterval> | null = null;
let sweeping = false;

function backoffFor(attempts: number): number {
  if (attempts <= 0) return 0;
  const idx = Math.min(attempts - 1, BACKOFF_MS.length - 1);
  return BACKOFF_MS[idx];
}

function toTelegramOrder(order: OrderRow, currencySymbol: string): OrderForTelegram {
  const items = parseOrderItems(order.items);
  return {
    orderNumber: order.order_number,
    customerName: order.customer_name,
    phone: order.phone,
    governorate: order.governorate,
    city: order.city,
    addressDetails: order.address_details,
    notes: order.notes ?? '',
    items: items.map((i) => ({
      nameEn: i.nameEn,
      nameAr: i.nameAr,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      unitPrice: i.unitPrice
    })),
    subtotal: order.subtotal,
    shippingFee: order.shipping_fee,
    total: order.total,
    createdAt: order.created_at,
    currencySymbol
  };
}

/** Attempt delivery of one order now. Used by order API, sweep, and admin resend. */
export async function attemptDelivery(order: OrderRow): Promise<{ ok: boolean; error?: string }> {
  const settings = getSettings();
  const result = await deliverOrderToTelegram(
    toTelegramOrder(order, settings.locale.currencySymbolEn)
  );
  if (result.ok) {
    markOrderDelivered(order.id);
  } else {
    markOrderFailed(order.id, result.error ?? 'unknown error');
  }
  return result;
}

/** Sweep pending/failed orders whose backoff has elapsed. */
export async function sweepOrders(): Promise<void> {
  if (sweeping) return;
  sweeping = true;
  try {
    const candidates = ordersNeedingRetry();
    const now = Date.now();
    for (const order of candidates) {
      if (order.attempts === 0) {
        // Never attempted (e.g. crash between insert and first attempt) → try now.
        await attemptDelivery(order);
        continue;
      }
      const lastAttempt = order.last_attempt_at ? new Date(order.last_attempt_at + 'Z').getTime() : 0;
      if (now - lastAttempt >= backoffFor(order.attempts)) {
        await attemptDelivery(order);
      }
    }
  } catch (err) {
    console.error('[telegram-sweep] error:', err instanceof Error ? err.message : err);
  } finally {
    sweeping = false;
  }
}

/** Start the periodic sweep (called once from instrumentation at boot). */
export function startRetryScheduler(): void {
  if (timer) return;
  // Initial sweep shortly after boot (crash recovery).
  setTimeout(() => void sweepOrders(), 5_000);
  timer = setInterval(() => void sweepOrders(), 60_000);
  const maybeUnref = timer as unknown as { unref?: () => void };
  if (typeof maybeUnref.unref === 'function') maybeUnref.unref();
}

/** Manual admin resend — resets attempt counter and delivers immediately. */
export async function adminResend(orderId: number): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  db.prepare('UPDATE orders SET attempts = 0 WHERE id = ?').run(orderId);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow | undefined;
  if (!order) return { ok: false, error: 'Order not found' };
  return attemptDelivery(order);
}
