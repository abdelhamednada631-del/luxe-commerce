'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/admin-client';
import { toMinor, toMajor } from '@/lib/format';
import Field from '@/components/admin/Field';
import ImageUploader from '@/components/admin/ImageUploader';
import { PlusIcon, TrashIcon } from '@/components/ui/Icons';

export interface ProductFormInitial {
  id?: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  stock: number | null;
  variants: {
    id: string;
    labelEn: string;
    labelAr: string;
    options: { id: string; valueEn: string; valueAr: string }[];
  }[];
  status: 'active' | 'draft';
  isNew: boolean;
  isFeatured: boolean;
  imageIds: number[];
  sortOrder: number;
  collectionIds: number[];
}

interface CollectionOption {
  id: number;
  nameEn: string;
  nameAr: string;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Create / edit product form — full field set incl. variants and images. */
export default function ProductForm({
  initial,
  collections
}: {
  initial: ProductFormInitial;
  collections: CollectionOption[];
}) {
  const t = useTranslations('admin.products');
  const tCommon = useTranslations('admin.common');
  const router = useRouter();

  const [form, setForm] = useState<ProductFormInitial>(initial);
  const [priceText, setPriceText] = useState(toMajor(initial.price));
  const [compareText, setCompareText] = useState(toMajor(initial.compareAtPrice));
  const [stockText, setStockText] = useState(initial.stock === null ? '' : String(initial.stock));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set<K extends keyof ProductFormInitial>(key: K, value: ProductFormInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── Variant helpers ────────────────────────────────────────────
  function addVariant() {
    if (form.variants.length >= 5) return;
    set('variants', [
      ...form.variants,
      { id: uid(), labelEn: '', labelAr: '', options: [{ id: uid(), valueEn: '', valueAr: '' }] }
    ]);
  }

  function updateVariant(vi: number, patch: Partial<ProductFormInitial['variants'][number]>) {
    set(
      'variants',
      form.variants.map((v, i) => (i === vi ? { ...v, ...patch } : v))
    );
  }

  function removeVariant(vi: number) {
    set('variants', form.variants.filter((_, i) => i !== vi));
  }

  function addOption(vi: number) {
    const variant = form.variants[vi];
    if (variant.options.length >= 20) return;
    updateVariant(vi, { options: [...variant.options, { id: uid(), valueEn: '', valueAr: '' }] });
  }

  function updateOption(vi: number, oi: number, patch: Partial<{ valueEn: string; valueAr: string }>) {
    const variant = form.variants[vi];
    updateVariant(vi, {
      options: variant.options.map((o, i) => (i === oi ? { ...o, ...patch } : o))
    });
  }

  function removeOption(vi: number, oi: number) {
    const variant = form.variants[vi];
    updateVariant(vi, { options: variant.options.filter((_, i) => i !== oi) });
  }

  // ── Submit ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setFieldErrors({});

    const price = toMinor(priceText);
    const compareAtPrice = compareText.trim() === '' ? null : toMinor(compareText);
    const stock = stockText.trim() === '' ? null : Number(stockText);

    if (!Number.isFinite(price)) {
      setFieldErrors({ price: t('price') });
      return;
    }
    if (compareAtPrice !== null && !Number.isFinite(compareAtPrice)) {
      setFieldErrors({ compareAtPrice: t('compareAtPrice') });
      return;
    }
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      setFieldErrors({ stock: t('stock') });
      return;
    }

    // Trim empty variants/options client-side (server validates too).
    const variants = form.variants
      .map((v) => ({
        ...v,
        options: v.options.filter((o) => o.valueEn.trim() !== '' || o.valueAr.trim() !== '')
      }))
      .filter((v) => v.labelEn.trim() !== '' || v.labelAr.trim() !== '');

    const payload = {
      slug: form.slug,
      nameEn: form.nameEn,
      nameAr: form.nameAr,
      descriptionEn: form.descriptionEn,
      descriptionAr: form.descriptionAr,
      price,
      compareAtPrice,
      sku: form.sku?.trim() === '' ? null : form.sku,
      stock,
      variants,
      status: form.status,
      isNew: form.isNew,
      isFeatured: form.isFeatured,
      imageIds: form.imageIds,
      sortOrder: form.sortOrder,
      collectionIds: form.collectionIds
    };

    setBusy(true);
    try {
      if (form.id) {
        await api.put(`/api/admin/products/${form.id}`, payload);
        setNotice({ kind: 'ok', text: tCommon('updated') });
      } else {
        const res = await api.post<{ id: number }>('/api/admin/products', payload);
        setForm((f) => ({ ...f, id: res.id }));
        setNotice({ kind: 'ok', text: tCommon('created') });
        router.replace(`/admin/products/${res.id}`);
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'slug_taken') {
          setFieldErrors({ slug: tCommon('slugTaken') });
        } else if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        } else {
          setNotice({ kind: 'err', text: tCommon('saveFailed') });
        }
      } else {
        setNotice({ kind: 'err', text: tCommon('saveFailed') });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    const name = form.nameEn || form.nameAr;
    if (!window.confirm(tCommon('confirmDelete', { name }))) return;
    setBusy(true);
    try {
      await api.del(`/api/admin/products/${form.id}`);
      router.push('/admin/products');
      router.refresh();
    } catch {
      setNotice({ kind: 'err', text: tCommon('deleteFailed') });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Names + slug */}
      <div className="admin-card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('nameEn')} error={fieldErrors.nameEn}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.nameEn}
              onChange={(e) => set('nameEn', e.target.value)}
              required
              maxLength={160}
            />
          </Field>
          <Field label={t('nameAr')} error={fieldErrors.nameAr}>
            <input
              className="admin-input"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => set('nameAr', e.target.value)}
              required
              maxLength={160}
            />
          </Field>
        </div>
        <Field label={t('slug')} hint={t('slugHint')} error={fieldErrors.slug}>
          <input
            className="admin-input"
            dir="ltr"
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={120}
          />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('descriptionEn')} error={fieldErrors.descriptionEn}>
            <textarea
              className="admin-input min-h-28"
              dir="ltr"
              value={form.descriptionEn}
              onChange={(e) => set('descriptionEn', e.target.value)}
              maxLength={8000}
            />
          </Field>
          <Field label={t('descriptionAr')} error={fieldErrors.descriptionAr}>
            <textarea
              className="admin-input min-h-28"
              dir="rtl"
              value={form.descriptionAr}
              onChange={(e) => set('descriptionAr', e.target.value)}
              maxLength={8000}
            />
          </Field>
        </div>
      </div>

      {/* Pricing + inventory */}
      <div className="admin-card p-5 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label={t('price')} error={fieldErrors.price}>
            <input
              className="admin-input"
              dir="ltr"
              inputMode="decimal"
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              required
            />
          </Field>
          <Field label={t('compareAtPrice')} error={fieldErrors.compareAtPrice}>
            <input
              className="admin-input"
              dir="ltr"
              inputMode="decimal"
              value={compareText}
              onChange={(e) => setCompareText(e.target.value)}
            />
          </Field>
          <Field label={t('sku')} error={fieldErrors.sku}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.sku ?? ''}
              onChange={(e) => set('sku', e.target.value)}
              maxLength={60}
            />
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('stock')} hint={t('stockHint')} error={fieldErrors.stock}>
            <input
              className="admin-input"
              dir="ltr"
              inputMode="numeric"
              value={stockText}
              onChange={(e) => setStockText(e.target.value)}
            />
          </Field>
          <Field label={t('sortOrder')}>
            <input
              className="admin-input"
              dir="ltr"
              inputMode="numeric"
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </div>

      {/* Images */}
      <div className="admin-card p-5 space-y-3">
        <p className="admin-label">{t('images')}</p>
        <ImageUploader
          mediaIds={form.imageIds}
          onChange={(ids) => set('imageIds', ids)}
          max={10}
          hint={t('imagesHint')}
        />
      </div>

      {/* Variants */}
      <div className="admin-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="admin-label !mb-0">{t('variants')}</p>
          <button type="button" onClick={addVariant} className="admin-btn-secondary !py-1.5 !px-3 text-xs">
            <PlusIcon size={14} />
            {t('addVariant')}
          </button>
        </div>
        {form.variants.map((variant, vi) => (
          <div key={variant.id} className="border border-line p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="grid md:grid-cols-2 gap-3 flex-1">
                <input
                  className="admin-input"
                  dir="ltr"
                  placeholder={t('variantLabelEn')}
                  value={variant.labelEn}
                  onChange={(e) => updateVariant(vi, { labelEn: e.target.value })}
                  maxLength={40}
                />
                <input
                  className="admin-input"
                  dir="rtl"
                  placeholder={t('variantLabelAr')}
                  value={variant.labelAr}
                  onChange={(e) => updateVariant(vi, { labelAr: e.target.value })}
                  maxLength={40}
                />
              </div>
              <button
                type="button"
                onClick={() => removeVariant(vi)}
                className="admin-btn-danger !py-1.5 !px-2.5"
                aria-label={tCommon('delete')}
              >
                <TrashIcon size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {variant.options.map((option, oi) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    className="admin-input"
                    dir="ltr"
                    placeholder={t('optionValueEn')}
                    value={option.valueEn}
                    onChange={(e) => updateOption(vi, oi, { valueEn: e.target.value })}
                    maxLength={60}
                  />
                  <input
                    className="admin-input"
                    dir="rtl"
                    placeholder={t('optionValueAr')}
                    value={option.valueAr}
                    onChange={(e) => updateOption(vi, oi, { valueAr: e.target.value })}
                    maxLength={60}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(vi, oi)}
                    className="admin-btn-danger !py-1.5 !px-2.5 shrink-0"
                    aria-label={tCommon('delete')}
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addOption(vi)} className="text-xs text-stone-deep hover:text-ink underline underline-offset-4">
                + {t('addOption')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Status + collections */}
      <div className="admin-card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('status')}>
            <select
              className="admin-input"
              value={form.status}
              onChange={(e) => set('status', e.target.value as 'active' | 'draft')}
            >
              <option value="active">{t('statusActive')}</option>
              <option value="draft">{t('statusDraft')}</option>
            </select>
          </Field>
          <div className="flex flex-col gap-2 justify-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => set('isNew', e.target.checked)}
              />
              {t('isNew')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set('isFeatured', e.target.checked)}
              />
              {t('isFeatured')}
            </label>
          </div>
        </div>

        <div>
          <p className="admin-label">{t('collections')}</p>
          {collections.length === 0 ? (
            <p className="text-sm text-stone">{t('noCollections')}</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {collections.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm border border-line px-3 py-2">
                  <input
                    type="checkbox"
                    checked={form.collectionIds.includes(c.id)}
                    onChange={(e) =>
                      set(
                        'collectionIds',
                        e.target.checked
                          ? [...form.collectionIds, c.id]
                          : form.collectionIds.filter((id) => id !== c.id)
                      )
                    }
                  />
                  <span dir="ltr">{c.nameEn}</span>
                  <span dir="rtl" className="text-stone">
                    {c.nameAr}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {notice ? (
        <p
          role="status"
          className={`text-sm ${notice.kind === 'ok' ? 'text-[#2f6b4f]' : 'text-[#8c2f2f]'}`}
        >
          {notice.text}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <button type="submit" className="admin-btn" disabled={busy}>
          {busy ? '…' : tCommon('save')}
        </button>
        {form.id ? (
          <button type="button" onClick={handleDelete} className="admin-btn-danger" disabled={busy}>
            <TrashIcon size={14} />
            {tCommon('delete')}
          </button>
        ) : null}
      </div>
    </form>
  );
}
