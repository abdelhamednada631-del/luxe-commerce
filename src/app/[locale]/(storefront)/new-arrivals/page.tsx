import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { queryProducts, parseImageIds } from '@/lib/db/repos/products';
import { getSettings } from '@/lib/db/repos/settings';
import Reveal from '@/components/ui/Reveal';
import ProductCard from '@/components/storefront/ProductCard';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home');
  return { title: t('newArrivalsTitle') };
}

export default async function NewArrivalsPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('home');
  const tCollection = await getTranslations('collection');
  const settings = getSettings();
  const currency = { en: settings.locale.currencySymbolEn, ar: settings.locale.currencySymbolAr };

  const { products, total } = queryProducts({ onlyNew: true, sort: 'newest', limit: 48 });

  return (
    <div>
      {/* Editorial header */}
      <header className="bg-ivory/60">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-16 md:py-24 text-center">
          <h1 className="display-heading text-4xl md:text-6xl">{t('newArrivalsTitle')}</h1>
          {total > 0 && (
            <p className="mt-4 text-xs text-stone tracking-wide">
              {tCollection('productsCount', { count: total })}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-12 md:py-16">
        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="display-heading text-2xl mb-3">{tCollection('empty')}</p>
            <p className="text-stone">{tCollection('emptyBody')}</p>
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
                    imageIds: parseImageIds(p.image_ids)
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
