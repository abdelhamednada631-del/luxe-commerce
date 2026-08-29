import { NextRequest } from 'next/server';
import { productInputSchema } from '@/lib/validation/schemas';
import { adminGuard } from '@/lib/server/auth';
import { createProduct, listAllProductsForAdmin } from '@/lib/db/repos/products';
import { revalidateStorefront, isUniqueViolation } from '@/lib/server/admin-utils';

export const dynamic = 'force-dynamic';

/** List every product (admin view — any status). */
export async function GET(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;
  return Response.json({ products: listAllProductsForAdmin() });
}

/** Create a product. */
export async function POST(req: NextRequest) {
  const guard = await adminGuard(req);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
  }

  try {
    const id = createProduct(parsed.data);
    revalidateStorefront();
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return Response.json({ error: 'slug_taken' }, { status: 409 });
    }
    throw err;
  }
}
