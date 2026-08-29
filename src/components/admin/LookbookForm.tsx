'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, ApiError, uploadImage } from '@/lib/admin-client';
import Field from '@/components/admin/Field';
import { TrashIcon, UploadIcon } from '@/components/ui/Icons';

export interface LookbookFormInitial {
  id?: number;
  imageMediaId: number | null;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  linkUrl: string;
  isVisible: boolean;
  sortOrder: number;
}

/** Create / edit a lookbook entry (single image + bilingual captions + optional link). */
export default function LookbookForm({ initial }: { initial: LookbookFormInitial }) {
  const t = useTranslations('admin.lookbook');
  const tCommon = useTranslations('admin.common');
  const router = useRouter();

  const [form, setForm] = useState<LookbookFormInitial>(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set<K extends keyof LookbookFormInitial>(key: K, value: LookbookFormInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
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

    if (form.imageMediaId === null) {
      setFieldErrors({ imageMediaId: t('image') });
      setNotice({ kind: 'err', text: t('image') });
      return;
    }

    setBusy(true);
    const payload = {
      imageMediaId: form.imageMediaId,
      titleEn: form.titleEn || null,
      titleAr: form.titleAr || null,
      subtitleEn: form.subtitleEn || null,
      subtitleAr: form.subtitleAr || null,
      linkUrl: form.linkUrl || null,
      isVisible: form.isVisible,
      sortOrder: form.sortOrder
    };

    try {
      if (form.id) {
        await api.put(`/api/admin/lookbook/${form.id}`, payload);
        setNotice({ kind: 'ok', text: tCommon('updated') });
      } else {
        const res = await api.post<{ id: number }>('/api/admin/lookbook', payload);
        setForm((f) => ({ ...f, id: res.id }));
        setNotice({ kind: 'ok', text: tCommon('created') });
        router.replace(`/admin/lookbook/${res.id}`);
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setNotice({ kind: 'err', text: tCommon('saveFailed') });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    const name = form.titleEn || form.titleAr || `#${form.id}`;
    if (!window.confirm(tCommon('confirmDelete', { name }))) return;
    setBusy(true);
    try {
      await api.del(`/api/admin/lookbook/${form.id}`);
      router.push('/admin/lookbook');
      router.refresh();
    } catch {
      setNotice({ kind: 'err', text: tCommon('deleteFailed') });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Image (required) */}
      <div className="admin-card p-5 space-y-3">
        <p className="admin-label">{t('image')}</p>
        <div className="flex items-start gap-4">
          {form.imageMediaId ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/media/${form.imageMediaId}`}
                alt=""
                className="w-28 h-36 object-cover border border-line"
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
            <label className="w-28 h-36 border border-dashed border-line hover:border-ink transition-colors flex flex-col items-center justify-center gap-1 text-stone hover:text-ink cursor-pointer">
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
        {fieldErrors.imageMediaId ? (
          <p className="text-xs text-[#8c2f2f]">{fieldErrors.imageMediaId}</p>
        ) : null}
      </div>

      {/* Captions */}
      <div className="admin-card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('titleEn')} error={fieldErrors.titleEn}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.titleEn}
              onChange={(e) => set('titleEn', e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label={t('titleAr')} error={fieldErrors.titleAr}>
            <input
              className="admin-input"
              dir="rtl"
              value={form.titleAr}
              onChange={(e) => set('titleAr', e.target.value)}
              maxLength={120}
            />
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('subtitleEn')} error={fieldErrors.subtitleEn}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.subtitleEn}
              onChange={(e) => set('subtitleEn', e.target.value)}
              maxLength={200}
            />
          </Field>
          <Field label={t('subtitleAr')} error={fieldErrors.subtitleAr}>
            <input
              className="admin-input"
              dir="rtl"
              value={form.subtitleAr}
              onChange={(e) => set('subtitleAr', e.target.value)}
              maxLength={200}
            />
          </Field>
        </div>
        <Field label={t('linkUrl')} hint="/en/collections · /ar/lookbook · https://…" error={fieldErrors.linkUrl}>
          <input
            className="admin-input"
            dir="ltr"
            value={form.linkUrl}
            onChange={(e) => set('linkUrl', e.target.value)}
            maxLength={300}
          />
        </Field>
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
