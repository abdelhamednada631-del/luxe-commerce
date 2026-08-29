'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertIcon, HeartIcon, MinusIcon, PlusIcon } from '@/components/ui/Icons';
import { useCart } from '@/lib/store/cart';
import { useWishlist } from '@/lib/store/wishlist';
import type { ProductVariant } from '@/lib/db/repos/products';
import type { Locale } from '@/i18n/routing';

export interface AddToCartPanelProduct {
  id: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number;
  imageId: number | null;
  stock: number | null;
}

/**
 * Variant selection, quantity stepper, add-to-cart and wishlist toggle.
 * Honest stock feedback: hard disable at zero, quiet low-stock note.
 */
export default function AddToCartPanel({
  product,
  variants
}: {
  product: AddToCartPanelProduct;
  variants: ProductVariant[];
}) {
  const t = useTranslations('product');
  const locale = useLocale() as Locale;
  const addItem = useCart((s) => s.addItem);
  const wishlisted = useWishlist((s) => s.items.some((i) => i.productId === product.id));
  const toggleWishlist = useWishlist((s) => s.toggle);

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'idle' | 'added'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'added') return;
    const timer = window.setTimeout(() => setStatus('idle'), 1800);
    return () => window.clearTimeout(timer);
  }, [status]);

  const outOfStock = product.stock === 0;
  const maxQty = product.stock !== null ? Math.min(product.stock, 50) : 50;

  const selectOption = (variantId: string, optionId: string) => {
    setSelected((s) => ({ ...s, [variantId]: optionId }));
    setError(null);
  };

  const handleAdd = () => {
    const missing = variants.filter((v) => !selected[v.id]);
    if (missing.length > 0) {
      const labels = missing.map((v) => (locale === 'ar' ? v.labelAr : v.labelEn));
      setError(t('variantRequired', { labels: labels.join(locale === 'ar' ? '، ' : ', ') }));
      return;
    }

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        price: product.price,
        imageId: product.imageId,
        variantSelections: variants.map((v) => {
          const option = v.options.find((o) => o.id === selected[v.id])!;
          return {
            variantId: v.id,
            labelEn: v.labelEn,
            labelAr: v.labelAr,
            optionId: option.id,
            optionValueEn: option.valueEn,
            optionValueAr: option.valueAr
          };
        })
      },
      Math.min(quantity, maxQty)
    );
    setError(null);
    setStatus('added');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Variant groups */}
      {variants.map((v) => {
        const label = locale === 'ar' ? v.labelAr : v.labelEn;
        return (
          <fieldset key={v.id}>
            <legend className="field-label mb-2">{t('selectVariant', { label })}</legend>
            <div className="flex flex-wrap gap-2">
              {v.options.map((o) => {
                const isSelected = selected[v.id] === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => selectOption(v.id, o.id)}
                    aria-pressed={isSelected}
                    className={`border px-4 py-2 text-sm transition-colors duration-300 ${
                      isSelected
                        ? 'border-ink bg-ink text-porcelain'
                        : 'border-line text-ink hover:border-ink'
                    }`}
                  >
                    {locale === 'ar' ? o.valueAr : o.valueEn}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {/* Validation error */}
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-[#8C3A2B]">
          <AlertIcon size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Low stock note */}
      {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
        <p className="text-xs text-stone-deep">{t('lowStock', { count: product.stock })}</p>
      )}

      {/* Quantity + Add to cart */}
      <div className="flex items-stretch gap-3">
        <div className="flex items-center border border-line">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || outOfStock}
            aria-label={`${t('quantity')} −`}
            className="px-3 py-3 text-ink/60 transition-colors hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
          >
            <MinusIcon size={16} />
          </button>
          <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty || outOfStock}
            aria-label={`${t('quantity')} +`}
            className="px-3 py-3 text-ink/60 transition-colors hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
          >
            <PlusIcon size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className="btn-luxe flex-1 disabled:opacity-40 disabled:pointer-events-none"
        >
          {outOfStock ? t('outOfStock') : status === 'added' ? t('added') : t('addToCart')}
        </button>
      </div>

      {/* Wishlist */}
      <button
        type="button"
        onClick={() =>
          toggleWishlist({
            productId: product.id,
            slug: product.slug,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            price: product.price,
            imageId: product.imageId
          })
        }
        aria-pressed={wishlisted}
        className={`btn-outline w-full ${wishlisted ? 'border-accent text-accent' : ''}`}
      >
        <HeartIcon size={16} filled={wishlisted} />
        {wishlisted ? t('removeFromWishlist') : t('addToWishlist')}
      </button>
    </div>
  );
}
