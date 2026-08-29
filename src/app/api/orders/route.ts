import { NextRequest } from 'next/server';
import { orderInputSchema } from '@/lib/validation/schemas';
import { insertOrder, decrementStock, type OrderItem, type OrderRow } from '@/lib/db/repos/orders';
import { productsByIds } from '@/lib/db/repos/products';
import { getSettings } from '@/lib/db/repos/settings';
import { attemptDelivery } from '@/lib/server/order-delivery';
import { rateLimit, clientIp } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Public order submission (cash on delivery via Telegram).
 * Reliability contract:
 *  1. Validate input (zod) + rate limit.
 *  2. Re-validate every item against the DB (price, stock, existence) —
 *     the client cart is never trusted.
 *  3. Persist the order FIRST (status pending) — it can never be lost.
 *  4. Attempt Telegram delivery; the retry scheduler picks up failures.
 *  5. Always return the order number — the customer sees an honest status.
 */
export async function POST(req: NextRequest) {
  // Rate limit: 5 orders per 10 minutes per IP.
  const rl = rateLimit(`order:${clientIp(req)}`, 5, 10 * 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: 'rate_limited', retryAfterSeconds: rl.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = orderInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
  }
  const input = parsed.data;

  // ── Server-side item validation against the DB ──────────────────
  const products = productsByIds(input.items.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));

  const orderItems: OrderItem[] = [];
  let subtotal = 0;

  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product || product.status !== 'active') {
      return Response.json({ error: 'stock_issue' }, { status: 409 });
    }
    if (product.stock !== null && product.stock < item.quantity) {
      return Response.json({ error: 'stock_issue' }, { status: 409 });
    }

    // Rebuild the variant label from stored variant definitions — never trust client text.
    let variantLabel = '';
    if (item.variantSelections.length > 0) {
      try {
        const variants = JSON.parse(product.variants) as {
          id: string;
          labelEn: string;
          options: { id: string; valueEn: string }[];
        }[];
        const parts: string[] = [];
        for (const sel of item.variantSelections) {
          const variant = variants.find((v) => v.id === sel.variantId);
          const option = variant?.options.find((o) => o.id === sel.optionId);
          if (!variant || !option) {
            return Response.json({ error: 'stock_issue' }, { status: 409 });
          }
          parts.push(`${variant.labelEn}: ${option.valueEn}`);
        }
        variantLabel = parts.join(' · ');
      } catch {
        variantLabel = '';
      }
    }

    orderItems.push({
      productId: product.id,
      nameEn: product.name_en,
      nameAr: product.name_ar,
      variantSelections: item.variantSelections,
      variantLabel,
      quantity: item.quantity,
      unitPrice: product.price
    });
    subtotal += product.price * item.quantity;
  }

  // ── Shipping fee from admin settings ────────────────────────────
  const settings = getSettings();
  const { flatFee, freeOverThreshold } = settings.shipping;
  const shippingFee =
    freeOverThreshold !== null && subtotal >= freeOverThreshold ? 0 : flatFee;
  const total = subtotal + shippingFee;

  // ── Persist FIRST — the order can never be lost ─────────────────
  let order: OrderRow;
  try {
    order = insertOrder({
      customerName: input.customerName,
      phone: input.phone,
      governorate: input.governorate,
      city: input.city,
      addressDetails: input.addressDetails,
      notes: input.notes,
      items: orderItems,
      subtotal,
      shippingFee,
      total
    });
  } catch (err) {
    console.error('[order] persist failed:', err instanceof Error ? err.message : err);
    return Response.json({ error: 'persist_failed' }, { status: 500 });
  }

  // Stock decrement happens after a successful persist.
  try {
    decrementStock(orderItems);
  } catch (err) {
    console.error('[order] stock decrement failed:', err instanceof Error ? err.message : err);
  }

  // ── Delivery attempt (retry scheduler covers failures) ──────────
  let deliveryStatus: 'delivered' | 'pending' | 'failed' = 'pending';
  try {
    const result = await attemptDelivery(order);
    deliveryStatus = result.ok ? 'delivered' : 'failed';
  } catch (err) {
    console.error('[order] delivery attempt threw:', err instanceof Error ? err.message : err);
    deliveryStatus = 'failed';
  }

  // The customer always receives their order number + honest status.
  return Response.json(
    { orderNumber: order.order_number, status: deliveryStatus },
    { status: 201 }
  );
}
