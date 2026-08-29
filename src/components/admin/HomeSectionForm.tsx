'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/admin-client';
import Field from '@/components/admin/Field';
import SingleImageInput from '@/components/admin/SingleImageInput';
import { TrashIcon } from '@/components/ui/Icons';

export type SectionType =
  | 'hero'
  | 'featured_products'
  | 'collection_highlight'
  | 'new_arrivals'
  | 'lookbook_preview'
  | 'brand_story'
  | 'promo_banner';

export const SECTION_TYPES: SectionType[] = [
  'hero',
  'featured_products',
  'collection_highlight',
  'new_arrivals',
  'lookbook_preview',
  'brand_story',
  'promo_banner'
];

const TYPE_LABEL_KEYS: Record<SectionType, string> = {
  hero: 'typeHero',
  featured_products: 'typeFeatured',
  collection_highlight: 'typeCollectionHighlight',
  new_arrivals: 'typeNewArrivals',
  lookbook_preview: 'typeLookbookPreview',
  brand_story: 'typeBrandStory',
  promo_banner: 'typePromoBanner'
};

const DEFAULT_CONFIGS: Record<SectionType, Record<string, unknown>> = {
  hero: {
    imageMediaId: null,
    headlineEn: '',
    headlineAr: '',
    sublineEn: '',
    sublineAr: '',
    ctaLabelEn: '',
    ctaLabelAr: '',
    ctaHref: ''
  },
  featured_products: { titleEn: '', titleAr: '', productIds: [] as number[] },
  collection_highlight: { collectionId: 0, layout: 'split' },
  new_arrivals: { titleEn: '', titleAr: '', limit: 8 },
  lookbook_preview: { titleEn: '', titleAr: '', limit: 4 },
  brand_story: { titleEn: '', titleAr: '', bodyEn: '', bodyAr: '', imageMediaId: null },
  promo_banner: {
    imageMediaId: null,
    headlineEn: '',
    headlineAr: '',
    bodyEn: '',
    bodyAr: '',
    ctaLabelEn: '',
    ctaLabelAr: '',
    ctaHref: ''
  }
};

export interface HomeSectionFormInitial {
  id?: number;
  type: SectionType;
  config: Record<string, unknown>;
  isVisible: boolean;
  sortOrder: number;
}

interface ProductOption {
  id: number;
  nameEn: string;
  nameAr: string;
}

interface CollectionOption {
  id: number;
  nameEn: string;
  nameAr: string;
}

/** Create / edit a homepage section with per-type config fields. */
export default function HomeSectionForm({
  initial,
  products,
  collections
}: {
  initial: HomeSectionFormInitial;
  products: ProductOption[];
  collections: CollectionOption[];
}) {
  const t = useTranslations('admin.homeSections');
  const tCommon = useTranslations('admin.common');
  const router = useRouter();

  const [type, setType] = useState<SectionType>(initial.type);
  const [config, setConfig] = useState<Record<string, unknown>>({
    ...DEFAULT_CONFIGS[initial.type],
    ...initial.config
  });
  const [isVisible, setIsVisible] = useState(initial.isVisible);
  const [sortOrder, setSortOrder] = useState(initial.sortOrder);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function setCfg(key: string, value: unknown) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  function str(key: string): string {
    const v = config[key];
    return typeof v === 'string' ? v : '';
  }

  function num(key: string): number {
    const v = config[key];
    return typeof v === 'number' ? v : 0;
  }

  function idList(key: string): number[] {
    const v = config[key];
    return Array.isArray(v) ? (v as number[]) : [];
  }

  function handleTypeChange(next: SectionType) {
    setType(next);
    setConfig({ ...DEFAULT_CONFIGS[next] });
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setFieldErrors({});

    if (type === 'collection_highlight' && num('collectionId') <= 0) {
      setFieldErrors({ collectionId: t('selectCollection') });
      return;
    }

    setBusy(true);
    const payload = { type, config, isVisible, sortOrder };

    try {
      if (initial.id) {
        await api.put(`/api/admin/home-sections/${initial.id}`, payload);
        setNotice({ kind: 'ok', text: tCommon('updated') });
      } else {
        const res = await api.post<{ id: number }>('/api/admin/home-sections', payload);
        setNotice({ kind: 'ok', text: tCommon('created') });
        router.replace(`/admin/home-sections/${res.id}`);
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
      setNotice({ kind: 'err', text: tCommon('saveFailed') });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!initial.id) return;
    if (!window.confirm(tCommon('confirmDelete', { name: t(TYPE_LABEL_KEYS[type]) }))) return;
    setBusy(true);
    try {
      await api.del(`/api/admin/home-sections/${initial.id}`);
      router.push('/admin/home-sections');
      router.refresh();
    } catch {
      setNotice({ kind: 'err', text: tCommon('deleteFailed') });
      setBusy(false);
    }
  }

  function renderConfig() {
    switch (type) {
      case 'hero':
        return (
          <div className="admin-card p-5 space-y-4">
            <SingleImageInput
              label={t('image')}
              mediaId={typeof config.imageMediaId === 'number' ? config.imageMediaId : null}
              onChange={(id) => setCfg('imageMediaId', id)}
              aspect="w-40 h-24"
            />
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t('headlineEn')}>
                <input className="admin-input" dir="ltr" value={str('headlineEn')} onChange={(e) => setCfg('headlineEn', e.target.value)} maxLength={200} />
              </Field>
              <Field label={t('headlineAr')}>
                <input className="admin-input" dir="rtl" value={str('headlineAr')} onChange={(e) => setCfg('headlineAr', e.target.value)} maxLength={200} />
              </Field>
              <Field label={t('sublineEn')}>
                <input className="admin-input" dir="ltr" value={str('sublineEn')} onChange={(e) => setCfg('sublineEn', e.target.value)} maxLength={300} />
              </Field>
              <Field label={t('sublineAr')}>
                <input className="admin-input" dir="rtl" value={str('sublineAr')} onChange={(e) => setCfg('sublineAr', e.target.value)} maxLength={300} />
              </Field>
              <Field label={t('ctaLabelEn')}>
                <input className="admin-input" dir="ltr" value={str('ctaLabelEn')} onChange={(e) => setCfg('ctaLabelEn', e.target.value)} maxLength={60} />
              </Field>
              <Field label={t('ctaLabelAr')}>
                <input className="admin-input" dir="rtl" value={str('ctaLabelAr')} onChange={(e) => setCfg('ctaLabelAr', e.target.value)} maxLength={60} />
              </Field>
            </div>
            <Field label={t('ctaHref')} hint={t('ctaHrefHint')} error={fieldErrors.ctaHref}>
              <input className="admin-input" dir="ltr" value={str('ctaHref')} onChange={(e) => setCfg('ctaHref', e.target.value)} maxLength={300} />
            </Field>
          </div>
        );

      case 'featured_products': {
        const selected = idList('productIds');
        return (
          <div className="admin-card p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t('titleEn')}>
                <input className="admin-input" dir="ltr" value={str('titleEn')} onChange={(e) => setCfg('titleEn', e.target.value)} maxLength={120} />
              </Field>
              <Field label={t('titleAr')}>
                <input className="admin-input" dir="rtl" value={str('titleAr')} onChange={(e) => setCfg('titleAr', e.target.value)} maxLength={120} />
              </Field>
            </div>
            <div>
              <p className="admin-label">{t('products')}</p>
              <p className="text-xs text-stone">{t('productsHint')}</p>
              {products.length === 0 ? (
                <p className="mt-2 text-sm text-stone">{t('noProductsAvailable')}</p>
              ) : (
                <div className="mt-2 grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                  {products.map((p) => {
                    const checked = selected.includes(p.id);
                    return (
                      <label key={p.id} className={`flex items-center gap-2 text-sm border border-line px-3 py-2 ${checked || selected.length < 12 ? '' : 'opacity-50'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!checked && selected.length >= 12}
                          onChange={(e) =>
                            setCfg(
                              'productIds',
                              e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id)
                            )
                          }
                        />
                        <span dir="ltr">{p.nameEn}</span>
                        <span dir="rtl" className="text-stone">{p.nameAr}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'collection_highlight':
        return (
          <div className="admin-card p-5 space-y-4">
            {collections.length === 0 ? (
              <p className="text-sm text-stone">{t('noCollectionsAvailable')}</p>
            ) : (
              <Field label={t('selectCollection')} error={fieldErrors.collectionId}>
                <select
                  className="admin-input"
                  value={num('collectionId') || ''}
                  onChange={(e) => setCfg('collectionId', Number(e.target.value) || 0)}
                >
                  <option value="" disabled>
                    —
                  </option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} · {c.nameAr}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={t('layout')}>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="layout"
                    checked={str('layout') === 'split'}
                    onChange={() => setCfg('layout', 'split')}
                  />
                  {t('layoutSplit')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="layout"
                    checked={str('layout') === 'grid'}
                    onChange={() => setCfg('layout', 'grid')}
                  />
                  {t('layoutGrid')}
                </label>
              </div>
            </Field>
          </div>
        );

      case 'new_arrivals':
      case 'lookbook_preview': {
        const maxLimit = type === 'new_arrivals' ? 12 : 8;
        return (
          <div className="admin-card p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t('titleEn')}>
                <input className="admin-input" dir="ltr" value={str('titleEn')} onChange={(e) => setCfg('titleEn', e.target.value)} maxLength={120} />
              </Field>
              <Field label={t('titleAr')}>
                <input className="admin-input" dir="rtl" value={str('titleAr')} onChange={(e) => setCfg('titleAr', e.target.value)} maxLength={120} />
              </Field>
            </div>
            <Field label={t('limit')}>
              <input
                className="admin-input"
                dir="ltr"
                inputMode="numeric"
                min={1}
                max={maxLimit}
                value={num('limit')}
                onChange={(e) => setCfg('limit', Math.min(maxLimit, Math.max(1, Number(e.target.value) || 1)))}
              />
            </Field>
          </div>
        );
      }

      case 'brand_story':
        return (
          <div className="admin-card p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t('titleEn')}>
                <input className="admin-input" dir="ltr" value={str('titleEn')} onChange={(e) => setCfg('titleEn', e.target.value)} maxLength={160} />
              </Field>
              <Field label={t('titleAr')}>
                <input className="admin-input" dir="rtl" value={str('titleAr')} onChange={(e) => setCfg('titleAr', e.target.value)} maxLength={160} />
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t('bodyEn')}>
                <textarea className="admin-input min-h-32" dir="ltr" value={str('bodyEn')} onChange={(e) => setCfg('bodyEn', e.target.value)} maxLength={2000} />
              </Field>
              <Field label={t('bodyAr')}>
                <textarea className="admin-input min-h-32" dir="rtl" value={str('bodyAr')} onChange={(e) => setCfg('bodyAr', e.target.value)} maxLength={2000} />
              </Field>
            </div>
            <SingleImageInput
              label={t('image')}
              mediaId={typeof config.imageMediaId === 'number' ? config.imageMediaId : null}
              onChange={(id) => setCfg('imageMediaId', id)}
            />
          </div>
        );

      case 'promo_banner':
        return (
          <div className="admin-card p-5 space-y-4">
            <SingleImageInput
              label={t('image')}
              mediaId={typeof config.imageMediaId === 'number' ? config.imageMediaId : null}
              onChange={(id) => setCfg('imageMediaId', id)}
              aspect="w-40 h-24"
            />
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t('headlineEn')}>
                <input className="admin-input" dir="ltr" value={str('headlineEn')} onChange={(e) => setCfg('headlineEn', e.target.value)} maxLength={160} />
              </Field>
              <Field label={t('headlineAr')}>
                <input className="admin-input" dir="rtl" value={str('headlineAr')} onChange={(e) => setCfg('headlineAr', e.target.value)} maxLength={160} />
              </Field>
              <Field label={t('bodyEn')}>
                <textarea className="admin-input min-h-20" dir="ltr" value={str('bodyEn')} onChange={(e) => setCfg('bodyEn', e.target.value)} maxLength={400} />
              </Field>
              <Field label={t('bodyAr')}>
                <textarea className="admin-input min-h-20" dir="rtl" value={str('bodyAr')} onChange={(e) => setCfg('bodyAr', e.target.value)} maxLength={400} />
              </Field>
              <Field label={t('ctaLabelEn')}>
                <input className="admin-input" dir="ltr" value={str('ctaLabelEn')} onChange={(e) => setCfg('ctaLabelEn', e.target.value)} maxLength={60} />
              </Field>
              <Field label={t('ctaLabelAr')}>
                <input className="admin-input" dir="rtl" value={str('ctaLabelAr')} onChange={(e) => setCfg('ctaLabelAr', e.target.value)} maxLength={60} />
              </Field>
            </div>
            <Field label={t('ctaHref')} hint={t('ctaHrefHint')} error={fieldErrors.ctaHref}>
              <input className="admin-input" dir="ltr" value={str('ctaHref')} onChange={(e) => setCfg('ctaHref', e.target.value)} maxLength={300} />
            </Field>
          </div>
        );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Type (fixed when editing) */}
      <div className="admin-card p-5 space-y-4">
        <Field label={t('type')}>
          <select
            className="admin-input"
            value={type}
            disabled={!!initial.id}
            onChange={(e) => handleTypeChange(e.target.value as SectionType)}
          >
            {SECTION_TYPES.map((s) => (
              <option key={s} value={s}>
                {t(TYPE_LABEL_KEYS[s])}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
            {t('visible')}
          </label>
          <Field label={t('sortOrder')} hint={t('sortHint')}>
            <input
              className="admin-input"
              dir="ltr"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </div>

      {renderConfig()}

      {notice ? (
        <p role="status" className={`text-sm ${notice.kind === 'ok' ? 'text-[#2f6b4f]' : 'text-[#8c2f2f]'}`}>
          {notice.text}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <button type="submit" className="admin-btn" disabled={busy}>
          {busy ? '…' : tCommon('save')}
        </button>
        {initial.id ? (
          <button type="button" onClick={handleDelete} className="admin-btn-danger" disabled={busy}>
            <TrashIcon size={14} />
            {tCommon('delete')}
          </button>
        ) : null}
      </div>
    </form>
  );
}
