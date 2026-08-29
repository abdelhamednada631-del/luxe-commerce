'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useCart, cartSubtotal } from '@/lib/store/cart';
import { formatPrice } from '@/lib/format';
import { AlertIcon } from '@/components/ui/Icons';
import type { Locale } from '@/i18n/routing';

interface Governorate {
  en: string;
  ar: string;
}

type FieldErrors = Record<string, string>;

/**
 * Checkout form — cash on delivery via Telegram.
 * Submits to /api/orders; on success clears the cart and shows the
 * confirmation page with the order number and honest delivery status.
 */
export default function CheckoutForm({
  currency,
  shipping,
  governorates
}: {
  currency: { en: string; ar: string };
  shipping: { flatFee: number; freeOverThreshold: number | null };
  governorates: Governorate[];
}) {
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const tOrder = useTranslations('order');
  const locale = useLocale() as Locale;
  const router = useRouter();

  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    governorate: '',
    city: '',
    addressDetails: '',
    notes: ''
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  const subtotal = cartSubtotal(items);
  const freeShipping =
    shipping.freeOverThreshold !== null && subtotal >= shipping.freeOverThreshold;
  const shippingFee = freeShipping ? 0 : shipping.flatFee;
  const total = subtotal + shippingFee;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [key]: '' }));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (form.customerName.trim().length < 2) errors.customerName = t('errors.name');
    if (!/^(\+?2)?01[0-25]\d{8}$/.test(form.phone.trim())) errors.phone = t('errors.phone');
    if (!form.governorate) errors.governorate = t('errors.governorate');
    if (!form.city.trim()) errors.city = t('errors.city');
    if (form.addressDetails.trim().length < 5) errors.addressDetails = t('errors.address');
    if (items.length === 0) errors.items = t('errors.items');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            variantSelections: i.variantSelections.map((v) => ({
              variantId: v.variantId,
              optionId: v.optionId
            }))
          }))
        })
      });

      const data = (await res.json().catch(() => null)) as
        | { orderNumber?: number; status?: string; fieldErrors?: FieldErrors; error?: string; retryAfterSeconds?: number }
        | null;

      if (res.ok && data?.orderNumber) {
        clear();
        router.push(`/order/${data.orderNumber}`);
        return;
      }

      if (res.status === 400 && data?.fieldErrors) {
        setFieldErrors(data.fieldErrors);
      } else if (res.status === 429) {
        setTopError(t('errors.generic'));
      } else if (res.status === 409 || data?.error === 'stock_issue') {
        setTopError(t('errors.stockIssue'));
      } else {
        setTopError(t('errors.generic'));
      }
    } catch {
      setTopError(t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  /* Empty cart → honest empty state, no fake checkout */
  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="display-heading text-2xl mb-3">{tCart('empty')}</p>
        <p className="text-stone mb-8">{tCart('emptyBody')}</p>
        <Link href="/collections" className="btn-outline">
          {tCart('continueShopping')}
        </Link>
      </div>
    );
  }

  const fieldClass = (key: string) =>
    `field ${fieldErrors[key] ? '!border-[#8C3A2B]' : ''}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid lg:grid-cols-3 gap-10 lg:gap-16 items-start">
      {/* Contact + shipping */}
      <div className="lg:col-span-2 space-y-10">
        <section>
          <h2 className="field-label mb-6">{t('contactInfo')}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="customerName" className="field-label">{t('name')}</label>
              <input
                id="customerName"
                type="text"
                value={form.customerName}
                onChange={set('customerName')}
                autoComplete="name"
                className={fieldClass('customerName')}
                aria-invalid={!!fieldErrors.customerName}
              />
              {fieldErrors.customerName && <p role="alert" className="mt-1.5 text-xs text-[#8C3A2B]">{fieldErrors.customerName}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="field-label">{t('phone')}</label>
              <input
                id="phone"
                type="tel"
                dir="ltr"
                value={form.phone}
                onChange={set('phone')}
                placeholder={t('phoneHint')}
                autoComplete="tel"
                className={fieldClass('phone')}
                aria-invalid={!!fieldErrors.phone}
              />
              {fieldErrors.phone && <p role="alert" className="mt-1.5 text-xs text-[#8C3A2B]">{fieldErrors.phone}</p>}
            </div>
          </div>
        </section>

        <section>
          <h2 className="field-label mb-6">{t('shippingInfo')}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="governorate" className="field-label">{t('governorate')}</label>
              <select
                id="governorate"
                value={form.governorate}
                onChange={set('governorate')}
                className={fieldClass('governorate')}
                aria-invalid={!!fieldErrors.governorate}
              >
                <option value="">{t('selectGovernorate')}</option>
                {governorates.map((g) => (
                  <option key={g.en} value={g.en}>
                    {locale === 'ar' ? g.ar : g.en}
                  </option>
                ))}
              </select>
              {fieldErrors.governorate && <p role="alert" className="mt-1.5 text-xs text-[#8C3A2B]">{fieldErrors.governorate}</p>}
            </div>
            <div>
              <label htmlFor="city" className="field-label">{t('city')}</label>
              <input
                id="city"
                type="text"
                value={form.city}
                onChange={set('city')}
                autoComplete="address-level2"
                className={fieldClass('city')}
                aria-invalid={!!fieldErrors.city}
              />
              {fieldErrors.city && <p role="alert" className="mt-1.5 text-xs text-[#8C3A2B]">{fieldErrors.city}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addressDetails" className="field-label">{t('addressDetails')}</label>
              <input
                id="addressDetails"
                type="text"
                value={form.addressDetails}
                onChange={set('addressDetails')}
                placeholder={t('addressHint')}
                autoComplete="street-address"
                className={fieldClass('addressDetails')}
                aria-invalid={!!fieldErrors.addressDetails}
              />
              {fieldErrors.addressDetails && <p role="alert" className="mt-1.5 text-xs text-[#8C3A2B]">{fieldErrors.addressDetails}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="field-label">{t('notes')}</label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={set('notes')}
                placeholder={t('notesHint')}
                rows={3}
                className={`${fieldClass('notes')} resize-none`}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 border border-line bg-ivory/40 p-6 md:p-8">
        <h2 className="field-label mb-6">{t('orderSummary')}</h2>

        <ul className="space-y-4 text-sm mb-6">
          {items.map((i) => {
            const name = locale === 'ar' ? i.nameAr : i.nameEn;
            const variantText = i.variantSelections
              .map((v) => `${locale === 'ar' ? v.labelAr : v.labelEn}: ${locale === 'ar' ? v.optionValueAr : v.optionValueEn}`)
              .join(' · ');
            return (
              <li key={`${i.productId}-${i.variantSelections.map((v) => v.optionId).join('-')}`} className="flex justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate">{name}</p>
                  {variantText && <p className="text-xs text-stone truncate">{variantText}</p>}
                  <p className="text-xs text-stone">×{i.quantity}</p>
                </div>
                <p className="tabular-nums whitespace-nowrap">
                  {formatPrice(i.price * i.quantity, locale, currency.en, currency.ar)}
                </p>
              </li>
            );
          })}
        </ul>

        <dl className="space-y-3 text-sm border-t border-line pt-4">
          <div className="flex justify-between">
            <dt className="text-stone">{tCart('subtotal')}</dt>
            <dd className="tabular-nums">{formatPrice(subtotal, locale, currency.en, currency.ar)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">{tCart('shipping')}</dt>
            <dd className="tabular-nums">
              {shippingFee === 0 ? tCart('freeShipping') : formatPrice(shippingFee, locale, currency.en, currency.ar)}
            </dd>
          </div>
          <div className="flex justify-between pt-3 border-t border-line font-medium">
            <dt>{tCart('total')}</dt>
            <dd className="tabular-nums">{formatPrice(total, locale, currency.en, currency.ar)}</dd>
          </div>
        </dl>

        {/* Cash on delivery notice */}
        <div className="mt-6 border border-line bg-porcelain/50 p-4 text-xs leading-relaxed text-stone-deep">
          <p className="font-medium text-ink mb-1">{t('cashOnDelivery')}</p>
          {t('codHint')}
        </div>

        {topError && (
          <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-[#8C3A2B]">
            <AlertIcon size={16} className="mt-0.5 shrink-0" />
            <span>{topError}</span>
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-luxe w-full mt-6 disabled:opacity-50 disabled:pointer-events-none">
          {submitting ? t('placing') : t('placeOrder')}
        </button>
        <p className="sr-only" aria-live="polite">{submitting ? t('placing') : ''}</p>
      </aside>
    </form>
  );
}
