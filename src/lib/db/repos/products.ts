import { getDb } from '@/lib/db/client';
import type { ProductInput } from '@/lib/validation/schemas';

export interface ProductRow {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock: number | null;
  variants: string;
  status: 'active' | 'draft';
  is_new: number;
  is_featured: number;
  image_ids: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  labelEn: string;
  labelAr: string;
  options: { id: string; valueEn: string; valueAr: string }[];
}

export function parseVariants(json: string): ProductVariant[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseImageIds(json: string): number[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export function productById(id: number): ProductRow | undefined {
  return getDb().prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined;
}

export function productBySlug(slug: string): ProductRow | undefined {
  return getDb().prepare('SELECT * FROM products WHERE slug = ?').get(slug) as ProductRow | undefined;
}

export interface ProductQuery {
  q?: string;
  collectionSlug?: string;
  onlyNew?: boolean;
  onlyFeatured?: boolean;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'default';
  limit?: number;
  offset?: number;
}

export interface ProductQueryResult {
  products: ProductRow[];
  total: number;
}

/** Public product search/list — active products only, both-locale matching. */
export function queryProducts(query: ProductQuery): ProductQueryResult {
  const db = getDb();
  const where: string[] = ["status = 'active'"];
  const params: Record<string, unknown> = {};

  if (query.q) {
    where.push('(name_en LIKE @q OR name_ar LIKE @q OR description_en LIKE @q OR description_ar LIKE @q OR IFNULL(sku, \'\') LIKE @q)');
    params.q = `%${query.q}%`;
  }
  if (query.collectionSlug) {
    where.push(
      `id IN (SELECT cp.product_id FROM collection_products cp JOIN collections c ON c.id = cp.collection_id WHERE c.slug = @collectionSlug)`
    );
    params.collectionSlug = query.collectionSlug;
  }
  if (query.onlyNew) where.push('is_new = 1');
  if (query.onlyFeatured) where.push('is_featured = 1');

  const orderBy =
    query.sort === 'price-asc'
      ? 'ORDER BY price ASC, sort_order ASC, id DESC'
      : query.sort === 'price-desc'
        ? 'ORDER BY price DESC, sort_order ASC, id DESC'
        : query.sort === 'newest'
          ? 'ORDER BY created_at DESC, id DESC'
          : 'ORDER BY sort_order ASC, id DESC';

  const whereSql = where.join(' AND ');
  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM products WHERE ${whereSql}`).get(params) as { c: number }
  ).c;

  const limit = query.limit ?? 24;
  const offset = query.offset ?? 0;
  const products = db
    .prepare(`SELECT * FROM products WHERE ${whereSql} ${orderBy} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset }) as ProductRow[];

  return { products, total };
}

export function productsByIds(ids: number[]): ProductRow[] {
  if (ids.length === 0) return [];
  const db = getDb();
  const placeholders = ids.map((_, i) => `@id${i}`).join(', ');
  const params: Record<string, number> = {};
  ids.forEach((id, i) => (params[`id${i}`] = id));
  const rows = db
    .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
    .all(params) as ProductRow[];
  // Preserve the requested order.
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((r): r is ProductRow => !!r);
}

export function createProduct(input: ProductInput): number {
  const db = getDb();
  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO products (slug, name_en, name_ar, description_en, description_ar, price,
           compare_at_price, sku, stock, variants, status, is_new, is_featured, image_ids, sort_order)
         VALUES (@slug, @nameEn, @nameAr, @descriptionEn, @descriptionAr, @price,
           @compareAtPrice, @sku, @stock, @variants, @status, @isNew, @isFeatured, @imageIds, @sortOrder)`
      )
      .run({
        slug: input.slug,
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        descriptionEn: input.descriptionEn,
        descriptionAr: input.descriptionAr,
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        sku: input.sku,
        stock: input.stock,
        variants: JSON.stringify(input.variants),
        status: input.status,
        isNew: input.isNew ? 1 : 0,
        isFeatured: input.isFeatured ? 1 : 0,
        imageIds: JSON.stringify(input.imageIds),
        sortOrder: input.sortOrder
      });
    const productId = Number(info.lastInsertRowid);
    setProductCollections(db, productId, input.collectionIds);
    return productId;
  });
  return tx();
}

export function updateProduct(id: number, input: ProductInput): boolean {
  const db = getDb();
  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `UPDATE products SET slug = @slug, name_en = @nameEn, name_ar = @nameAr,
           description_en = @descriptionEn, description_ar = @descriptionAr, price = @price,
           compare_at_price = @compareAtPrice, sku = @sku, stock = @stock, variants = @variants,
           status = @status, is_new = @isNew, is_featured = @isFeatured, image_ids = @imageIds,
           sort_order = @sortOrder, updated_at = datetime('now')
         WHERE id = @id`
      )
      .run({
        id,
        slug: input.slug,
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        descriptionEn: input.descriptionEn,
        descriptionAr: input.descriptionAr,
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        sku: input.sku,
        stock: input.stock,
        variants: JSON.stringify(input.variants),
        status: input.status,
        isNew: input.isNew ? 1 : 0,
        isFeatured: input.isFeatured ? 1 : 0,
        imageIds: JSON.stringify(input.imageIds),
        sortOrder: input.sortOrder
      });
    if (info.changes > 0) setProductCollections(db, id, input.collectionIds);
    return info.changes > 0;
  });
  return tx();
}

export function deleteProduct(id: number): boolean {
  const info = getDb().prepare('DELETE FROM products WHERE id = ?').run(id);
  return info.changes > 0;
}

export function listAllProductsForAdmin(): ProductRow[] {
  return getDb()
    .prepare('SELECT * FROM products ORDER BY sort_order ASC, id DESC')
    .all() as ProductRow[];
}

export function productCollectionIds(productId: number): number[] {
  return (
    getDb()
      .prepare('SELECT collection_id FROM collection_products WHERE product_id = ?')
      .all(productId) as { collection_id: number }[]
  ).map((r) => r.collection_id);
}

function setProductCollections(
  db: import('better-sqlite3').Database,
  productId: number,
  collectionIds: number[]
): void {
  db.prepare('DELETE FROM collection_products WHERE product_id = ?').run(productId);
  const insert = db.prepare(
    'INSERT OR IGNORE INTO collection_products (collection_id, product_id) VALUES (?, ?)'
  );
  for (const cid of collectionIds) insert.run(cid, productId);
}
