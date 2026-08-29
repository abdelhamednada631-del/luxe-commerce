import { getDb } from '@/lib/db/client';

/**
 * Settings singleton — structured JSON groups with zod-validated shapes.
 * Defaults define the white-label starting point (no fake business data).
 */
export interface Governorate {
  en: string;
  ar: string;
}

export interface Settings {
  branding: {
    storeNameEn: string;
    storeNameAr: string;
    taglineEn: string;
    taglineAr: string;
    logoMediaId: number | null;
    faviconMediaId: number | null;
  };
  theme: {
    accentColor: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    addressEn: string;
    addressAr: string;
  };
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
    x: string;
    youtube: string;
  };
  locale: {
    defaultLocale: 'en' | 'ar';
    currencyCode: string;
    currencySymbolEn: string;
    currencySymbolAr: string;
  };
  shipping: {
    flatFee: number;
    freeOverThreshold: number | null;
  };
  checkout: {
    governorates: Governorate[];
  };
}

export const DEFAULT_GOVERNORATES: Governorate[] = [
  { en: 'Cairo', ar: 'القاهرة' },
  { en: 'Giza', ar: 'الجيزة' },
  { en: 'Alexandria', ar: 'الإسكندرية' },
  { en: 'Qalyubia', ar: 'القليوبية' },
  { en: 'Port Said', ar: 'بورسعيد' },
  { en: 'Suez', ar: 'السويس' },
  { en: 'Damietta', ar: 'دمياط' },
  { en: 'Dakahlia', ar: 'الدقهلية' },
  { en: 'Sharqia', ar: 'الشرقية' },
  { en: 'Monufia', ar: 'المنوفية' },
  { en: 'Gharbia', ar: 'الغربية' },
  { en: 'Beheira', ar: 'البحيرة' },
  { en: 'Kafr El Sheikh', ar: 'كفر الشيخ' },
  { en: 'Ismailia', ar: 'الإسماعيلية' },
  { en: 'Fayoum', ar: 'الفيوم' },
  { en: 'Beni Suef', ar: 'بني سويف' },
  { en: 'Minya', ar: 'المنيا' },
  { en: 'Asyut', ar: 'أسيوط' },
  { en: 'Sohag', ar: 'سوهاج' },
  { en: 'Qena', ar: 'قنا' },
  { en: 'Luxor', ar: 'الأقصر' },
  { en: 'Aswan', ar: 'أسوان' },
  { en: 'Red Sea', ar: 'البحر الأحمر' },
  { en: 'New Valley', ar: 'الوادي الجديد' },
  { en: 'Matrouh', ar: 'مطروح' },
  { en: 'North Sinai', ar: 'شمال سيناء' },
  { en: 'South Sinai', ar: 'جنوب سيناء' }
];

export function defaultSettings(): Settings {
  return {
    branding: {
      storeNameEn: 'MAISON',
      storeNameAr: 'ميزون',
      taglineEn: 'Timeless pieces, quietly extraordinary',
      taglineAr: 'قطع خالدة، استثنائية بهدوء',
      logoMediaId: null,
      faviconMediaId: null
    },
    theme: { accentColor: '#A98A5B' },
    contact: { phone: '', whatsapp: '', email: '', addressEn: '', addressAr: '' },
    social: { instagram: '', facebook: '', tiktok: '', x: '', youtube: '' },
    locale: {
      defaultLocale: 'en',
      currencyCode: 'EGP',
      currencySymbolEn: 'EGP',
      currencySymbolAr: 'ج.م'
    },
    shipping: { flatFee: 0, freeOverThreshold: null },
    checkout: { governorates: DEFAULT_GOVERNORATES }
  };
}

interface SettingsRow {
  branding: string;
  theme: string;
  contact: string;
  social: string;
  locale: string;
  shipping: string;
  checkout: string;
}

export function getSettings(): Settings {
  const db = getDb();
  const row = db
    .prepare('SELECT branding, theme, contact, social, locale, shipping, checkout FROM settings WHERE id = 1')
    .get() as SettingsRow | undefined;

  const defaults = defaultSettings();
  if (!row) return defaults;

  // Merge each group over defaults so new keys added later never break older DBs.
  return {
    branding: { ...defaults.branding, ...safeParse(row.branding) },
    theme: { ...defaults.theme, ...safeParse(row.theme) },
    contact: { ...defaults.contact, ...safeParse(row.contact) },
    social: { ...defaults.social, ...safeParse(row.social) },
    locale: { ...defaults.locale, ...safeParse(row.locale) },
    shipping: { ...defaults.shipping, ...safeParse(row.shipping) },
    checkout: { ...defaults.checkout, ...safeParse(row.checkout) }
  };
}

export function saveSettings(patch: Partial<Settings>): void {
  const db = getDb();
  const current = getSettings();
  const next: Settings = {
    branding: { ...current.branding, ...patch.branding },
    theme: { ...current.theme, ...patch.theme },
    contact: { ...current.contact, ...patch.contact },
    social: { ...current.social, ...patch.social },
    locale: { ...current.locale, ...patch.locale },
    shipping: { ...current.shipping, ...patch.shipping },
    checkout: { ...current.checkout, ...patch.checkout }
  };

  db.prepare(
    `INSERT INTO settings (id, branding, theme, contact, social, locale, shipping, checkout, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       branding = excluded.branding, theme = excluded.theme, contact = excluded.contact,
       social = excluded.social, locale = excluded.locale, shipping = excluded.shipping,
       checkout = excluded.checkout, updated_at = excluded.updated_at`
  ).run(
    JSON.stringify(next.branding),
    JSON.stringify(next.theme),
    JSON.stringify(next.contact),
    JSON.stringify(next.social),
    JSON.stringify(next.locale),
    JSON.stringify(next.shipping),
    JSON.stringify(next.checkout)
  );
}

function safeParse(json: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
