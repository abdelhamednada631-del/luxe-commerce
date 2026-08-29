import { NextRequest } from 'next/server';
import { telegramConfigInputSchema } from '@/lib/validation/schemas';
import { adminGuard } from '@/lib/server/auth';
import { getTelegramState, saveTelegramConfig, sendTelegramTest } from '@/lib/server/telegram';
import { rateLimit, clientIp } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';

/** Current telegram config state (token never leaves the server). */
export async function GET(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;
  return Response.json({ state: getTelegramState() });
}

/** Save bot token + chat id. Empty botToken keeps the existing token. */
export async function PUT(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = telegramConfigInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
  }

  // Saving a token with no chat id (or vice versa) would leave a half-configured state.
  const state = getTelegramState();
  const effectiveToken = parsed.data.botToken !== '' ? parsed.data.botToken : null;
  const hasToken = effectiveToken !== null || state.isConfigured;
  if (!hasToken && parsed.data.chatId !== '') {
    return Response.json(
      { error: 'validation_failed', fieldErrors: { botToken: 'Bot token is required' } },
      { status: 400 }
    );
  }

  saveTelegramConfig(parsed.data.botToken, parsed.data.chatId);
  return Response.json({ ok: true, state: getTelegramState() });
}

/** Send a test message through the configured bot. */
export async function POST(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  const limit = rateLimit(`tg-test:${clientIp(req)}`, 5, 5 * 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429 }
    );
  }

  const result = await sendTelegramTest();
  if (!result.ok) return Response.json({ error: 'test_failed', detail: result.error }, { status: 502 });
  return Response.json({ ok: true });
}
