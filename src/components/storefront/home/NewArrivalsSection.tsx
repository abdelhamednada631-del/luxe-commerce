import { Link } from '@/i18n/navigation';
import Reveal from '@/components/ui/Reveal';
import ProductCard from '@/components/storefront/ProductCard';
import type { Locale } from '@/i18n/routing';
import type { ProductRow } from '@/lib/db/repos/products';

interface Config {
  titleEn?: string;
  titleAr?: string;
  limit?: number;
}

export default function NewArrivalsSection({
  config,
  locale,
  currency,
  newArrivals,
  fallbackTitle
}: {
  config: Record<string, unknown>;
  locale: Locale;
  currency: { en: string; ar: string };
  newArrivals: (limit: number) => ProductRow[];
  fallbackTitle: string;
}) {
  const c = config as Config;
  const title = (locale === 'ar' ? c.titleAr : c.titleEn) || fallbackTitle;
  const products = newArrivals(c.limit ?? 8);

  if (products.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-ivory">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="flex items-end justify-between mb-12 md:mb-16 gap-6">
          <div>
            <h2 className="display-heading text-3xl md:text-5xl">{title}</h2>
            <div className="mt-6 h-px w-16 bg-accent" aria-hidden="true" />
          </div>
          <Link href="/new-arrivals" className="link-luxe hidden md:inline text-xs uppercase tracking-[0.18em] font-medium shrink-0">
            <span className={locale === 'ar' ? 'text-sm normal-case tracking-normal' : ''}>{fallbackTitle}</span>
          </Link>
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
                  isNew: true,
                  imageIds: JSON.parse(p.image_ids)
                }}
                currency={currency}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
