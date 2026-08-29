import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { queryProducts, parseImageIds } from '@/lib/db/repos/products';
import { getSettings } from '@/lib/db/repos/settings';
import { Link } from '@/i18n/navigation';
import Reveal from '@/components/ui/Reveal';
import ProductCard from '@/components/storefront/ProductCard';
import SearchInput from '@/components/storefront/SearchInput';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('search');
  return { title: t('title') };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q: qParam } = await searchParams;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('search');
  const tCollection = await getTranslations('collection');
  const settings = getSettings();
  const currency = { en: settings.locale.currencySymbolEn, ar: settings.locale.currencySymbolAr };

  const query = (qParam || '').trim().slice(0, 100);
  const isValid = query.length >= 2;

  const { products, total } = isValid
    ? queryProducts({ q: query, limit: 48 })
    : { products: [], total: 0 };

  return (
    <div>
      <header className="bg-ivory/60">
        <div className="mx-auto max-w-2xl px-4 md:px-8 py-16 md:py-24 text-center">
          <h1 className="display-heading text-4xl md:text-5xl mb-8">{t('title')}</h1>
          <SearchInput initialQuery={query} />
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-12 md:py-16">
        {!isValid ? (
          query.length > 0 ? (
            <p className="text-center text-stone py-12">{t('minChars')}</p>
          ) : null
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="display-heading text-2xl mb-3">{t('noResults')}</p>
            <p className="text-stone mb-8">{t('noResultsBody')}</p>
            <Link href="/collections" className="btn-outline">
              {t('exploreCollections')}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-stone tracking-wide mb-8">
              {t('resultsCount', { count: total })}
            </p>
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
          </>
        )}
      </div>
    </div>
  );
}
