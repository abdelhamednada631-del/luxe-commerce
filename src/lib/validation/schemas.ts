import { z } from 'zod';

/** ── Shared primitives ─────────────────────────────────────────── */
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, digits and hyphens');

export const priceSchema = z.number().int().min(0).max(100_000_000);

/** ── Variants ──────────────────────────────────────────────────── */
export const variantOptionSchema = z.object({
  id: z.string().min(1),
  valueEn: z.string().trim().min(1).max(60),
  valueAr: z.string().trim().min(1).max(60)
});

export const variantSchema = z.object({
  id: z.string().min(1),
  labelEn: z.string().trim().min(1).max(40),
  labelAr: z.string().trim().min(1).max(40),
  options: z.array(variantOptionSchema).min(1).max(20)
});

/** ── Products ──────────────────────────────────────────────────── */
export const productInputSchema = z.object({
  slug: slugSchema,
  nameEn: z.string().trim().min(1).max(160),
  nameAr: z.string().trim().min(1).max(160),
  descriptionEn: z.string().trim().max(8000).default(''),
  descriptionAr: z.string().trim().max(8000).default(''),
  price: priceSchema,
  compareAtPrice: priceSchema.nullable().default(null),
  sku: z.string().trim().max(60).nullable().default(null),
  stock: z.number().int().min(0).max(1_000_000).nullable().default(null),
  variants: z.array(variantSchema).max(5).default([]),
  status: z.enum(['active', 'draft']).default('draft'),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  imageIds: z.array(z.number().int().positive()).max(10).default([]),
  sortOrder: z.number().int().min(0).max(100000).default(0),
  collectionIds: z.array(z.number().int().positive()).max(20).default([])
});

/** ── Collections ───────────────────────────────────────────────── */
export const collectionInputSchema = z.object({
  slug: slugSchema,
  nameEn: z.string().trim().min(1).max(120),
  nameAr: z.string().trim().min(1).max(120),
  descriptionEn: z.string().trim().max(4000).default(''),
  descriptionAr: z.string().trim().max(4000).default(''),
  imageMediaId: z.number().int().positive().nullable().default(null),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100000).default(0),
  productIds: z.array(z.number().int().positive()).max(500).default([])
});

/** ── Lookbook ──────────────────────────────────────────────────── */
export const lookbookInputSchema = z.object({
  imageMediaId: z.number().int().positive(),
  titleEn: z.string().trim().max(120).nullable().default(null),
  titleAr: z.string().trim().max(120).nullable().default(null),
  subtitleEn: z.string().trim().max(200).nullable().default(null),
  subtitleAr: z.string().trim().max(200).nullable().default(null),
  linkUrl: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/[a-z]{2}\/|^https?:\/\//i, 'Must be an internal path or absolute URL')
    .nullable()
    .default(null),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100000).default(0)
});

/** ── Home sections (controlled block architecture) ─────────────── */
export const homeSectionConfigSchemas = {
  hero: z.object({
    imageMediaId: z.number().int().positive().nullable().default(null),
    headlineEn: z.string().trim().max(200).default(''),
    headlineAr: z.string().trim().max(200).default(''),
    sublineEn: z.string().trim().max(300).default(''),
    sublineAr: z.string().trim().max(300).default(''),
    ctaLabelEn: z.string().trim().max(60).default(''),
    ctaLabelAr: z.string().trim().max(60).default(''),
    ctaHref: z.string().trim().max(300).default('')
  }),
  featured_products: z.object({
    titleEn: z.string().trim().max(120).default(''),
    titleAr: z.string().trim().max(120).default(''),
    productIds: z.array(z.number().int().positive()).max(12).default([])
  }),
  collection_highlight: z.object({
    collectionId: z.number().int().positive(),
    layout: z.enum(['split', 'grid']).default('split')
  }),
  new_arrivals: z.object({
    titleEn: z.string().trim().max(120).default(''),
    titleAr: z.string().trim().max(120).default(''),
    limit: z.number().int().min(1).max(12).default(8)
  }),
  lookbook_preview: z.object({
    titleEn: z.string().trim().max(120).default(''),
    titleAr: z.string().trim().max(120).default(''),
    limit: z.number().int().min(1).max(8).default(4)
  }),
  brand_story: z.object({
    titleEn: z.string().trim().max(160).default(''),
    titleAr: z.string().trim().max(160).default(''),
    bodyEn: z.string().trim().max(2000).default(''),
    bodyAr: z.string().trim().max(2000).default(''),
    imageMediaId: z.number().int().positive().nullable().default(null)
  }),
  promo_banner: z.object({
    imageMediaId: z.number().int().positive().nullable().default(null),
    headlineEn: z.string().trim().max(160).default(''),
    headlineAr: z.string().trim().max(160).default(''),
    bodyEn: z.string().trim().max(400).default(''),
    bodyAr: z.string().trim().max(400).default(''),
    ctaLabelEn: z.string().trim().max(60).default(''),
    ctaLabelAr: z.string().trim().max(60).default(''),
    ctaHref: z.string().trim().max(300).default('')
  })
} as const;

export const HOME_SECTION_TYPES = Object.keys(homeSectionConfigSchemas) as Array<
  keyof typeof homeSectionConfigSchemas
>;

export const homeSectionInputSchema = z.object({
  type: z.enum(HOME_SECTION_TYPES as [keyof typeof homeSectionConfigSchemas, ...Array<keyof typeof homeSectionConfigSchemas>]),
  config: z.record(z.unknown()),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100000).default(0)
});

/** ── Policies & pages ──────────────────────────────────────────── */
export const policyInputSchema = z.object({
  key: z.enum(['shipping', 'returns', 'privacy', 'terms']),
  titleEn: z.string().trim().min(1).max(160),
  titleAr: z.string().trim().min(1).max(160),
  bodyEn: z.string().trim().max(20000).default(''),
  bodyAr: z.string().trim().max(20000).default(''),
  isVisible: z.boolean().default(true)
});

export const aboutPageInputSchema = z.object({
  titleEn: z.string().trim().min(1).max(160),
  titleAr: z.string().trim().min(1).max(160),
  bodyEn: z.string().trim().max(30000).default(''),
  bodyAr: z.string().trim().max(30000).default(''),
  imageIds: z.array(z.number().int().positive()).max(8).default([])
});

/** ── Settings ──────────────────────────────────────────────────── */
const hexColor = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color like #A98A5B');
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^https?:\/\//i.test(v), 'Must be an http(s) URL or empty')
  .default('');

export const settingsInputSchema = z.object({
  branding: z.object({
    storeNameEn: z.string().trim().min(1).max(80),
    storeNameAr: z.string().trim().min(1).max(80),
    taglineEn: z.string().trim().max(200).default(''),
    taglineAr: z.string().trim().max(200).default(''),
    logoMediaId: z.number().int().positive().nullable().default(null),
    faviconMediaId: z.number().int().positive().nullable().default(null)
  }),
  theme: z.object({ accentColor: hexColor }),
  contact: z.object({
    phone: z.string().trim().max(30).default(''),
    whatsapp: z.string().trim().max(30).default(''),
    email: z.string().trim().max(120).refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Invalid email').default(''),
    addressEn: z.string().trim().max(300).default(''),
    addressAr: z.string().trim().max(300).default('')
  }),
  social: z.object({
    instagram: optionalUrl,
    facebook: optionalUrl,
    tiktok: optionalUrl,
    x: optionalUrl,
    youtube: optionalUrl
  }),
  locale: z.object({
    defaultLocale: z.enum(['en', 'ar']),
    currencyCode: z.string().trim().min(1).max(10),
    currencySymbolEn: z.string().trim().min(1).max(10),
    currencySymbolAr: z.string().trim().min(1).max(10)
  }),
  shipping: z.object({
    flatFee: priceSchema,
    freeOverThreshold: priceSchema.nullable().default(null)
  }),
  checkout: z.object({
    governorates: z
      .array(z.object({ en: z.string().trim().min(1).max(60), ar: z.string().trim().min(1).max(60) }))
      .min(1)
      .max(60)
  })
});

/** ── Telegram ──────────────────────────────────────────────────── */
export const telegramConfigInputSchema = z.object({
  botToken: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{8,12}:[A-Za-z0-9_-]{30,60}$/.test(v), 'Invalid bot token format'),
  chatId: z
    .string()
    .trim()
    .refine((v) => v === '' || /^-?\d{5,15}$/.test(v), 'Chat ID must be numeric (e.g. 123456789 or -1001234567890)')
});

/** ── Orders ────────────────────────────────────────────────────── */
export const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(50),
  variantSelections: z
    .array(z.object({ variantId: z.string().min(1), optionId: z.string().min(1) }))
    .max(5)
    .default([])
});

export const orderInputSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?2)?01[0-25]\d{8}$/, 'Invalid Egyptian phone number (e.g. 01096144345)'),
  governorate: z.string().trim().min(1).max(60),
  city: z.string().trim().min(1).max(80),
  addressDetails: z.string().trim().min(5).max(500),
  notes: z.string().trim().max(500).default(''),
  items: z.array(orderItemSchema).min(1).max(30)
});

/** ── Auth ──────────────────────────────────────────────────────── */
export const loginInputSchema = z.object({
  password: z.string().min(1).max(200)
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z
      .string()
      .min(8, 'Minimum 8 characters')
      .max(200)
      .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), 'Must contain letters and numbers'),
    confirmPassword: z.string()
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export type ProductInput = z.infer<typeof productInputSchema>;
export type CollectionInput = z.infer<typeof collectionInputSchema>;
export type LookbookInput = z.infer<typeof lookbookInputSchema>;
export type HomeSectionInput = z.infer<typeof homeSectionInputSchema>;
export type PolicyInput = z.infer<typeof policyInputSchema>;
export type AboutPageInput = z.infer<typeof aboutPageInputSchema>;
export type SettingsInput = z.infer<typeof settingsInputSchema>;
export type TelegramConfigInput = z.infer<typeof telegramConfigInputSchema>;
export type OrderInput = z.infer<typeof orderInputSchema>;
