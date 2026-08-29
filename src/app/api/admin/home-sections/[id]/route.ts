import { NextRequest } from 'next/server';
import { homeSectionInputSchema, homeSectionConfigSchemas } from '@/lib/validation/schemas';
import { adminGuard } from '@/lib/server/auth';
import { updateHomeSection, deleteHomeSection } from '@/lib/db/repos/content';
import { revalidateStorefront } from '@/lib/server/admin-utils';

export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ error: 'not_found' }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = homeSectionInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
  }

  const configParsed = homeSectionConfigSchemas[parsed.data.type].safeParse(parsed.data.config);
  if (!configParsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of configParsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
  }

  const ok = updateHomeSection(
    id,
    parsed.data.type,
    configParsed.data as Record<string, unknown>,
    parsed.data.isVisible,
    parsed.data.sortOrder
  );
  if (!ok) return Response.json({ error: 'not_found' }, { status: 404 });
  revalidateStorefront();
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ error: 'not_found' }, { status: 404 });

  const ok = deleteHomeSection(id);
  if (!ok) return Response.json({ error: 'not_found' }, { status: 404 });
  revalidateStorefront();
  return Response.json({ ok: true });
}
