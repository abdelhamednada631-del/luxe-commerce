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

console.log('=== SEEDING LUXE STORE WITH REAL HIGH-RES LUXURY PHOTOGRAPHY ===');

// Helper to fetch real photograph from Unsplash and convert to crisp 1200x1600 WebP
const cache = new Map();

async function getRealLuxuryImage(photoId, label) {
  if (cache.has(photoId)) return cache.get(photoId);

  const url = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&h=1600&q=85`;
  console.log(`Fetching real photo [${label}]: ${photoId}...`);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const inputBuf = Buffer.from(await res.arrayBuffer());

    const webpBuffer = await sharp(inputBuf)
      .resize(1200, 1600, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer();

    const hash = crypto.createHash('sha256').update(webpBuffer).digest('hex').slice(0, 32);
    const filename = `${hash}.webp`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, webpBuffer);

    const existing = db.prepare('SELECT id FROM media WHERE filename = ?').get(filename);
    if (existing) {
      cache.set(photoId, existing.id);
      return existing.id;
    }

    const insertRes = db.prepare('INSERT INTO media (filename, mime, width, height, size_bytes) VALUES (?, ?, ?, ?, ?)').run(
      filename,
      'image/webp',
      1200,
      1600,
      webpBuffer.length
    );
    const id = Number(insertRes.lastInsertRowid);
    cache.set(photoId, id);
    return id;
  } catch (err) {
    console.error(`Failed to fetch photo ${photoId} (${label}):`, err.message);
    throw err;
  }
}

async function runSeed() {
  db.prepare('DELETE FROM collection_products').run();
  db.prepare('DELETE FROM products').run();
  db.prepare('DELETE FROM collections').run();
  db.prepare('DELETE FROM lookbook_items').run();
  db.prepare('DELETE FROM home_sections').run();

  console.log('1. Downloading real photography for Collections...');

  const watchCoverId = await getRealLuxuryImage('photo-1533139502658-0198f920d8e8', 'Collection Watch Atelier');
  const jewelryCoverId = await getRealLuxuryImage('photo-1515562141207-7a88fb7ce338', 'Collection High Jewelry Radiance');
  const leatherCoverId = await getRealLuxuryImage('photo-1584917865442-de89df76afd3', 'Collection Exotic Leather Goods');
  const perfumeCoverId = await getRealLuxuryImage('photo-1592945403244-b3fbafd7f539', 'Collection Niche Fragrances');
  const silkCoverId = await getRealLuxuryImage('photo-1607083206869-4c7672e72a8a', 'Collection Silk & Cashmere Drapery');

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

  console.log('2. Downloading real photography for Products...');

  const productsList = [
    // --- WATCHES ---
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
      photos: ['photo-1524592094714-0f0654e20314', 'photo-1522335789203-aabd1fc54bc9'],
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
      photos: ['photo-1524805444758-089113d48a6d', 'photo-1542496658-e33a6d0d50f6'],
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
      photos: ['photo-1509042239860-f550ce710b93', 'photo-1523275335684-37898b6baf30'],
      variants: []
    },

    // --- JEWELRY ---
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
      photos: ['photo-1605100804763-247f67b3557e', 'photo-1573408301185-9146fe634ad0'],
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
      photos: ['photo-1599643478518-a784e5dc4c8f', 'photo-1515562141207-7a88fb7ce338'],
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
      photos: ['photo-1600003014755-ba31aa59c4b6', 'photo-1598560917505-59a3ad559071'],
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
      photos: ['photo-1535632066927-ab7c9ab60908', 'photo-1506630448388-4e683c67ddb0'],
      variants: []
    },

    // --- LEATHER ---
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
      photos: ['photo-1553062407-98eeb64c6a62', 'photo-1566150905458-1bf1fc113f0d'],
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
      photos: ['photo-1584917865442-de89df76afd3', 'photo-1590874103328-eac38a683ce7'],
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
      photos: ['photo-1548036328-c9fa89d128fa', 'photo-1591561954557-26941169b49e'],
      variants: []
    },

    // --- NICHE PERFUMES ---
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
      photos: ['photo-1541643600914-78b084683601', 'photo-1588405748880-12d1d2a59f75'],
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
      photos: ['photo-1592945403244-b3fbafd7f539', 'photo-1523293182086-7651a899d37f'],
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
      photos: ['photo-1588405748880-12d1d2a59f75', 'photo-1594035910387-fea47794261f'],
      variants: []
    },

    // --- SILK & CASHMERE ---
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
      photos: ['photo-1608256246200-53e635b5b65f', 'photo-1607083206869-4c7672e72a8a'],
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
      photos: ['photo-1583391733956-3750e0ff4e8b', 'photo-1584308666744-24d5c474f2ae'],
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
    const img1 = await getRealLuxuryImage(p.photos[0], `${p.slug}-primary`);
    const img2 = await getRealLuxuryImage(p.photos[1], `${p.slug}-hover`);

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

  console.log(`Successfully seeded ${productsList.length} luxury products with authentic photography.`);

  console.log('3. Downloading real photography for Lookbook Items...');
  const lookbook1 = await getRealLuxuryImage('photo-1509631179647-0177331693ae', 'Lookbook Nocturne Elegance');
  const lookbook2 = await getRealLuxuryImage('photo-1515562141207-7a88fb7ce338', 'Lookbook Diamond Radiance');
  const lookbook3 = await getRealLuxuryImage('photo-1469334031218-e382a71b716b', 'Lookbook High Fashion Leather');
  const lookbook4 = await getRealLuxuryImage('photo-1541643600914-78b084683601', 'Lookbook Oud Mist');

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

  console.log('4. Downloading real photography for Home Page Layout & Sections...');
  const heroImageId = await getRealLuxuryImage('photo-1490481651871-ab68de25d43d', 'Hero Haute Couture');
  const promoImageId = await getRealLuxuryImage('photo-1515886657613-9f3515b0c78f', 'Promo VIP Concierge');
  const brandImageId = await getRealLuxuryImage('photo-1533139502658-0198f920d8e8', 'Brand Story Watchmaker');

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

  console.log('💎 ALL REAL PHOTOGRAPHY SEEDED SUCCESSFULLY INTO LUXE STORE!');
}

runSeed().catch(console.error);
