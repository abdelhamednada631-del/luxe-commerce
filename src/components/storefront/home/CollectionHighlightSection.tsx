import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Reveal from '@/components/ui/Reveal';
import SmartImage from '@/components/ui/SmartImage';
import ProductCard from '@/components/storefront/ProductCard';
import type { Locale } from '@/i18n/routing';
import type { ProductRow } from '@/lib/db/repos/products';
import type { CollectionRow } from '@/lib/db/repos/collections';

interface Config {
  collectionId?: number;
  layout?: 'split' | 'grid';
}

export default async function CollectionHighlightSection({
  config,
  locale,
  currency,
  resolveCollection,
  collectionProducts
}: {
  config: Record<string, unknown>;
  locale: Locale;
  currency: { en: string; ar: string };
  resolveCollection: (id: number) => CollectionRow | undefined;
  collectionProducts: (slug: string, limit: number) => ProductRow[];
}) {
  const t = await getTranslations('home');
  const c = config as Config;
  const collection = c.collectionId ? resolveCollection(c.collectionId) : undefined;
  if (!collection || !collection.is_visible) return null;

  const name = locale === 'ar' ? collection.name_ar : collection.name_en;
  const description = locale === 'ar' ? collection.description_ar : collection.description_en;
  const products = collectionProducts(collection.slug, 4);

  if (c.layout === 'grid') {
    return (
      <section className="py-20 md:py-28 bg-ivory">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          <Reveal className="text-center mb-12 md:mb-16">
            <h2 className="display-heading text-3xl md:text-5xl">{name}</h2>
            <div className="mx-auto mt-6 h-px w-16 bg-accent" aria-hidden="true" />
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <ProductCard
                  product={{
                    id: p.id,
                    slug: p.slug,
                    name: locale === 'ar' ? p.name_ar : p.name_en,
                    price: p.price,
                    compareAtPrice: p.compare_at_price,
                    isNew: p.is_new === 1,
                    imageIds: JSON.parse(p.image_ids)
                  }}
                  currency={currency}
                />
              </Reveal>
            ))}
          </div>
          <Reveal className="text-center mt-14">
            <Link href={`/collections/${collection.slug}`} className="btn-outline">
              {t('discoverCollection')}
            </Link>
          </Reveal>
        </div>
      </section>
    );
  }

  // Editorial split layout
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <Reveal>
          <div className="relative aspect-[4/5] bg-ivory overflow-hidden">
            <SmartImage
              mediaId={collection.image_media_id}
              alt={name}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </Reveal>
        <div>
          <Reveal delay={100}>
            <p className="eyebrow mb-4">{t('explore')}</p>
            <h2 className="display-heading text-3xl md:text-5xl mb-6">{name}</h2>
            {description && <p className="text-stone-deep leading-relaxed max-w-md mb-8">{description}</p>}
          </Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {products.slice(0, 2).map((p, i) => (
              <Reveal key={p.id} delay={150 + i * 60}>
                <ProductCard
                  product={{
                    id: p.id,
                    slug: p.slug,
                    name: locale === 'ar' ? p.name_ar : p.name_en,
                    price: p.price,
                    compareAtPrice: p.compare_at_price,
                    isNew: p.is_new === 1,
                    imageIds: JSON.parse(p.image_ids)
                  }}
                  currency={currency}
                />
              </Reveal>
            ))}
          </div>
          <Reveal delay={250} className="mt-10">
            <Link href={`/collections/${collection.slug}`} className="btn-luxe">
              {t('discoverCollection')}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
