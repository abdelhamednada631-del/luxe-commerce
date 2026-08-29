import { getDb } from '@/lib/db/client';
import type { LookbookInput, PolicyInput, AboutPageInput } from '@/lib/validation/schemas';
import { homeSectionConfigSchemas, HOME_SECTION_TYPES } from '@/lib/validation/schemas';

/** ── Lookbook ──────────────────────────────────────────────────── */
export interface LookbookRow {
  id: number;
  image_media_id: number;
  title_en: string | null;
  title_ar: string | null;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  link_url: string | null;
  is_visible: number;
  sort_order: number;
}

export function visibleLookbook(): LookbookRow[] {
  return getDb()
    .prepare('SELECT * FROM lookbook_items WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC')
    .all() as LookbookRow[];
}

export function allLookbookForAdmin(): LookbookRow[] {
  return getDb()
    .prepare('SELECT * FROM lookbook_items ORDER BY sort_order ASC, id ASC')
    .all() as LookbookRow[];
}

export function createLookbookItem(input: LookbookInput): number {
  const info = getDb()
    .prepare(
      `INSERT INTO lookbook_items (image_media_id, title_en, title_ar, subtitle_en, subtitle_ar,
         link_url, is_visible, sort_order)
       VALUES (@imageMediaId, @titleEn, @titleAr, @subtitleEn, @subtitleAr, @linkUrl, @isVisible, @sortOrder)`
    )
    .run({
      imageMediaId: input.imageMediaId,
      titleEn: input.titleEn,
      titleAr: input.titleAr,
      subtitleEn: input.subtitleEn,
      subtitleAr: input.subtitleAr,
      linkUrl: input.linkUrl,
      isVisible: input.isVisible ? 1 : 0,
      sortOrder: input.sortOrder
    });
  return Number(info.lastInsertRowid);
}

export function updateLookbookItem(id: number, input: LookbookInput): boolean {
  const info = getDb()
    .prepare(
      `UPDATE lookbook_items SET image_media_id = @imageMediaId, title_en = @titleEn, title_ar = @titleAr,
         subtitle_en = @subtitleEn, subtitle_ar = @subtitleAr, link_url = @linkUrl,
         is_visible = @isVisible, sort_order = @sortOrder
       WHERE id = @id`
    )
    .run({
      id,
      imageMediaId: input.imageMediaId,
      titleEn: input.titleEn,
      titleAr: input.titleAr,
      subtitleEn: input.subtitleEn,
      subtitleAr: input.subtitleAr,
      linkUrl: input.linkUrl,
      isVisible: input.isVisible ? 1 : 0,
      sortOrder: input.sortOrder
    });
  return info.changes > 0;
}

export function deleteLookbookItem(id: number): boolean {
  const info = getDb().prepare('DELETE FROM lookbook_items WHERE id = ?').run(id);
  return info.changes > 0;
}

/** ── Home sections ─────────────────────────────────────────────── */
export interface HomeSectionRow {
  id: number;
  type: (typeof HOME_SECTION_TYPES)[number];
  config: string;
  is_visible: number;
  sort_order: number;
}

export function visibleHomeSections(): HomeSectionRow[] {
  return getDb()
    .prepare('SELECT * FROM home_sections WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC')
    .all() as HomeSectionRow[];
}

export function allHomeSectionsForAdmin(): HomeSectionRow[] {
  return getDb()
    .prepare('SELECT * FROM home_sections ORDER BY sort_order ASC, id ASC')
    .all() as HomeSectionRow[];
}

export function createHomeSection(
  type: (typeof HOME_SECTION_TYPES)[number],
  config: Record<string, unknown>,
  isVisible: boolean,
  sortOrder: number
): number {
  const validated = homeSectionConfigSchemas[type].parse(config);
  const info = getDb()
    .prepare('INSERT INTO home_sections (type, config, is_visible, sort_order) VALUES (?, ?, ?, ?)')
    .run(type, JSON.stringify(validated), isVisible ? 1 : 0, sortOrder);
  return Number(info.lastInsertRowid);
}

export function updateHomeSection(
  id: number,
  type: (typeof HOME_SECTION_TYPES)[number],
  config: Record<string, unknown>,
  isVisible: boolean,
  sortOrder: number
): boolean {
  const validated = homeSectionConfigSchemas[type].parse(config);
  const info = getDb()
    .prepare('UPDATE home_sections SET type = ?, config = ?, is_visible = ?, sort_order = ? WHERE id = ?')
    .run(type, JSON.stringify(validated), isVisible ? 1 : 0, sortOrder, id);
  return info.changes > 0;
}

export function deleteHomeSection(id: number): boolean {
  const info = getDb().prepare('DELETE FROM home_sections WHERE id = ?').run(id);
  return info.changes > 0;
}

/** ── Policies ──────────────────────────────────────────────────── */
export interface PolicyRow {
  id: number;
  key: 'shipping' | 'returns' | 'privacy' | 'terms';
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  is_visible: number;
}

const POLICY_KEYS = ['shipping', 'returns', 'privacy', 'terms'] as const;

/** Ensure all four policy rows exist (with neutral default titles). */
export function ensurePolicies(): void {
  const db = getDb();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO policies (key, title_en, title_ar) VALUES (?, ?, ?)'
  );
  insert.run('shipping', 'Shipping Policy', 'سياسة الشحن');
  insert.run('returns', 'Return Policy', 'سياسة الاستبدال والاسترجاع');
  insert.run('privacy', 'Privacy Policy', 'سياسة الخصوصية');
  insert.run('terms', 'Terms & Conditions', 'الشروط والأحكام');
}

export function getPolicy(key: string): PolicyRow | undefined {
  return getDb().prepare('SELECT * FROM policies WHERE key = ?').get(key) as PolicyRow | undefined;
}

export function visiblePolicies(): PolicyRow[] {
  return getDb()
    .prepare('SELECT * FROM policies WHERE is_visible = 1 ORDER BY id ASC')
    .all() as PolicyRow[];
}

export function allPoliciesForAdmin(): PolicyRow[] {
  return getDb().prepare('SELECT * FROM policies ORDER BY id ASC').all() as PolicyRow[];
}

export function updatePolicy(input: PolicyInput): boolean {
  const info = getDb()
    .prepare(
      `UPDATE policies SET title_en = @titleEn, title_ar = @titleAr, body_en = @bodyEn,
         body_ar = @bodyAr, is_visible = @isVisible WHERE key = @key`
    )
    .run({
      key: input.key,
      titleEn: input.titleEn,
      titleAr: input.titleAr,
      bodyEn: input.bodyEn,
      bodyAr: input.bodyAr,
      isVisible: input.isVisible ? 1 : 0
    });
  return info.changes > 0;
}

/** ── About page ────────────────────────────────────────────────── */
export interface AboutPageRow {
  key: 'about';
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  image_ids: string;
}

export function getAboutPage(): AboutPageRow {
  const row = getDb()
    .prepare("SELECT * FROM pages WHERE key = 'about'")
    .get() as AboutPageRow | undefined;
  if (row) return row;
  const empty: AboutPageRow = {
    key: 'about',
    title_en: 'About',
    title_ar: 'من نحن',
    body_en: '',
    body_ar: '',
    image_ids: '[]'
  };
  getDb()
    .prepare("INSERT OR IGNORE INTO pages (key, title_en, title_ar) VALUES ('about', ?, ?)")
    .run(empty.title_en, empty.title_ar);
  return empty;
}

export function updateAboutPage(input: AboutPageInput): void {
  getDb()
    .prepare(
      `INSERT INTO pages (key, title_en, title_ar, body_en, body_ar, image_ids)
       VALUES ('about', @titleEn, @titleAr, @bodyEn, @bodyAr, @imageIds)
       ON CONFLICT(key) DO UPDATE SET title_en = @titleEn, title_ar = @titleAr,
         body_en = @bodyEn, body_ar = @bodyAr, image_ids = @imageIds`
    )
    .run({
      titleEn: input.titleEn,
      titleAr: input.titleAr,
      bodyEn: input.bodyEn,
      bodyAr: input.bodyAr,
      imageIds: JSON.stringify(input.imageIds)
    });
}
