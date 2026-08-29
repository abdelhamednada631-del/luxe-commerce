import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { collectionBySlug } from '@/lib/db/repos/collections';
import { queryProducts } from '@/lib/db/repos/products';
import { getSettings } from '@/lib/db/repos/settings';
import Reveal from '@/components/ui/Reveal';
import SmartImage from '@/components/ui/SmartImage';
import ProductCard from '@/components/storefront/ProductCard';
import CollectionToolbar from '@/components/storefront/CollectionToolbar';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = collectionBySlug(slug);
  if (!collection) return { title: 'Not found' };
  const locale = await getLocale();
  return {
    title: locale === 'ar' ? collection.name_ar : collection.name_en,
    description: locale === 'ar' ? collection.description_ar : collection.description_en
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sort: sortParam } = await searchParams;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('collection');
  const settings = getSettings();

  const collection = collectionBySlug(slug);
  if (!collection || !collection.is_visible) notFound();

  const sort =
    sortParam === 'newest' || sortParam === 'price-asc' || sortParam === 'price-desc' ? sortParam : 'default';
  const { products, total } = queryProducts({ collectionSlug: slug, sort, limit: 48 });

  const name = locale === 'ar' ? collection.name_ar : collection.name_en;
  const description = locale === 'ar' ? collection.description_ar : collection.description_en;
  const currency = { en: settings.locale.currencySymbolEn, ar: settings.locale.currencySymbolAr };

  return (
    <div>
      {/* Editorial header */}
      <header className="relative h-[42vh] min-h-[320px] max-h-[520px]">
        <div className="absolute inset-0 bg-night">
          <SmartImage
            mediaId={collection.image_media_id}
            alt={name}
            sizes="100vw"
            priority
            imgClassName="object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/70 to-night/20" />
        </div>
        <div className="relative h-full flex flex-col items-center justify-center text-center text-ivory px-6">
          <h1 className="display-heading text-4xl md:text-6xl">{name}</h1>
          {description && <p className="mt-4 text-sm text-ivory/75 max-w-xl">{description}</p>}
          <p className="mt-3 text-xs text-ivory/50 tracking-wide">{t('productsCount', { count: total })}</p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-12 md:py-16">
        <CollectionToolbar collectionSlug={slug} currentSort={sort} />

        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="display-heading text-2xl mb-3">{t('noProducts')}</p>
            <p className="text-stone">{t('noProductsBody')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i, 8) * 50}>
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
                  priority={i < 4}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
