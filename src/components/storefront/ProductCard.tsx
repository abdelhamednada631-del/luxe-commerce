'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import SmartImage from '@/components/ui/SmartImage';
import { HeartIcon } from '@/components/ui/Icons';
import { useWishlist } from '@/lib/store/wishlist';
import { formatPrice } from '@/lib/format';
import type { Locale } from '@/i18n/routing';

export interface ProductCardData {
  id: number;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  isNew: boolean;
  imageIds: number[];
}

export default function ProductCard({
  product,
  currency,
  priority = false
}: {
  product: ProductCardData;
  currency: { en: string; ar: string };
  priority?: boolean;
}) {
  const t = useTranslations('product');
  const locale = useLocale() as Locale;
  const wishlisted = useWishlist((s) => s.items.some((i) => i.productId === product.id));
  const toggleWishlist = useWishlist((s) => s.toggle);

  const cover = product.imageIds[0] ?? null;
  const hover = product.imageIds[1] ?? null;

  return (
    <article className="group">
      <div className="relative aspect-[3/4] bg-ivory overflow-hidden">
        <Link href={`/product/${product.slug}`} aria-label={product.name} className="absolute inset-0 z-10" />

        {/* Cover image with subtle hover scale */}
        <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
          <SmartImage mediaId={cover} alt={product.name} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={priority} />
        </div>

        {/* Second image cross-fade */}
        {hover && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
            <SmartImage mediaId={hover} alt={product.name} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 start-3 z-20 flex flex-col gap-2 pointer-events-none">
          {product.isNew && (
            <span className="bg-porcelain/90 backdrop-blur-sm text-ink text-[0.6rem] font-medium uppercase tracking-[0.18em] px-2.5 py-1">
              {t('newBadge')}
            </span>
          )}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="bg-accent text-accent-ink text-[0.6rem] font-medium uppercase tracking-[0.18em] px-2.5 py-1">
              {t('saleBadge')}
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          type="button"
          onClick={() =>
            toggleWishlist({
              productId: product.id,
              slug: product.slug,
              nameEn: product.name,
              nameAr: product.name,
              price: product.price,
              imageId: cover
            })
          }
          aria-label={wishlisted ? t('removeFromWishlist') : t('addToWishlist')}
          aria-pressed={wishlisted}
          className={`absolute top-3 end-3 z-20 p-2 rounded-full transition-all duration-300 ${
            wishlisted
              ? 'text-accent opacity-100'
              : 'text-ink/60 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-accent'
          }`}
        >
          <HeartIcon size={18} filled={wishlisted} />
        </button>
      </div>

      <div className="pt-4 pb-2 text-center">
        <h3 className="font-medium text-sm leading-snug">
          <Link href={`/product/${product.slug}`} className="hover:text-accent transition-colors">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1.5 text-sm text-stone-deep">
          {formatPrice(product.price, locale, currency.en, currency.ar)}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="ms-2 text-stone line-through text-xs">
              {formatPrice(product.compareAtPrice, locale, currency.en, currency.ar)}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
