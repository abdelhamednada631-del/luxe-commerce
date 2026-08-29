'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useWishlist } from '@/lib/store/wishlist';
import { formatPrice } from '@/lib/format';
import SmartImage from '@/components/ui/SmartImage';
import { HeartIcon } from '@/components/ui/Icons';
import type { Locale } from '@/i18n/routing';

/**
 * Wishlist grid — reads from the persisted zustand store (localStorage),
 * so it renders client-side after hydration. Empty state is honest.
 */
export default function WishlistGrid({ currency }: { currency: { en: string; ar: string } }) {
  const t = useTranslations('wishlist');
  const tProduct = useTranslations('product');
  const locale = useLocale() as Locale;
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="display-heading text-2xl mb-3">{t('empty')}</p>
        <p className="text-stone mb-8">{t('emptyBody')}</p>
        <Link href="/collections" className="btn-outline">
          {t('exploreCollections')}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
      {items.map((item) => {
        const name = locale === 'ar' ? item.nameAr : item.nameEn;
        return (
          <article key={item.productId} className="group">
            <div className="relative aspect-[3/4] bg-ivory overflow-hidden">
              <Link href={`/product/${item.slug}`} aria-label={name} className="absolute inset-0 z-10" />
              <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
                <SmartImage
                  mediaId={item.imageId}
                  alt={name}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(item.productId)}
                aria-label={tProduct('removeFromWishlist')}
                className="absolute top-3 end-3 z-20 p-2 rounded-full text-accent bg-porcelain/80 backdrop-blur-sm transition-opacity duration-300 opacity-100 lg:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <HeartIcon size={18} filled />
              </button>
            </div>
            <div className="pt-4 pb-2 text-center">
              <h3 className="font-medium text-sm leading-snug">
                <Link href={`/product/${item.slug}`} className="hover:text-accent transition-colors">
                  {name}
                </Link>
              </h3>
              <p className="mt-1.5 text-sm text-stone-deep">
                {formatPrice(item.price, locale, currency.en, currency.ar)}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
