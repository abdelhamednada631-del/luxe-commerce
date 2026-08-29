'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/admin-client';
import Field from '@/components/admin/Field';
import ImageUploader from '@/components/admin/ImageUploader';

export interface AboutFormInitial {
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  imageIds: number[];
}

/** Singleton About-page editor (bilingual story + gallery). */
export default function AboutForm({ initial }: { initial: AboutFormInitial }) {
  const t = useTranslations('admin.about');
  const tCommon = useTranslations('admin.common');
  const router = useRouter();

  const [form, setForm] = useState<AboutFormInitial>(initial);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set<K extends keyof AboutFormInitial>(key: K, value: AboutFormInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setFieldErrors({});
    setBusy(true);

    try {
      await api.put('/api/admin/about', form);
      setNotice({ kind: 'ok', text: tCommon('saved') });
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
        setNotice({ kind: 'err', text: tCommon('saveFailed') });
      } else {
        setNotice({ kind: 'err', text: tCommon('saveFailed') });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      <div className="admin-card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('pageTitleEn')} error={fieldErrors.titleEn}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.titleEn}
              onChange={(e) => set('titleEn', e.target.value)}
              required
              maxLength={160}
            />
          </Field>
          <Field label={t('pageTitleAr')} error={fieldErrors.titleAr}>
            <input
              className="admin-input"
              dir="rtl"
              value={form.titleAr}
              onChange={(e) => set('titleAr', e.target.value)}
              required
              maxLength={160}
            />
          </Field>
        </div>
        <Field label={t('bodyEn')}>
          <textarea
            className="admin-input min-h-48"
            dir="ltr"
            value={form.bodyEn}
            onChange={(e) => set('bodyEn', e.target.value)}
            maxLength={30000}
          />
        </Field>
        <Field label={t('bodyAr')}>
          <textarea
            className="admin-input min-h-48"
            dir="rtl"
            value={form.bodyAr}
            onChange={(e) => set('bodyAr', e.target.value)}
            maxLength={30000}
          />
        </Field>
      </div>

      <div className="admin-card p-5 space-y-3">
        <p className="admin-label">{t('images')}</p>
        <ImageUploader mediaIds={form.imageIds} onChange={(ids) => set('imageIds', ids)} max={8} />
      </div>

      {notice ? (
        <p role="status" className={`text-sm ${notice.kind === 'ok' ? 'text-[#2f6b4f]' : 'text-[#8c2f2f]'}`}>
          {notice.text}
        </p>
      ) : null}
      <button type="submit" className="admin-btn" disabled={busy}>
        {busy ? '…' : tCommon('save')}
      </button>
    </form>
  );
}
