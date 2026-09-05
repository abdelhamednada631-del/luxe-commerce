import Database from 'better-sqlite3';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'store.db');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

console.log('--- Seeding LUXE Luxury Store Catalog ---');

// Ensure database schema tables exist
const schemaSql = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  branding TEXT NOT NULL DEFAULT '{}',
  theme TEXT NOT NULL DEFAULT '{}',
  contact TEXT NOT NULL DEFAULT '{}',
  social TEXT NOT NULL DEFAULT '{}',
  locale TEXT NOT NULL DEFAULT '{}',
  shipping TEXT NOT NULL DEFAULT '{}',
  checkout TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  compare_at_price INTEGER CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  sku TEXT,
  stock INTEGER CHECK (stock IS NULL OR stock >= 0),
  variants TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active','draft')),
  is_new INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  image_ids TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  image_media_id INTEGER,
  is_visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collection_products (
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, product_id)
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  mime TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lookbook_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
  title_en TEXT,
  title_ar TEXT,
  subtitle_en TEXT,
  subtitle_ar TEXT,
  link_url TEXT,
  is_visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS home_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('hero','featured_products','collection_highlight','new_arrivals','lookbook_preview','brand_story','promo_banner')),
  config TEXT NOT NULL DEFAULT '{}',
  is_visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE CHECK (key IN ('shipping','returns','privacy','terms')),
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  body_en TEXT NOT NULL DEFAULT '',
  body_ar TEXT NOT NULL DEFAULT '',
  is_visible INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pages (
  key TEXT PRIMARY KEY CHECK (key = 'about'),
  title_en TEXT NOT NULL DEFAULT '',
  title_ar TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  body_ar TEXT NOT NULL DEFAULT '',
  image_ids TEXT NOT NULL DEFAULT '[]'
);
`;

db.exec(schemaSql);

// Ensure settings row id=1 exists
const existingSettings = db.prepare('SELECT id FROM settings WHERE id = 1').get();
if (!existingSettings) {
  db.prepare('INSERT INTO settings (id) VALUES (1)').run();
}


function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function createLuxuryImage({ category, title, subtitle, motif, bgDark = true }) {
  const width = 1200;
  const height = 1600;

  const safeCategory = escapeXml(category ? category.toUpperCase() : '');
  const safeTitle = escapeXml(title ? title.toUpperCase() : '');
  const safeSubtitle = escapeXml(subtitle ? subtitle.toUpperCase() : '');

  const bgGradient = bgDark
    ? `<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#141311"/>
        <stop offset="50%" stop-color="#090807"/>
        <stop offset="100%" stop-color="#1c1a17"/>
       </linearGradient>`
    : `<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FBF9F5"/>
        <stop offset="50%" stop-color="#F2EDE4"/>
        <stop offset="100%" stop-color="#E8E0D2"/>
       </linearGradient>`;

  const goldGrad = `
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCEFC7"/>
      <stop offset="35%" stop-color="#D4AF37"/>
      <stop offset="70%" stop-color="#9A7632"/>
      <stop offset="100%" stop-color="#E6C673"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="45%">
      <stop offset="0%" stop-color="#D4AF37" stop-opacity="${bgDark ? '0.2' : '0.08'}"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  `;

  let motifSvg = '';
  if (motif === 'watch') {
    motifSvg = `
      <g transform="translate(600, 750)">
        <circle r="290" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.4"/>
        <circle r="270" fill="none" stroke="url(#gold)" stroke-width="4"/>
        <circle r="240" fill="${bgDark ? '#11100E' : '#FFFFFF'}" stroke="url(#gold)" stroke-width="1.5"/>
        <circle r="230" fill="none" stroke="url(#gold)" stroke-width="1" stroke-dasharray="2 10"/>
        <line x1="0" y1="-220" x2="0" y2="-190" stroke="url(#gold)" stroke-width="4"/>
        <line x1="0" y1="220" x2="0" y2="190" stroke="url(#gold)" stroke-width="4"/>
        <line x1="-220" y1="0" x2="-190" y2="0" stroke="url(#gold)" stroke-width="4"/>
        <line x1="220" y1="0" x2="190" y2="0" stroke="url(#gold)" stroke-width="4"/>
        <circle cx="0" cy="100" r="65" fill="none" stroke="url(#gold)" stroke-width="2"/>
        <circle cx="0" cy="100" r="45" fill="none" stroke="url(#gold)" stroke-width="1" stroke-dasharray="4 4"/>
        <polygon points="0,75 10,100 0,125 -10,100" fill="url(#gold)" opacity="0.8"/>
        <polygon points="-4,0 0,-150 4,0" fill="url(#gold)"/>
        <polygon points="-5,0 0,-90 5,0" fill="url(#gold)"/>
        <circle r="12" fill="url(#gold)"/>
        <circle r="4" fill="#0E0D0B"/>
        <text y="-70" font-family="serif" font-size="18" fill="url(#gold)" text-anchor="middle" letter-spacing="6">CHRONOMÈTRE</text>
        <text y="-50" font-family="sans-serif" font-size="10" fill="${bgDark ? '#8E887E' : '#777'}" text-anchor="middle" letter-spacing="4">TOURBILLON</text>
      </g>
    `;
  } else if (motif === 'jewelry') {
    motifSvg = `
      <g transform="translate(600, 750)">
        <circle r="260" fill="none" stroke="url(#gold)" stroke-width="1.5" stroke-dasharray="6 8" opacity="0.5"/>
        <polygon points="0,-160 140,-60 140,100 0,200 -140,100 -140,-60" fill="${bgDark ? '#141311' : '#FFF'}" stroke="url(#gold)" stroke-width="4"/>
        <polygon points="0,-160 80,-40 0,160 -80,-40" fill="none" stroke="url(#gold)" stroke-width="2"/>
        <polygon points="0,-160 140,-60 80,-40" fill="url(#gold)" opacity="0.25"/>
        <polygon points="0,-160 -140,-60 -80,-40" fill="url(#gold)" opacity="0.4"/>
        <polygon points="140,-60 140,100 80,-40" fill="url(#gold)" opacity="0.15"/>
        <polygon points="-140,-60 -140,100 -80,-40" fill="url(#gold)" opacity="0.3"/>
        <polygon points="0,200 140,100 0,160" fill="url(#gold)" opacity="0.35"/>
        <polygon points="0,200 -140,100 0,160" fill="url(#gold)" opacity="0.2"/>
        <circle cx="0" cy="-20" r="18" fill="#FFF" opacity="0.9"/>
        <path d="M 0,-40 Q 0,-20 20,-20 Q 0,-20 0,0 Q 0,-20 -20,-20 Q 0,-20 0,-40" fill="url(#gold)"/>
      </g>
    `;
  } else if (motif === 'leather') {
    motifSvg = `
      <g transform="translate(600, 750)">
        <rect x="-220" y="-100" width="440" height="340" rx="20" fill="${bgDark ? '#121110' : '#FFF'}" stroke="url(#gold)" stroke-width="4"/>
        <path d="M -220,-100 L 220,-100 L 160,80 L -160,80 Z" fill="${bgDark ? '#1A1816' : '#F6F3EE'}" stroke="url(#gold)" stroke-width="3"/>
        <rect x="-35" y="55" width="70" height="50" rx="6" fill="url(#gold)"/>
        <circle cx="0" cy="80" r="6" fill="#0E0D0B"/>
        <path d="M -110,-100 C -110,-240 110,-240 110,-100" fill="none" stroke="url(#gold)" stroke-width="10" stroke-linecap="round"/>
        <rect x="-205" y="-85" width="410" height="310" rx="14" fill="none" stroke="url(#gold)" stroke-width="1.5" stroke-dasharray="4 6" opacity="0.6"/>
      </g>
    `;
  } else if (motif === 'perfume') {
    motifSvg = `
      <g transform="translate(600, 750)">
        <rect x="-60" y="-240" width="120" height="90" rx="8" fill="url(#gold)"/>
        <rect x="-70" y="-150" width="140" height="18" fill="url(#gold)"/>
        <rect x="-180" y="-132" width="360" height="360" rx="16" fill="${bgDark ? '#151310' : '#FFFFFF'}" stroke="url(#gold)" stroke-width="4"/>
        <rect x="-160" y="-112" width="320" height="320" rx="10" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="0.4"/>
        <rect x="-120" y="-40" width="240" height="150" rx="4" fill="${bgDark ? '#0C0B0A' : '#F7F4EE'}" stroke="url(#gold)" stroke-width="2"/>
        <text y="0" font-family="serif" font-size="20" fill="url(#gold)" text-anchor="middle" letter-spacing="6">EXTRAIT</text>
        <text y="30" font-family="serif" font-size="26" fill="url(#gold)" text-anchor="middle" font-weight="bold">ROYAL</text>
        <text y="65" font-family="sans-serif" font-size="11" fill="${bgDark ? '#8E887E' : '#777'}" text-anchor="middle" letter-spacing="4">PARFUM 100 ML</text>
      </g>
    `;
  } else {
    motifSvg = `
      <g transform="translate(600, 750)">
        <path d="M -220,-180 C -80,-260 80,-100 220,-180 C 120,60 220,180 80,240 C -80,180 -180,60 -220,-180 Z" fill="${bgDark ? '#141311' : '#FFF'}" stroke="url(#gold)" stroke-width="4"/>
        <path d="M -160,-120 C -50,-180 50,-60 160,-120" fill="none" stroke="url(#gold)" stroke-width="2" stroke-dasharray="4 6"/>
        <circle cx="0" cy="0" r="80" fill="none" stroke="url(#gold)" stroke-width="2"/>
        <text y="10" font-family="serif" font-size="24" fill="url(#gold)" text-anchor="middle" letter-spacing="8">SOIE</text>
      </g>
    `;
  }

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${bgGradient}
        ${goldGrad}
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
      <circle cx="600" cy="750" r="500" fill="url(#glow)"/>
      
      <rect x="40" y="40" width="1120" height="1520" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="0.6"/>
      <rect x="54" y="54" width="1092" height="1492" fill="none" stroke="url(#gold)" stroke-width="0.75" opacity="0.3"/>

      <path d="M 40,90 L 90,90 L 90,40" fill="none" stroke="url(#gold)" stroke-width="3"/>
      <path d="M 1160,90 L 1110,90 L 1110,40" fill="none" stroke="url(#gold)" stroke-width="3"/>
      <path d="M 40,1510 L 90,1510 L 90,1560" fill="none" stroke="url(#gold)" stroke-width="3"/>
      <path d="M 1160,1510 L 1110,1510 L 1110,1560" fill="none" stroke="url(#gold)" stroke-width="3"/>

      <text x="600" y="160" font-family="serif" font-size="22" fill="url(#gold)" text-anchor="middle" letter-spacing="12">LUXE IMPÉRIAL</text>
      <text x="600" y="195" font-family="sans-serif" font-size="12" fill="${bgDark ? '#8E887E' : '#777'}" text-anchor="middle" letter-spacing="6">${safeCategory}</text>

      ${motifSvg}

      <text x="600" y="1360" font-family="serif" font-size="34" fill="${bgDark ? '#FFFFFF' : '#0E0D0B'}" text-anchor="middle" font-weight="500" letter-spacing="2">${safeTitle}</text>
      <text x="600" y="1410" font-family="sans-serif" font-size="16" fill="url(#gold)" text-anchor="middle" letter-spacing="4">${safeSubtitle}</text>
      <text x="600" y="1460" font-family="sans-serif" font-size="16" fill="${bgDark ? '#666' : '#999'}" text-anchor="middle" letter-spacing="4">PIÈCE UNIQUE • HAUTE CRÉATION</text>
    </svg>
  `;


  const webpBuffer = await sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
  const hash = crypto.createHash('sha256').update(webpBuffer).digest('hex').slice(0, 32);
  const filename = `${hash}.webp`;
  const filePath = path.join(UPLOADS_DIR, filename);

  fs.writeFileSync(filePath, webpBuffer);

  const existing = db.prepare('SELECT id FROM media WHERE filename = ?').get(filename);
  if (existing) return existing.id;

  const res = db.prepare('INSERT INTO media (filename, mime, width, height, size_bytes) VALUES (?, ?, ?, ?, ?)').run(
    filename,
    'image/webp',
    width,
    height,
    webpBuffer.length
  );
  return Number(res.lastInsertRowid);
}

async function runSeed() {
  db.prepare('DELETE FROM collection_products').run();
  db.prepare('DELETE FROM products').run();
  db.prepare('DELETE FROM collections').run();
  db.prepare('DELETE FROM lookbook_items').run();
  db.prepare('DELETE FROM home_sections').run();

  console.log('1. Generating high-resolution media & collections...');

  const watchCoverId = await createLuxuryImage({
    category: 'Haute Horlogerie',
    title: 'THE HOROLOGY VAULT',
    subtitle: 'PRECISION MECHANICS',
    motif: 'watch',
    bgDark: true
  });

  const jewelryCoverId = await createLuxuryImage({
    category: 'High Jewelry',
    title: 'THE SOLITAIRE ATELIER',
    subtitle: 'RARE GEMS & DIAMONDS',
    motif: 'jewelry',
    bgDark: true
  });

  const leatherCoverId = await createLuxuryImage({
    category: 'Leather Goods',
    title: 'MAISON MAROQUINERIE',
    subtitle: 'EXOTIC LEATHERS',
    motif: 'leather',
    bgDark: true
  });

  const perfumeCoverId = await createLuxuryImage({
    category: 'Niche Parfums',
    title: 'ATELIER DE PARFUMERIE',
    subtitle: 'PRIVATE EXTRACTS',
    motif: 'perfume',
    bgDark: true
  });

  const silkCoverId = await createLuxuryImage({
    category: 'Silk & Cashmere',
    title: 'ROYAL DRAPERY',
    subtitle: 'MULBERRY & CASHMERE',
    motif: 'silk',
    bgDark: false
  });

  const collectionsData = [
    {
      slug: 'haute-horlogerie',
      nameEn: 'Haute Horlogerie',
      nameAr: 'الساعات الفاخرة النادرة',
      descEn: 'Masterpieces of horological art, high-complication tourbillons, and chronometers crafted by legendary master watchmakers.',
      descAr: 'تحف فنية في عالم الساعات الفاخرة، توربيونات معقدة وكرونومترات دقيقة صُممت بأيدي كبار صانعي الساعات.',
      imageId: watchCoverId,
      sortOrder: 1
    },
    {
      slug: 'high-jewelry',
      nameEn: 'High Jewelry',
      nameAr: 'المجوهرات الملكية الراقية',
      descEn: 'Rare certified diamonds, radiant Colombian emeralds, and 18K gold compositions created for timeless distinction.',
      descAr: 'ألماس ملكي نقي معتمد، زمرد كولومبي نادر ومصوغات من الذهب عيار 18 قيراط لإطلالة ملكية خالدة.',
      imageId: jewelryCoverId,
      sortOrder: 2
    },
    {
      slug: 'leather-goods',
      nameEn: 'Artisanal Leather',
      nameAr: 'المصنوعات الجلدية النادرة',
      descEn: 'Hand-stitched exotic leathers, full-grain calfskins, and bespoke travel cases with 24K gold hardware.',
      descAr: 'جلود تمساح نادرة محاكة يدوياً، وجلود عجل فاخرة مع إكسسوارات مطلية بالذهب عيار 24 قيراط.',
      imageId: leatherCoverId,
      sortOrder: 3
    },
    {
      slug: 'niche-parfumerie',
      nameEn: 'Niche Parfums',
      nameAr: 'العطور النيش والخلطات الملكية',
      descEn: 'Pure Extrait de Parfum blends, aged rare Cambodian Oud, and Damascus Rose harvested exclusively at dawn.',
      descAr: 'خلاصات عطرية نقية، عود كمبودي معتق وورد دمشقي نادر مقطوف في بواكير الصباح لفوحان يدوم أياماً.',
      imageId: perfumeCoverId,
      sortOrder: 4
    },
    {
      slug: 'silk-cashmere',
      nameEn: 'Silk & Cashmere',
      nameAr: 'الحرير والكشمير الإمبراطوري',
      descEn: 'Pure mulberry silk scarves with hand-rolled edges and Grade-A Himalayan cashmere capes.',
      descAr: 'أوشحة من الحرير التوتي الخالص بحواف مبرومة يدوياً، وشالات كشمير هيمالاي فاخرة من الدرجة الأولى.',
      imageId: silkCoverId,
      sortOrder: 5
    }
  ];

  const collectionIds = {};
  for (const c of collectionsData) {
    const res = db.prepare(`
      INSERT INTO collections (slug, name_en, name_ar, description_en, description_ar, image_media_id, is_visible, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(c.slug, c.nameEn, c.nameAr, c.descEn, c.descAr, c.imageId, c.sortOrder);
    collectionIds[c.slug] = Number(res.lastInsertRowid);
  }

  console.log('2. Generating products & multi-angle image sets...');

  const productsList = [
    {
      slug: 'sovereign-tourbillon-rose-gold',
      collection: 'haute-horlogerie',
      nameEn: 'The Sovereign Tourbillon 18K Rose Gold',
      nameAr: 'ساعة توربيون الذهب الوردي الملكية',
      descEn: 'A pinnacle of haute horlogerie featuring a hand-finished 60-second flying tourbillon, 18K rose gold casing, skeletonized architectural bridges, and 72-hour power reserve. Water resistant to 50 meters, fitted with a hand-stitched black alligator strap and deployment clasp.',
      descAr: 'تحفة ميكانيكية نادرة بتوربيون طائر مدته 60 ثانية، مصوغة بالكامل من الذهب الوردي عيار 18 قيراط، مع واجهة هيكلية تكشف تفاصيل الحركة الدقيقة واحتياطي طاقة يصل إلى 72 ساعة مع حزام من جلد التمساح الأسود الفاخر.',
      price: 185000000,
      compareAtPrice: 210000000,
      sku: 'LX-WAT-001',
      stock: 3,
      isNew: 1,
      isFeatured: 1,
      motif: 'watch',
      variants: [
        {
          id: 'v_strap',
          labelEn: 'Strap Material',
          labelAr: 'نوع السوار',
          options: [
            { id: 'opt_alligator_noir', valueEn: 'Alligator Noir', valueAr: 'جلد تمساح أسود' },
            { id: 'opt_cognac_havane', valueEn: 'Cognac Havane Leather', valueAr: 'جلد كونياك كلاسيكي' },
            { id: 'opt_solid_gold', valueEn: 'Solid 18K Gold Bracelet', valueAr: 'سوار ذهب وردي خالص' }
          ]
        }
      ]
    },
    {
      slug: 'astral-chronometer-obsidian',
      collection: 'haute-horlogerie',
      nameEn: 'Astral Chronometer Obsidian Edition',
      nameAr: 'كرونومتر أسترال أوبسيديان الأسود',
      descEn: 'Crafted in micro-blasted black ceramic with titanium reinforcement. Certified Swiss chronometer movement with moon-phase complication and luminescent gold hands.',
      descAr: 'مصنوعة من السيراميك الأسود المقاوم للخدش مع تدعيم التيتانيوم. حركة كرونومتر سويسرية معتمدة مع تعقيد أطوار القمر وعقارب ذهبية مضيئة في الظلام.',
      price: 142000000,
      compareAtPrice: 160000000,
      sku: 'LX-WAT-002',
      stock: 5,
      isNew: 1,
      isFeatured: 1,
      motif: 'watch',
      variants: [
        {
          id: 'v_dial',
          labelEn: 'Dial Aesthetic',
          labelAr: 'طراز الميناء',
          options: [
            { id: 'opt_onyx', valueEn: 'Deep Onyx Dial', valueAr: 'ميناء عقيق أسود نقي' },
            { id: 'opt_meteor', valueEn: 'Muonionalusta Meteorite Dial', valueAr: 'ميناء نيزكي فضائي طبيعي' }
          ]
        }
      ]
    },
    {
      slug: 'chronos-perpetual-calendar-platinum',
      collection: 'haute-horlogerie',
      nameEn: 'Chronos Perpetual Calendar Platinum 950',
      nameAr: 'ساعة كرونوس التقويم الدائم بلاتينوم 950',
      descEn: 'Ultra-thin automatic movement with grand perpetual calendar indicating day, date, month, leap year, and astronomical moonphase.',
      descAr: 'حركة أوتوماتيكية فائقة النحافة مع تقويم دائم متكامل يوضح اليوم، التاريخ، الشهر، السنوات الكبيسة، وأطوار القمر الفلكية.',
      price: 245000000,
      compareAtPrice: null,
      sku: 'LX-WAT-003',
      stock: 2,
      isNew: 0,
      isFeatured: 1,
      motif: 'watch',
      variants: []
    },
    {
      slug: 'royal-solitaire-diamond-ring-3ct',
      collection: 'high-jewelry',
      nameEn: 'Royal Solitaire Diamond Ring 3.50 Carats',
      nameAr: 'خاتم السوليتير الملكي 3.50 قيراط',
      descEn: 'GIA-certified 3.50ct D-Flawless round brilliant diamond mounted on a six-prong platinum setting with micro-pavé diamonds along the shank.',
      descAr: 'ألماسة استثنائية بوزن 3.50 قيراط بدرجة نقاء مثالية (D-Flawless) معتمدة من معهد GIA العالمي، مثبتة على تاج بلاتيني سداسي مع ترصيع ألماسي دقيق.',
      price: 345000000,
      compareAtPrice: 390000000,
      sku: 'LX-JWL-001',
      stock: 2,
      isNew: 1,
      isFeatured: 1,
      motif: 'jewelry',
      variants: [
        {
          id: 'v_size',
          labelEn: 'Ring Size (EU)',
          labelAr: 'مقاس الخاتم',
          options: [
            { id: 'opt_52', valueEn: '52 (6 US)', valueAr: '52 (6 أمريكي)' },
            { id: 'opt_54', valueEn: '54 (7 US)', valueAr: '54 (7 أمريكي)' },
            { id: 'opt_56', valueEn: '56 (7.5 US)', valueAr: '56 (7.5 أمريكي)' }
          ]
        },
        {
          id: 'v_metal',
          labelEn: 'Metal Choice',
          labelAr: 'المعدن الثمين',
          options: [
            { id: 'opt_plat', valueEn: 'Platinum 950', valueAr: 'بلاتين 950' },
            { id: 'opt_18k_white', valueEn: '18K White Gold', valueAr: 'ذهب أبيض عيار 18' },
            { id: 'opt_18k_yellow', valueEn: '18K Yellow Gold', valueAr: 'ذهب أصفر عيار 18' }
          ]
        }
      ]
    },
    {
      slug: 'emerald-nocturne-pendant-necklace',
      collection: 'high-jewelry',
      nameEn: 'Emerald Nocturne Colombian Pendant',
      nameAr: 'قلادة الزمرد الكولومبي الملكي والماس',
      descEn: 'A magnificent 5.20ct untreated Muzo Colombian emerald surrounded by a double halo of pear-cut diamonds suspended on an 18K white gold chain.',
      descAr: 'حجر زمرد كولومبي طبيعي غير معالج بوزن 5.20 قيراط من مناجم موزو الشهيرة، محاط بهالة مزدوجة من الألماس الكمثري على سلسلة من الذهب الأبيض عيار 18.',
      price: 280000000,
      compareAtPrice: null,
      sku: 'LX-JWL-002',
      stock: 1,
      isNew: 1,
      isFeatured: 1,
      motif: 'jewelry',
      variants: [
        {
          id: 'v_length',
          labelEn: 'Chain Length',
          labelAr: 'طول السلسلة',
          options: [
            { id: 'opt_42cm', valueEn: '42 cm (Choker)', valueAr: '42 سم' },
            { id: 'opt_45cm', valueEn: '45 cm (Princess)', valueAr: '45 سم' },
            { id: 'opt_50cm', valueEn: '50 cm (Matinee)', valueAr: '50 سم' }
          ]
        }
      ]
    },
    {
      slug: 'aura-imperial-diamond-tennis-bracelet',
      collection: 'high-jewelry',
      nameEn: 'Aura Imperial 12.00ct Diamond Tennis Bracelet',
      nameAr: 'سوار التنس الألماسي الإمبراطوري 12 قيراط',
      descEn: 'Seamlessly articulated 18K white gold tennis bracelet featuring 48 perfectly matched round brilliant diamonds totaling 12.00 carats, E-F color, VVS clarity.',
      descAr: 'سوار تنس فاخر من الذهب الأبيض عيار 18 مرصع بـ 48 حبة ألماس متطابقة بوزن إجمالي 12 قيراطاً، بنقاء استثنائي وبريق يخطف الأنظار.',
      price: 195000000,
      compareAtPrice: 220000000,
      sku: 'LX-JWL-003',
      stock: 4,
      isNew: 0,
      isFeatured: 1,
      motif: 'jewelry',
      variants: [
        {
          id: 'v_gold',
          labelEn: 'Gold Finish',
          labelAr: 'لون الذهب',
          options: [
            { id: 'opt_white_gold', valueEn: '18K White Gold', valueAr: 'ذهب أبيض عيار 18' },
            { id: 'opt_yellow_gold', valueEn: '18K Yellow Gold', valueAr: 'ذهب أصفر عيار 18' },
            { id: 'opt_rose_gold', valueEn: '18K Rose Gold', valueAr: 'ذهب وردي عيار 18' }
          ]
        }
      ]
    },
    {
      slug: 'grand-marquise-diamond-drop-earrings',
      collection: 'high-jewelry',
      nameEn: 'Grand Marquise Diamond Drop Earrings',
      nameAr: 'أقراط الماركيز الألماسية المتدلية',
      descEn: 'Draped cascading marquise and brilliant-cut diamonds totaling 7.80ct crafted in solid Platinum 950.',
      descAr: 'أقراط متدلية راقية مرصعة بقطع ألماس الماركيز والبريليانت بوزن 7.80 قيراط مصنوعة من البلاتين الخالص.',
      price: 165000000,
      compareAtPrice: null,
      sku: 'LX-JWL-004',
      stock: 2,
      isNew: 1,
      isFeatured: 0,
      motif: 'jewelry',
      variants: []
    },
    {
      slug: 'windsor-alligator-executive-briefcase',
      collection: 'leather-goods',
      nameEn: 'The Windsor Hand-Stitched Alligator Briefcase',
      nameAr: 'حقيبة ويندسور الجلدية التنفيذية الفاخرة',
      descEn: 'Individually crafted from selected American alligator hide, hand-sewn with beeswax linen thread. Features 24K gold-plated custom locking hardware and suede lining.',
      descAr: 'حقيبة أعمال تنفيذية نادرة مصنوعة من جلد التمساح الطبيعي الفاخر، محاكة يدوياً بغرز السراجة التقليدية مع قفل مطلي بالذهب عيار 24 وبطانة مخملية ناعمة.',
      price: 89000000,
      compareAtPrice: 105000000,
      sku: 'LX-LTH-001',
      stock: 3,
      isNew: 1,
      isFeatured: 1,
      motif: 'leather',
      variants: [
        {
          id: 'v_leather_color',
          labelEn: 'Leather Shade',
          labelAr: 'درجة اللون',
          options: [
            { id: 'opt_noir', valueEn: 'Obsidian Noir', valueAr: 'أسود أوبسيديان ملكي' },
            { id: 'opt_cognac', valueEn: 'Cognac Havane', valueAr: 'بني كونياك دافئ' },
            { id: 'opt_emerald_lth', valueEn: 'Imperial Forest Green', valueAr: 'أخضر زمردي فاخر' }
          ]
        }
      ]
    },
    {
      slug: 'royal-duchess-crocodile-mini-handbag',
      collection: 'leather-goods',
      nameEn: 'Royal Duchess Crocodile Mini Handbag',
      nameAr: 'حقيبة دوقة التمساح الملكية المصغرة',
      descEn: 'Compact structured silhouette in glazed Porosus crocodile leather with signature sculpted gold clasp and detachable chain strap.',
      descAr: 'حقيبة نسائية أيقونية بتصميم هندسي راقٍ من جلد تمساح البوروسوس اللامع مع قفل ذهبي منحوت وسلسلة كتف قابلة للفصل.',
      price: 125000000,
      compareAtPrice: null,
      sku: 'LX-LTH-002',
      stock: 2,
      isNew: 1,
      isFeatured: 1,
      motif: 'leather',
      variants: [
        {
          id: 'v_color',
          labelEn: 'Color Edition',
          labelAr: 'إصدار اللون',
          options: [
            { id: 'opt_bordeaux', valueEn: 'Velvet Bordeaux', valueAr: 'عنابي مخملي' },
            { id: 'opt_cream', valueEn: 'Pearl Alabaster', valueAr: 'لؤلؤي سكري' }
          ]
        }
      ]
    },
    {
      slug: 'saffiano-monogram-travel-weekender',
      collection: 'leather-goods',
      nameEn: 'Saffiano Monogram Travel Weekender 55',
      nameAr: 'حقيبة السفر الأسبوعية سافيانو 55',
      descEn: 'Spacious cabin-size travel bag crafted in durable scratch-resistant Saffiano calfskin with double-zip closure and padded shoulder strap.',
      descAr: 'حقيبة سفر راقية بحجم كابينة الطائرة مصنوعة من جلد السافيانو المقاوم للخدوش مع سحاب مزدوج وحزام كتف مبطن للراحة القصوى.',
      price: 68000000,
      compareAtPrice: 79000000,
      sku: 'LX-LTH-003',
      stock: 6,
      isNew: 0,
      isFeatured: 0,
      motif: 'leather',
      variants: []
    },
    {
      slug: 'oud-imperial-extrait-de-parfum',
      collection: 'niche-parfumerie',
      nameEn: 'Oud Impérial Extrait de Parfum 100ml',
      nameAr: 'عطر عود إمبريال إكستري دو بارفان 100 مل',
      descEn: 'A masterwork of oriental perfumery combining 25-year aged Wild Assamese Oud, Taif Rose, Smoked Ambergris, and Bourbon Vanilla. Presented in a hand-cut crystal bottle with heavy gold-plated cap.',
      descAr: 'تحفة عطرية شرقية تجمع بين دهن العود الأسامي المعتق 25 عاماً، الورد الطائفي الملكي، العنبر الدخاني وفانيليا البوربون، في زجاجة كريستالية مع غطاء مذهب ثقيل.',
      price: 42000000,
      compareAtPrice: 49000000,
      sku: 'LX-PRF-001',
      stock: 12,
      isNew: 1,
      isFeatured: 1,
      motif: 'perfume',
      variants: [
        {
          id: 'v_size',
          labelEn: 'Flacon Edition',
          labelAr: 'حجم الزجاجة',
          options: [
            { id: 'opt_100ml', valueEn: '100 ml Extrait Flacon', valueAr: 'زجاجة 100 مل مركزة' },
            { id: 'opt_travel_set', valueEn: '100 ml + 2x10 ml Travel Set', valueAr: 'مجموعة 100 مل + عبوتي سفر' }
          ]
        }
      ]
    },
    {
      slug: 'rose-de-damas-prive',
      collection: 'niche-parfumerie',
      nameEn: 'Rose de Damas Privé Extrait 100ml',
      nameAr: 'عطر ورد دمشق النادر الخاص 100 مل',
      descEn: 'Capturing the sublime scent of rare hand-picked Damascena roses fused with saffron, Italian bergamot, and white musk.',
      descAr: 'عبير باذخ يجسد شذى الورد الدمشقي النادر مع خيوط الزعفران الإيراني، البرغموت الإيطالي والمسك الأبيض الصافي.',
      price: 38000000,
      compareAtPrice: null,
      sku: 'LX-PRF-002',
      stock: 8,
      isNew: 1,
      isFeatured: 1,
      motif: 'perfume',
      variants: []
    },
    {
      slug: 'ambre-royal-nocturne',
      collection: 'niche-parfumerie',
      nameEn: 'Ambre Royal Nocturne 100ml',
      nameAr: 'عطر العنبر الملكي الليلي 100 مل',
      descEn: 'Warm resins, golden amber, frankincense, and dark cedarwood evoke royal nocturnal palace salons.',
      descAr: 'راتنجات دافئة، عنبر شجري مذهب، لبان حوجري وأخشاب الأرز الداكنة لإحساس مهيب في المناسبات الكبرى.',
      price: 36000000,
      compareAtPrice: 41000000,
      sku: 'LX-PRF-003',
      stock: 15,
      isNew: 0,
      isFeatured: 0,
      motif: 'perfume',
      variants: []
    },
    {
      slug: 'imperial-mulberry-silk-scarf',
      collection: 'silk-cashmere',
      nameEn: 'Imperial Arabesque Mulberry Silk Scarf 90x90',
      nameAr: 'وشاح الحرير التوتي الإمبراطوري 90×90',
      descEn: '100% 18-Momme organic Mulberry silk scarf featuring intricate gold foil stamped arabesque motifs and hand-rolled, hand-stitched borders.',
      descAr: 'وشاح من الحرير التوتي العضوي الخالص بوزن 18 مومي، مزين بزخارف أرابيسك مذهبة بحواف مبرومة ومحاكة يدوياً بدقة متناهية.',
      price: 28000000,
      compareAtPrice: 32000000,
      sku: 'LX-SLK-001',
      stock: 10,
      isNew: 1,
      isFeatured: 1,
      motif: 'silk',
      variants: [
        {
          id: 'v_pattern',
          labelEn: 'Artistic Pattern',
          labelAr: 'النقش الفني',
          options: [
            { id: 'opt_gold_arabesque', valueEn: 'Golden Arabesque', valueAr: 'أرابيسك ذهبي ملكي' },
            { id: 'opt_midnight_sky', valueEn: 'Midnight Constellation', valueAr: 'أبراج السماء الليلية' }
          ]
        }
      ]
    },
    {
      slug: 'himalayan-cashmere-cape-mink',
      collection: 'silk-cashmere',
      nameEn: 'Himalayan Grade-A Cashmere Cape',
      nameAr: 'كاب الكشمير الهيمالاي الملكي',
      descEn: 'Woven from purest two-ply Grade-A Mongolian cashmere fibers, offering weightless warmth and majestic drape.',
      descAr: 'منسوج من أنقى ألياف الكشمير المغولي ثنائي الطبقات من الفئة الأولى، يمنح دفئاً خفيف الوزن وانسدالاً ساحراً.',
      price: 95000000,
      compareAtPrice: 115000000,
      sku: 'LX-SLK-002',
      stock: 4,
      isNew: 1,
      isFeatured: 1,
      motif: 'silk',
      variants: [
        {
          id: 'v_shade',
          labelEn: 'Color Tone',
          labelAr: 'اللون',
          options: [
            { id: 'opt_camel', valueEn: 'Royal Camel Gold', valueAr: 'بيج كَمَل ملكي' },
            { id: 'opt_noir_cape', valueEn: 'Velvet Noir', valueAr: 'أسود مخملي' }
          ]
        }
      ]
    }
  ];

  const productIds = [];
  const featuredProductIds = [];
  let sortOrder = 1;

  for (const p of productsList) {
    const img1 = await createLuxuryImage({
      category: p.collection.replace('-', ' '),
      title: p.nameEn.split(' ')[0] + ' ' + (p.nameEn.split(' ')[1] || ''),
      subtitle: 'ATELIER LUXE',
      motif: p.motif,
      bgDark: true
    });

    const img2 = await createLuxuryImage({
      category: p.collection.replace('-', ' '),
      title: 'DETAIL & GRAIN',
      subtitle: 'HANDCRAFTED HERITAGE',
      motif: p.motif,
      bgDark: false
    });

    const imgIdsJson = JSON.stringify([img1, img2]);
    const variantsJson = JSON.stringify(p.variants);

    const res = db.prepare(`
      INSERT INTO products (
        slug, name_en, name_ar, description_en, description_ar, price, compare_at_price,
        sku, stock, variants, status, is_new, is_featured, image_ids, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
    `).run(
      p.slug,
      p.nameEn,
      p.nameAr,
      p.descEn,
      p.descAr,
      p.price,
      p.compareAtPrice,
      p.sku,
      p.stock,
      variantsJson,
      p.isNew,
      p.isFeatured,
      imgIdsJson,
      sortOrder++
    );

    const pid = Number(res.lastInsertRowid);
    productIds.push(pid);
    if (p.isFeatured) featuredProductIds.push(pid);

    const cid = collectionIds[p.collection];
    if (cid) {
      db.prepare('INSERT INTO collection_products (collection_id, product_id) VALUES (?, ?)').run(cid, pid);
    }
  }

  console.log(`Successfully seeded ${productsList.length} luxury products across ${collectionsData.length} collections.`);

  console.log('3. Generating Lookbook Items...');
  const lookbook1 = await createLuxuryImage({
    category: 'Haute Horlogerie',
    title: 'NOCTURNE HOROLOGY',
    subtitle: 'THE MIDNIGHT TOURBILLON',
    motif: 'watch',
    bgDark: true
  });
  const lookbook2 = await createLuxuryImage({
    category: 'High Jewelry',
    title: 'SOLITAIRE SYMPHONY',
    subtitle: 'THE IMPERIAL RADIANCE',
    motif: 'jewelry',
    bgDark: true
  });
  const lookbook3 = await createLuxuryImage({
    category: 'Maison Maroquinerie',
    title: 'LEATHER COUTURE',
    subtitle: 'HAND-STITCHED ALLIGATOR',
    motif: 'leather',
    bgDark: true
  });
  const lookbook4 = await createLuxuryImage({
    category: 'Niche Parfumerie',
    title: 'OUD AL-MULOUK',
    subtitle: 'ANCIENT ASSAMESE ESSENCE',
    motif: 'perfume',
    bgDark: true
  });

  const lookbookData = [
    {
      imgId: lookbook1,
      titleEn: 'The Nocturne Tourbillon',
      titleAr: 'ساعة التوربيون الليلية',
      subEn: 'Architectural precision in 18K Rose Gold',
      subAr: 'دقة معمارية في قالب من الذهب الوردي',
      link: '/collections/haute-horlogerie',
      order: 1
    },
    {
      imgId: lookbook2,
      titleEn: 'Solitaire Symphony',
      titleAr: 'سيمفونية السوليتير الألماسي',
      subEn: 'Rare D-Flawless Diamonds in Platinum',
      subAr: 'ألماس نقي في ترصيع بلاتيني باذخ',
      link: '/collections/high-jewelry',
      order: 2
    },
    {
      imgId: lookbook3,
      titleEn: 'Maison Alligator Couture',
      titleAr: 'دار الجلود والتمساح الفاخر',
      subEn: 'Bespoke Executive Cases with 24K Hardware',
      subAr: 'حقائب تنفيذية نادرة بحلية الذهب الخالص',
      link: '/collections/leather-goods',
      order: 3
    },
    {
      imgId: lookbook4,
      titleEn: 'Oud Impérial Millésime',
      titleAr: 'إكسير العود الإمبراطوري',
      subEn: '25-Year Aged Rare Extract',
      subAr: 'خلاصة عطرية معتقة برائحة الملوك',
      link: '/collections/niche-parfumerie',
      order: 4
    }
  ];

  for (const lb of lookbookData) {
    db.prepare(`
      INSERT INTO lookbook_items (image_media_id, title_en, title_ar, subtitle_en, subtitle_ar, link_url, is_visible, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(lb.imgId, lb.titleEn, lb.titleAr, lb.subEn, lb.subAr, lb.link, lb.order);
  }

  console.log('4. Generating Home Page Layout & Sections...');
  const heroImageId = await createLuxuryImage({
    category: 'Haute Couture & Heritage',
    title: 'ROYALTY & TIMELESS ELEGANCE',
    subtitle: 'ESTABLISHED 2026',
    motif: 'watch',
    bgDark: true
  });

  const promoImageId = await createLuxuryImage({
    category: 'VIP Concierge',
    title: 'PRIVATE ATELIER APPOINTMENT',
    subtitle: 'BESPOKE SERVICES',
    motif: 'jewelry',
    bgDark: true
  });

  const brandImageId = await createLuxuryImage({
    category: 'The Atelier',
    title: 'MASTERS OF DISTINCTION',
    subtitle: 'CRAFTED BY HAND',
    motif: 'leather',
    bgDark: true
  });

  const homeSections = [
    {
      type: 'hero',
      config: JSON.stringify({
        imageMediaId: heroImageId,
        headlineEn: 'ROYALTY & TIMELESS ELEGANCE',
        headlineAr: 'فخامة ملكية وإتقان خالد لا يضاهى',
        sublineEn: 'HAUTE CREATIONS • BESPOKE EXCELLENCE',
        sublineAr: 'إبداع استثنائي • مقتنيات ملكية نادرة',
        ctaLabelEn: 'Discover The Collections',
        ctaLabelAr: 'استكشف المجموعات الملكية',
        ctaHref: '/collections'
      }),
      sortOrder: 1
    },
    {
      type: 'featured_products',
      config: JSON.stringify({
        titleEn: 'The Imperial Highlights',
        titleAr: 'المختارات الإمبراطورية الفاخرة',
        productIds: featuredProductIds.slice(0, 4)
      }),
      sortOrder: 2
    },
    {
      type: 'collection_highlight',
      config: JSON.stringify({
        collectionId: collectionIds['high-jewelry'],
        layout: 'split'
      }),
      sortOrder: 3
    },
    {
      type: 'new_arrivals',
      config: JSON.stringify({
        titleEn: 'Latest Haute Additions',
        titleAr: 'أحدث الإبداعات والمقتنيات',
        limit: 4
      }),
      sortOrder: 4
    },
    {
      type: 'brand_story',
      config: JSON.stringify({
        imageMediaId: brandImageId,
        titleEn: 'The Legacy of Haute Craftsmanship',
        titleAr: 'إرث الحرفية اليدوية والتميز الملكي',
        bodyEn: 'Born from a devotion to absolute perfection, LUXE brings together the world’s most revered master artisans. From the delicate assembly of flying tourbillons to the exacting selection of rare Muzo emeralds, every creation is a timeless testament to human mastery.\n\nEach piece is numbered, documented, and presented with an immutable Certificate of Provenance.',
        bodyAr: 'انطلاقاً من الشغف بالكمال المطلق، تجمع دار لوكس أمهر الحرفيين وصناع الساعات والمجوهرات في العالم. من التجميع الدقيق للتوربيونات الطائرة إلى الانتقاء الصارم للزمرد الكولومبي النادر، كل تحفة هي شاهد خالد على الإتقان البشري الاستثنائي.\n\nكل قطعة مرقمة وموثقة برقم تسلسلي خاص وتأتي مع شهادة أصالة معتمدة.'
      }),
      sortOrder: 5
    },
    {
      type: 'lookbook_preview',
      config: JSON.stringify({
        titleEn: 'The Winter Nocturne Lookbook',
        titleAr: 'لوك بوك الشتاء الليلي الفاخر',
        limit: 4
      }),
      sortOrder: 6
    },
    {
      type: 'promo_banner',
      config: JSON.stringify({
        imageMediaId: promoImageId,
        headlineEn: 'Bespoke VIP Concierge & Private Preview',
        headlineAr: 'خدمة الكونسيرج الملكية والمواعيد الخاصة',
        bodyEn: 'Experience our private viewing salons or request our White-Glove Concierge directly to your suite. Custom engraving, bespoke sizing, and dedicated luxury advisors available 24/7.',
        bodyAr: 'استمتع بجلسات عرض خاصة في صالوناتنا أو اطلب خدمة التوصيل الفندقية المباشرة. حفر مخصص للأسماء، مقاسات حسب الطلب ومستشارو فخامة متاحون على مدار الساعة.',
        ctaLabelEn: 'Inquire with Private Concierge',
        ctaLabelAr: 'تواصل مع الكونسيرج الخاص',
        ctaHref: '/about'
      }),
      sortOrder: 7
    }
  ];

  for (const s of homeSections) {
    db.prepare(`
      INSERT INTO home_sections (type, config, is_visible, sort_order)
      VALUES (?, ?, 1, ?)
    `).run(s.type, s.config, s.sortOrder);
  }

  console.log('5. Updating Store Settings & Policies...');
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (settings) {
    const branding = {
      storeNameEn: 'LUXE IMPERIAL',
      storeNameAr: 'دار لوكس الإمبراطورية',
      logoMediaId: null,
      faviconMediaId: null
    };
    const theme = {
      accentColor: '#C5A059'
    };
    const contact = {
      phone: '+20 109 614 4345',
      whatsapp: '+201096144345',
      email: 'concierge@luxe-imperial.com',
      addressEn: 'Nile Palace Avenue, Zamalek, Cairo, Egypt',
      addressAr: 'شارع قصر النيل، الزمالك، القاهرة، جمهورية مصر العربية'
    };
    const social = {
      instagram: 'https://instagram.com/luxe.imperial',
      facebook: 'https://facebook.com/luxe.imperial',
      tiktok: '',
      x: 'https://x.com/luxe_imperial',
      youtube: ''
    };
    const locale = {
      defaultLocale: 'ar',
      currencySymbolEn: 'EGP',
      currencySymbolAr: 'ج.م'
    };
    const shipping = {
      flatFee: 0,
      freeOverThreshold: 50000000
    };

    db.prepare(`
      UPDATE settings SET
        branding = ?,
        theme = ?,
        contact = ?,
        social = ?,
        locale = ?,
        shipping = ?,
        updated_at = datetime('now')
      WHERE id = 1
    `).run(
      JSON.stringify(branding),
      JSON.stringify(theme),
      JSON.stringify(contact),
      JSON.stringify(social),
      JSON.stringify(locale),
      JSON.stringify(shipping)
    );
  }

  const policiesData = [
    {
      key: 'shipping',
      titleEn: 'Complimentary White-Glove Shipping',
      titleAr: 'الشحن الفندقي المجاني والمؤمن',
      bodyEn: 'Every order from LUXE is delivered via dedicated armored courier with comprehensive transit insurance. Orders are hand-delivered in bespoke royal presentation packaging within 24 to 48 hours.',
      bodyAr: 'يتم شحن جميع طلبات دار لوكس عبر ناقل مؤمن وخاص مع تغطية تأمينية شاملة. تسلم الطلبات يدوياً في صناديق مخملية فاخرة خلال 24 إلى 48 ساعة.'
    },
    {
      key: 'returns',
      titleEn: '14-Day Complimentary Luxury Exchange',
      titleAr: 'سياسة الاستبدال والإرجاع الملكية',
      bodyEn: 'We offer a 14-day return and exchange policy for all unworn pieces in their original presentation box with security seal intact. Our concierge will arrange collection from your residence.',
      bodyAr: 'نقدم فترة 14 يوماً للاستبدال أو الإرجاع لجميع المقتنيات غير المستخدمة في علبتها الأصلية مع سلامة الختم الأمني. سيتولى فريق الكونسيرج استلام الشحنة من منزلك.'
    },
    {
      key: 'privacy',
      titleEn: 'Confidentiality & Privacy Guarantee',
      titleAr: 'السرية والخصوصية التامة',
      bodyEn: 'We uphold the highest standard of discreet luxury. Your personal details, payment records, and custom requests are strictly confidential and protected with enterprise encryption.',
      bodyAr: 'نلتزم بأعلى معايير السرية والخصوصية لعملائنا الكرام. جميع بياناتكم وسجلات الشراء مشفرة ومحمية بأحدث تقنيات الأمان ولا تتم مشاركتها إطلاقاً.'
    },
    {
      key: 'terms',
      titleEn: 'Terms of Haute Acquisition',
      titleAr: 'الشروط والأحكام والأصالة',
      bodyEn: 'All products sold on LUXE are guaranteed 100% authentic and accompanied by an official Certificate of Provenance with lifetime warranty against manufacturing defects.',
      bodyAr: 'جميع المقتنيات المعروضة في دار لوكس أصلية 100% ومضمونة مدى الحياة ضد عيوب الصناعة مع شهادة المنشأ الرسمية المعتمدة.'
    }
  ];

  db.prepare('DELETE FROM policies').run();
  for (const p of policiesData) {
    db.prepare(`
      INSERT INTO policies (key, title_en, title_ar, body_en, body_ar, is_visible)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(p.key, p.titleEn, p.titleAr, p.bodyEn, p.bodyAr);
  }

  db.prepare('DELETE FROM pages').run();
  db.prepare(`
    INSERT INTO pages (key, title_en, title_ar, body_en, body_ar, image_ids)
    VALUES (
      'about',
      'The Imperial Heritage of LUXE',
      'إرث دار لوكس الإمبراطورية',
      'Established as a haven for the rarest masterpieces, LUXE curates the world’s most exquisite horological complications, certified high jewelry, bespoke leathers, and niche extraits.\n\nEvery creation in our atelier represents hundreds of hours of relentless dedication by master craftsmen.',
      'تأسست دار لوكس لتكون الملاذ الأرقى لأندر التحف الفنية في العالم، حيث ننتقي بعناية استثنائية أندر الساعات السويسرية، المجوهرات الألماسية المعتمدة، المصنوعات الجلدية الفاخرة وخلاصات العطور النيش النادرة.\n\nكل قطعة في مجموعاتنا تمثل مئات الساعات من العمل اليدوي المتقن بأيدي كبار الحرفيين في العالم.',
      '[]'
    )
  `).run();

  console.log('✅ LUXE Luxury Store successfully seeded with 100% complete catalog, collections, lookbook, and policies!');
}

runSeed().catch(console.error);
