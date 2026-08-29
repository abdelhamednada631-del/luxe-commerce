import { getDb } from '@/lib/db/client';
import { decryptSecret, encryptSecret } from '@/lib/server/crypto';

const TELEGRAM_API = 'https://api.telegram.org';

export interface TelegramConfigState {
  isConfigured: boolean;
  maskedTokenHint: string; // e.g. "…AB12"
  chatId: string;
}

interface TelegramRow {
  bot_token_encrypted: string;
  chat_id: string;
}

export function getTelegramState(): TelegramConfigState {
  const row = getDb()
    .prepare('SELECT bot_token_encrypted, chat_id FROM telegram_config WHERE id = 1')
    .get() as TelegramRow | undefined;

  if (!row) return { isConfigured: false, maskedTokenHint: '', chatId: '' };
  const token = decryptSecret(row.bot_token_encrypted);
  return {
    isConfigured: !!token && !!row.chat_id,
    maskedTokenHint: token ? `…${token.slice(-4)}` : '',
    chatId: row.chat_id
  };
}

/** Save config. Empty botToken keeps the existing token (never re-sent by client). */
export function saveTelegramConfig(botToken: string, chatId: string): void {
  const db = getDb();
  const existing = db
    .prepare('SELECT bot_token_encrypted FROM telegram_config WHERE id = 1')
    .get() as { bot_token_encrypted: string } | undefined;

  const tokenToStore = botToken !== '' ? botToken : existing ? decryptSecret(existing.bot_token_encrypted) : null;
  if (!tokenToStore) {
    // Nothing to store — remove config if chat id also empty
    if (!chatId) db.prepare('DELETE FROM telegram_config WHERE id = 1').run();
    return;
  }

  db.prepare(
    `INSERT INTO telegram_config (id, bot_token_encrypted, chat_id, updated_at)
     VALUES (1, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET bot_token_encrypted = excluded.bot_token_encrypted,
       chat_id = excluded.chat_id, updated_at = excluded.updated_at`
  ).run(encryptSecret(tokenToStore), chatId);
}

async function callTelegram(method: string, token: string, payload: unknown, timeoutMs = 10_000): Promise<{ ok: boolean; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.description ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network error';
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

/** Send a test message from the admin dashboard. */
export async function sendTelegramTest(): Promise<{ ok: boolean; error?: string }> {
  const row = getDb()
    .prepare('SELECT bot_token_encrypted, chat_id FROM telegram_config WHERE id = 1')
    .get() as TelegramRow | undefined;
  if (!row) return { ok: false, error: 'Telegram is not configured' };

  const token = decryptSecret(row.bot_token_encrypted);
  if (!token || !row.chat_id) return { ok: false, error: 'Telegram is not configured' };

  return callTelegram('sendMessage', token, {
    chat_id: row.chat_id,
    text: '✅ <b>LUXE</b> — test message. Your store is connected.',
    parse_mode: 'HTML'
  });
}

export interface OrderItemForTelegram {
  nameEn: string;
  nameAr: string;
  variantLabel: string; // e.g. "Size: M · Color: Gold" or ''
  quantity: number;
  unitPrice: number;
}

export interface OrderForTelegram {
  orderNumber: number;
  customerName: string;
  phone: string;
  governorate: string;
  city: string;
  addressDetails: string;
  notes: string;
  items: OrderItemForTelegram[];
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  currencySymbol: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function money(amount: number, symbol: string): string {
  return `${amount.toLocaleString('en-US')} ${symbol}`;
}

/** Build the structured HTML order message. */
export function buildOrderMessage(order: OrderForTelegram): string {
  const lines: string[] = [];
  lines.push(`🛍 <b>ORDER #${order.orderNumber}</b>`);
  lines.push('');
  lines.push('<b>👤 Customer</b>');
  lines.push(`Name: <b>${esc(order.customerName)}</b>`);
  lines.push(`Phone: <code>${esc(order.phone)}</code>`);
  lines.push('');
  lines.push('<b>📦 Shipping</b>');
  lines.push(`Governorate: ${esc(order.governorate)}`);
  lines.push(`City: ${esc(order.city)}`);
  lines.push(`Address: ${esc(order.addressDetails)}`);
  if (order.notes) lines.push(`Notes: <i>${esc(order.notes)}</i>`);
  lines.push('');
  lines.push('<b>🧾 Order</b>');
  for (const item of order.items) {
    lines.push(`• <b>${esc(item.nameEn)}</b>`);
    if (item.variantLabel) lines.push(`  ${esc(item.variantLabel)}`);
    lines.push(`  ×${item.quantity} — ${money(item.unitPrice * item.quantity, order.currencySymbol)}`);
  }
  lines.push('');
  lines.push(`Subtotal: ${money(order.subtotal, order.currencySymbol)}`);
  lines.push(`Shipping: ${order.shippingFee > 0 ? money(order.shippingFee, order.currencySymbol) : 'Free'}`);
  lines.push(`<b>Total: ${money(order.total, order.currencySymbol)}</b>`);
  lines.push('');
  lines.push(`🕐 ${order.createdAt}`);
  return lines.join('\n');
}

/** Deliver an order message. Text-first; images are a best-effort follow-up. */
export async function deliverOrderToTelegram(order: OrderForTelegram): Promise<{ ok: boolean; error?: string }> {
  const row = getDb()
    .prepare('SELECT bot_token_encrypted, chat_id FROM telegram_config WHERE id = 1')
    .get() as TelegramRow | undefined;
  if (!row) return { ok: false, error: 'Telegram is not configured' };

  const token = decryptSecret(row.bot_token_encrypted);
  if (!token || !row.chat_id) return { ok: false, error: 'Telegram is not configured' };

  const textResult = await callTelegram('sendMessage', token, {
    chat_id: row.chat_id,
    text: buildOrderMessage(order),
    parse_mode: 'HTML'
  });
  if (!textResult.ok) return textResult;

  // Best-effort product image follow-up — never affects delivery status.
  try {
    const firstImage = getDb()
      .prepare(
        `SELECT m.filename FROM orders o, json_each(o.items) je
         JOIN products p ON p.id = json_extract(je.value, '$.productId')
         LEFT JOIN json_each(p.image_ids) pie ON pie.[key] = 0
         LEFT JOIN media m ON m.id = pie.value
         WHERE o.order_number = ? AND m.filename IS NOT NULL LIMIT 1`
      )
      .get(order.orderNumber) as { filename: string } | undefined;

    if (firstImage) {
      const fs = await import('node:fs');
      const { UPLOADS_DIR } = await import('@/lib/server/paths');
      const filePath = `${UPLOADS_DIR}/${firstImage.filename}`;
      if (fs.existsSync(filePath)) {
        const form = new FormData();
        form.append('chat_id', row.chat_id);
        form.append('caption', `Order #${order.orderNumber}`);
        const buffer = fs.readFileSync(filePath);
        form.append('photo', new Blob([new Uint8Array(buffer)], { type: 'image/webp' }), 'product.webp');
        await fetch(`${TELEGRAM_API}/bot${token}/sendPhoto`, { method: 'POST', body: form }).catch(() => null);
      }
    }
  } catch {
    /* best-effort only */
  }

  return { ok: true };
}
