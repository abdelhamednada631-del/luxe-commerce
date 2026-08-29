import { getDb } from '@/lib/db/client';
import type { CollectionInput } from '@/lib/validation/schemas';

export interface CollectionRow {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  image_media_id: number | null;
  is_visible: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function collectionBySlug(slug: string): CollectionRow | undefined {
  return getDb().prepare('SELECT * FROM collections WHERE slug = ?').get(slug) as CollectionRow | undefined;
}

export function collectionById(id: number): CollectionRow | undefined {
  return getDb().prepare('SELECT * FROM collections WHERE id = ?').get(id) as CollectionRow | undefined;
}

export function visibleCollections(): CollectionRow[] {
  return getDb()
    .prepare('SELECT * FROM collections WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC')
    .all() as CollectionRow[];
}

export function allCollectionsForAdmin(): CollectionRow[] {
  return getDb()
    .prepare('SELECT * FROM collections ORDER BY sort_order ASC, id ASC')
    .all() as CollectionRow[];
}

export function createCollection(input: CollectionInput): number {
  const db = getDb();
  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO collections (slug, name_en, name_ar, description_en, description_ar,
           image_media_id, is_visible, sort_order)
         VALUES (@slug, @nameEn, @nameAr, @descriptionEn, @descriptionAr, @imageMediaId, @isVisible, @sortOrder)`
      )
      .run({
        slug: input.slug,
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        descriptionEn: input.descriptionEn,
        descriptionAr: input.descriptionAr,
        imageMediaId: input.imageMediaId,
        isVisible: input.isVisible ? 1 : 0,
        sortOrder: input.sortOrder
      });
    const collectionId = Number(info.lastInsertRowid);
    setCollectionProducts(db, collectionId, input.productIds);
    return collectionId;
  });
  return tx();
}

export function updateCollection(id: number, input: CollectionInput): boolean {
  const db = getDb();
  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `UPDATE collections SET slug = @slug, name_en = @nameEn, name_ar = @nameAr,
           description_en = @descriptionEn, description_ar = @descriptionAr,
           image_media_id = @imageMediaId, is_visible = @isVisible, sort_order = @sortOrder,
           updated_at = datetime('now')
         WHERE id = @id`
      )
      .run({
        id,
        slug: input.slug,
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        descriptionEn: input.descriptionEn,
        descriptionAr: input.descriptionAr,
        imageMediaId: input.imageMediaId,
        isVisible: input.isVisible ? 1 : 0,
        sortOrder: input.sortOrder
      });
    if (info.changes > 0) setCollectionProducts(db, id, input.productIds);
    return info.changes > 0;
  });
  return tx();
}

export function deleteCollection(id: number): boolean {
  const info = getDb().prepare('DELETE FROM collections WHERE id = ?').run(id);
  return info.changes > 0;
}

export function collectionProductIds(collectionId: number): number[] {
  return (
    getDb()
      .prepare('SELECT product_id FROM collection_products WHERE collection_id = ? ORDER BY product_id')
      .all(collectionId) as { product_id: number }[]
  ).map((r) => r.product_id);
}

/** All collections a product belongs to (any visibility) — used for breadcrumbs/related products. */
export function collectionsForProduct(productId: number): CollectionRow[] {
  return getDb()
    .prepare(
      `SELECT c.* FROM collections c
       JOIN collection_products cp ON cp.collection_id = c.id
       WHERE cp.product_id = ?
       ORDER BY c.sort_order ASC, c.id ASC`
    )
    .all(productId) as CollectionRow[];
}

function setCollectionProducts(
  db: import('better-sqlite3').Database,
  collectionId: number,
  productIds: number[]
): void {
  db.prepare('DELETE FROM collection_products WHERE collection_id = ?').run(collectionId);
  const insert = db.prepare(
    'INSERT OR IGNORE INTO collection_products (collection_id, product_id) VALUES (?, ?)'
  );
  for (const pid of productIds) insert.run(collectionId, pid);
}
