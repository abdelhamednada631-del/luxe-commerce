'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart, cartSubtotal, variantKey } from '@/lib/store/cart';
import { formatPrice } from '@/lib/format';
import SmartImage from '@/components/ui/SmartImage';
import { MinusIcon, PlusIcon, TrashIcon } from '@/components/ui/Icons';
import type { Locale } from '@/i18n/routing';

/**
 * Cart contents — line items with variant labels, quantity steppers,
 * remove, subtotal, shipping preview and free-shipping progress.
 */
export default function CartView({
  currency,
  shipping
}: {
  currency: { en: string; ar: string };
  shipping: { flatFee: number; freeOverThreshold: number | null };
}) {
  const t = useTranslations('cart');
  const locale = useLocale() as Locale;
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);

  const subtotal = cartSubtotal(items);
  const { flatFee, freeOverThreshold } = shipping;
  const freeShipping = freeOverThreshold !== null && subtotal >= freeOverThreshold;
  const shippingFee = items.length === 0 ? 0 : freeShipping ? 0 : flatFee;

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="display-heading text-2xl mb-3">{t('empty')}</p>
        <p className="text-stone mb-8">{t('emptyBody')}</p>
        <Link href="/collections" className="btn-outline">
          {t('continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-10 lg:gap-16 items-start">
      {/* Line items */}
      <div className="lg:col-span-2 divide-y divide-line">
        {items.map((item) => {
          const key = variantKey(item.variantSelections);
          const name = locale === 'ar' ? item.nameAr : item.nameEn;
          const variantText = item.variantSelections
            .map((v) => `${locale === 'ar' ? v.labelAr : v.labelEn}: ${locale === 'ar' ? v.optionValueAr : v.optionValueEn}`)
            .join(' · ');
          return (
            <div key={`${item.productId}-${key}`} className="flex gap-4 md:gap-6 py-6 first:pt-0">
              <Link
                href={`/product/${item.slug}`}
                className="relative aspect-[3/4] w-20 md:w-28 shrink-0 bg-ivory overflow-hidden"
              >
                <SmartImage mediaId={item.imageId} alt={name} sizes="112px" />
              </Link>

              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-sm">
                      <Link href={`/product/${item.slug}`} className="hover:text-accent transition-colors">
                        {name}
                      </Link>
                    </h3>
                    {variantText && <p className="mt-1 text-xs text-stone">{variantText}</p>}
                  </div>
                  <p className="text-sm tabular-nums whitespace-nowrap">
                    {formatPrice(item.price * item.quantity, locale, currency.en, currency.ar)}
                  </p>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between">
                  {/* Quantity stepper */}
                  <div className="flex items-center border border-line">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, key, item.quantity - 1)}
                      aria-label={t('decrease')}
                      className="px-2.5 py-2 text-ink/60 hover:text-ink transition-colors"
                    >
                      <MinusIcon size={14} />
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, key, item.quantity + 1)}
                      aria-label={t('increase')}
                      className="px-2.5 py-2 text-ink/60 hover:text-ink transition-colors"
                    >
                      <PlusIcon size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, key)}
                    aria-label={t('remove')}
                    className="flex items-center gap-1.5 text-xs text-stone hover:text-ink transition-colors"
                  >
                    <TrashIcon size={14} />
                    {t('remove')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 border border-line bg-ivory/40 p-6 md:p-8">
        <h2 className="field-label mb-6">{t('subtotal')}</h2>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone">{t('subtotal')}</dt>
            <dd className="tabular-nums">{formatPrice(subtotal, locale, currency.en, currency.ar)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">{t('shipping')}</dt>
            <dd className="tabular-nums">
              {shippingFee === 0 ? t('freeShipping') : formatPrice(shippingFee, locale, currency.en, currency.ar)}
            </dd>
          </div>
          <div className="flex justify-between pt-3 border-t border-line font-medium">
            <dt>{t('total')}</dt>
            <dd className="tabular-nums">
              {formatPrice(subtotal + shippingFee, locale, currency.en, currency.ar)}
            </dd>
          </div>
        </dl>

        {freeOverThreshold !== null && !freeShipping && (
          <p className="mt-4 text-xs text-stone-deep">
            {t('freeShippingProgress', {
              amount: formatPrice(freeOverThreshold - subtotal, locale, currency.en, currency.ar)
            })}
          </p>
        )}
        {freeShipping && (
          <p className="mt-4 text-xs text-accent">{t('freeShippingUnlocked')}</p>
        )}

        <Link href="/checkout" className="btn-luxe w-full mt-8">
          {t('checkout')}
        </Link>
        <Link
          href="/collections"
          className="block mt-4 text-center text-xs text-stone hover:text-ink transition-colors link-luxe"
        >
          {t('continueShopping')}
        </Link>
      </aside>
    </div>
  );
}
