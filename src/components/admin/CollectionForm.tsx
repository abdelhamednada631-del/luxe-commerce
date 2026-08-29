'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/admin-client';
import Field from '@/components/admin/Field';
import { TrashIcon, UploadIcon } from '@/components/ui/Icons';

export interface CollectionFormInitial {
  id?: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imageMediaId: number | null;
  isVisible: boolean;
  sortOrder: number;
  productIds: number[];
}

interface ProductOption {
  id: number;
  nameEn: string;
  nameAr: string;
  status: 'active' | 'draft';
}

/** Create / edit collection form with single image + product picker. */
export default function CollectionForm({
  initial,
  products
}: {
  initial: CollectionFormInitial;
  products: ProductOption[];
}) {
  const t = useTranslations('admin.collections');
  const tCommon = useTranslations('admin.common');
  const router = useRouter();

  const [form, setForm] = useState<CollectionFormInitial>(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set<K extends keyof CollectionFormInitial>(key: K, value: CollectionFormInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      const { uploadImage } = await import('@/lib/admin-client');
      const id = await uploadImage(file);
      set('imageMediaId', id);
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'fileTooLarge' || err.code === 'invalidFileType')) {
        setNotice({ kind: 'err', text: tCommon(err.code) });
      } else {
        setNotice({ kind: 'err', text: tCommon('uploadFailed') });
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setFieldErrors({});
    setBusy(true);

    const payload = {
      slug: form.slug,
      nameEn: form.nameEn,
      nameAr: form.nameAr,
      descriptionEn: form.descriptionEn,
      descriptionAr: form.descriptionAr,
      imageMediaId: form.imageMediaId,
      isVisible: form.isVisible,
      sortOrder: form.sortOrder,
      productIds: form.productIds
    };

    try {
      if (form.id) {
        await api.put(`/api/admin/collections/${form.id}`, payload);
        setNotice({ kind: 'ok', text: tCommon('updated') });
      } else {
        const res = await api.post<{ id: number }>('/api/admin/collections', payload);
        setForm((f) => ({ ...f, id: res.id }));
        setNotice({ kind: 'ok', text: tCommon('created') });
        router.replace(`/admin/collections/${res.id}`);
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
      await api.del(`/api/admin/collections/${form.id}`);
      router.push('/admin/collections');
      router.refresh();
    } catch {
      setNotice({ kind: 'err', text: tCommon('deleteFailed') });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      <div className="admin-card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('nameEn')} error={fieldErrors.nameEn}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.nameEn}
              onChange={(e) => set('nameEn', e.target.value)}
              required
              maxLength={120}
            />
          </Field>
          <Field label={t('nameAr')} error={fieldErrors.nameAr}>
            <input
              className="admin-input"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => set('nameAr', e.target.value)}
              required
              maxLength={120}
            />
          </Field>
        </div>
        <Field label={t('slug')} hint="lowercase-with-hyphens" error={fieldErrors.slug}>
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
          <Field label={t('descriptionEn')}>
            <textarea
              className="admin-input min-h-24"
              dir="ltr"
              value={form.descriptionEn}
              onChange={(e) => set('descriptionEn', e.target.value)}
              maxLength={4000}
            />
          </Field>
          <Field label={t('descriptionAr')}>
            <textarea
              className="admin-input min-h-24"
              dir="rtl"
              value={form.descriptionAr}
              onChange={(e) => set('descriptionAr', e.target.value)}
              maxLength={4000}
            />
          </Field>
        </div>
      </div>

      {/* Image */}
      <div className="admin-card p-5 space-y-3">
        <p className="admin-label">{t('image')}</p>
        <div className="flex items-start gap-4">
          {form.imageMediaId ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/media/${form.imageMediaId}`}
                alt=""
                className="w-28 h-28 object-cover border border-line"
              />
              <button
                type="button"
                onClick={() => set('imageMediaId', null)}
                className="absolute -top-2 -end-2 bg-night text-ivory p-1"
                aria-label={tCommon('delete')}
              >
                <TrashIcon size={12} />
              </button>
            </div>
          ) : (
            <label className="w-28 h-28 border border-dashed border-line hover:border-ink transition-colors flex flex-col items-center justify-center gap-1 text-stone hover:text-ink cursor-pointer">
              <UploadIcon size={18} />
              <span className="text-[10px]">{uploading ? '…' : t('uploadImage')}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(e) => handleImage(e.target.files?.[0])}
              />
            </label>
          )}
        </div>
      </div>

      {/* Visibility + order */}
      <div className="admin-card p-5 grid md:grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isVisible}
            onChange={(e) => set('isVisible', e.target.checked)}
          />
          {t('visible')}
        </label>
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

      {/* Products */}
      <div className="admin-card p-5 space-y-3">
        <p className="admin-label">{t('products')}</p>
        <p className="text-xs text-stone">{t('productsHint')}</p>
        {products.length === 0 ? (
          <p className="text-sm text-stone">{t('noProducts')}</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm border border-line px-3 py-2">
                <input
                  type="checkbox"
                  checked={form.productIds.includes(p.id)}
                  onChange={(e) =>
                    set(
                      'productIds',
                      e.target.checked
                        ? [...form.productIds, p.id]
                        : form.productIds.filter((id) => id !== p.id)
                    )
                  }
                />
                <span dir="ltr">{p.nameEn}</span>
                <span dir="rtl" className="text-stone">
                  {p.nameAr}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {notice ? (
        <p role="status" className={`text-sm ${notice.kind === 'ok' ? 'text-[#2f6b4f]' : 'text-[#8c2f2f]'}`}>
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
