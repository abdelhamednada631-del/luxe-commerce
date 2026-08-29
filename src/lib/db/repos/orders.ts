import { getDb } from '@/lib/db/client';

export interface OrderItem {
  productId: number;
  nameEn: string;
  nameAr: string;
  variantSelections: { variantId: string; optionId: string }[];
  variantLabel: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderRow {
  id: number;
  order_number: number;
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  address_details: string;
  notes: string | null;
  items: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: 'pending' | 'delivered' | 'failed';
  telegram_error: string | null;
  attempts: number;
  last_attempt_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export function parseOrderItems(json: string): OrderItem[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface NewOrder {
  customerName: string;
  phone: string;
  governorate: string;
  city: string;
  addressDetails: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
}

/** Insert an order with a sequential order number, inside a transaction. */
export function insertOrder(order: NewOrder): OrderRow {
  const db = getDb();
  const tx = db.transaction((): OrderRow => {
    const nextNumber =
      ((db.prepare('SELECT MAX(order_number) AS m FROM orders').get() as { m: number | null }).m ?? 10000) + 1;

    const info = db
      .prepare(
        `INSERT INTO orders (order_number, customer_name, phone, governorate, city, address_details,
           notes, items, subtotal, shipping_fee, total, status)
         VALUES (@orderNumber, @customerName, @phone, @governorate, @city, @addressDetails,
           @notes, @items, @subtotal, @shippingFee, @total, 'pending')`
      )
      .run({
        orderNumber: nextNumber,
        customerName: order.customerName,
        phone: order.phone,
        governorate: order.governorate,
        city: order.city,
        addressDetails: order.addressDetails,
        notes: order.notes || null,
        items: JSON.stringify(order.items),
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        total: order.total
      });

    return db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(info.lastInsertRowid)) as OrderRow;
  });
  return tx();
}

export function orderByNumber(orderNumber: number): OrderRow | undefined {
  return getDb()
    .prepare('SELECT * FROM orders WHERE order_number = ?')
    .get(orderNumber) as OrderRow | undefined;
}

export function listOrdersForAdmin(limit = 200): OrderRow[] {
  return getDb()
    .prepare('SELECT * FROM orders ORDER BY id DESC LIMIT ?')
    .all(limit) as OrderRow[];
}

export function markOrderDelivered(orderId: number): void {
  getDb()
    .prepare(
      `UPDATE orders SET status = 'delivered', delivered_at = datetime('now'), telegram_error = NULL WHERE id = ?`
    )
    .run(orderId);
}

export function markOrderFailed(orderId: number, error: string): void {
  getDb()
    .prepare(
      `UPDATE orders SET status = 'failed', telegram_error = ?, last_attempt_at = datetime('now'),
         attempts = attempts + 1 WHERE id = ?`
    )
    .run(error.slice(0, 500), orderId);
}

export function incrementAttempt(orderId: number): void {
  getDb()
    .prepare(`UPDATE orders SET attempts = attempts + 1, last_attempt_at = datetime('now') WHERE id = ?`)
    .run(orderId);
}

/** Orders eligible for a retry sweep (pending or failed, not exhausted). */
export function ordersNeedingRetry(): OrderRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM orders WHERE status IN ('pending','failed') AND attempts < 10 ORDER BY id ASC`
    )
    .all() as OrderRow[];
}

/** Decrement stock for ordered items (NULL stock = untracked, untouched). */
export interface OrderStatusCounts {
  pending: number;
  delivered: number;
  failed: number;
  total: number;
}

/** Counts by status for the admin dashboard. */
export function orderStatusCounts(): OrderStatusCounts {
  const rows = getDb()
    .prepare('SELECT status, COUNT(*) AS c FROM orders GROUP BY status')
    .all() as { status: string; c: number }[];
  const counts: OrderStatusCounts = { pending: 0, delivered: 0, failed: 0, total: 0 };
  for (const row of rows) {
    if (row.status === 'pending' || row.status === 'delivered' || row.status === 'failed') {
      counts[row.status] = row.c;
    }
    counts.total += row.c;
  }
  return counts;
}

export function decrementStock(items: OrderItem[]): void {
  const db = getDb();
  const tx = db.transaction(() => {
    const stmt = db.prepare(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL AND stock >= ?'
    );
    for (const item of items) stmt.run(item.quantity, item.productId, item.quantity);
  });
  tx();
}
