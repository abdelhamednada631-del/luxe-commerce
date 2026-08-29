import { NextRequest } from 'next/server';
import { homeSectionInputSchema, homeSectionConfigSchemas } from '@/lib/validation/schemas';
import { adminGuard } from '@/lib/server/auth';
import { allHomeSectionsForAdmin, createHomeSection } from '@/lib/db/repos/content';
import { revalidateStorefront } from '@/lib/server/admin-utils';

export const dynamic = 'force-dynamic';

/** List every home section (admin view — any visibility). */
export async function GET(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;
  return Response.json({ sections: allHomeSectionsForAdmin() });
}

/** Create a home section. Config is validated against the per-type schema. */
export async function POST(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;

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

  // Validate the config payload against the schema for this specific section type.
  const configParsed = homeSectionConfigSchemas[parsed.data.type].safeParse(parsed.data.config);
  if (!configParsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of configParsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
  }

  const id = createHomeSection(
    parsed.data.type,
    configParsed.data as Record<string, unknown>,
    parsed.data.isVisible,
    parsed.data.sortOrder
  );
  revalidateStorefront();
  return Response.json({ ok: true, id }, { status: 201 });
}
