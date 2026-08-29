import { NextRequest } from 'next/server';
import { settingsInputSchema } from '@/lib/validation/schemas';
import { adminGuard } from '@/lib/server/auth';
import { getSettings, saveSettings } from '@/lib/db/repos/settings';
import { revalidateStorefront } from '@/lib/server/admin-utils';

export const dynamic = 'force-dynamic';

/** Full settings object (branding, theme, contact, social, locale, shipping, checkout). */
export async function GET(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;
  return Response.json({ settings: getSettings() });
}

/** Replace settings groups (each group is merged over the current value). */
export async function PUT(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
  }

  saveSettings(parsed.data);
  // Branding / accent color / currency affect every storefront page.
  revalidateStorefront();
  return Response.json({ ok: true });
}
