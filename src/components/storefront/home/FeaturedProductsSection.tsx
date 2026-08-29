import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Reveal from '@/components/ui/Reveal';
import ProductCard from '@/components/storefront/ProductCard';
import type { Locale } from '@/i18n/routing';
import type { ProductRow } from '@/lib/db/repos/products';

interface Config {
  titleEn?: string;
  titleAr?: string;
  productIds?: number[];
}

export default async function FeaturedProductsSection({
  config,
  locale,
  currency,
  resolveProducts,
  fallbackTitle
}: {
  config: Record<string, unknown>;
  locale: Locale;
  currency: { en: string; ar: string };
  resolveProducts: (ids: number[]) => ProductRow[];
  fallbackTitle: string;
}) {
  const t = await getTranslations('common');
  const c = config as Config;
  const title = (locale === 'ar' ? c.titleAr : c.titleEn) || fallbackTitle;
  const products = resolveProducts(c.productIds ?? []);

  if (products.length === 0) return null;

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="text-center mb-12 md:mb-16">
          <h2 className="display-heading text-3xl md:text-5xl">{title}</h2>
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
                priority={i < 2}
              />
            </Reveal>
          ))}
        </div>
        <Reveal className="text-center mt-14">
          <Link href="/collections" className="btn-outline">
            {t('viewAll')}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
