'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/admin-client';
import Field from '@/components/admin/Field';
import SingleImageInput from '@/components/admin/SingleImageInput';
import { toMinor, toMajor } from '@/lib/format';
import type { Settings } from '@/lib/db/repos/settings';

/** Full white-label settings editor: branding, theme, contact, social, locale, shipping, checkout. */
export default function BrandingForm({ initial }: { initial: Settings }) {
  const t = useTranslations('admin.branding');
  const tCommon = useTranslations('admin.common');
  const router = useRouter();

  const [form, setForm] = useState<Settings>(initial);
  const [flatFee, setFlatFee] = useState(toMajor(initial.shipping.flatFee));
  const [freeOver, setFreeOver] = useState(toMajor(initial.shipping.freeOverThreshold));
  const [governoratesText, setGovernoratesText] = useState(
    initial.checkout.governorates.map((g) => `${g.en} | ${g.ar}`).join('\n')
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function setGroup<K extends keyof Settings>(group: K, patch: Partial<Settings[K]>) {
    setForm((f) => ({ ...f, [group]: { ...f[group], ...patch } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setFieldErrors({});
    setBusy(true);

    // Parse governorates textarea → [{en, ar}]
    const governorates: { en: string; ar: string }[] = [];
    for (const line of governoratesText.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [en, ar] = trimmed.split('|').map((p) => p.trim());
      if (en && ar) governorates.push({ en, ar });
    }
    if (governorates.length === 0) {
      setFieldErrors({ checkout: t('governoratesHint') });
      setNotice({ kind: 'err', text: t('governoratesHint') });
      setBusy(false);
      return;
    }

    const fee = toMinor(flatFee);
    if (Number.isNaN(fee)) {
      setFieldErrors({ shipping: t('flatFee') });
      setBusy(false);
      return;
    }
    const threshold = freeOver.trim() === '' ? null : toMinor(freeOver);
    if (threshold !== null && Number.isNaN(threshold)) {
      setFieldErrors({ shipping: t('freeOverThreshold') });
      setBusy(false);
      return;
    }

    try {
      await api.put('/api/admin/settings', {
        ...form,
        shipping: { flatFee: fee, freeOverThreshold: threshold },
        checkout: { governorates }
      });
      setNotice({ kind: 'ok', text: tCommon('saved') });
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Branding */}
      <div className="admin-card p-5 space-y-4">
        <h2 className="text-sm font-medium">{t('title')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('storeNameEn')} error={fieldErrors.storeNameEn}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.branding.storeNameEn}
              onChange={(e) => setGroup('branding', { storeNameEn: e.target.value })}
              required
              maxLength={80}
            />
          </Field>
          <Field label={t('storeNameAr')} error={fieldErrors.storeNameAr}>
            <input
              className="admin-input"
              dir="rtl"
              value={form.branding.storeNameAr}
              onChange={(e) => setGroup('branding', { storeNameAr: e.target.value })}
              required
              maxLength={80}
            />
          </Field>
          <Field label={t('taglineEn')}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.branding.taglineEn}
              onChange={(e) => setGroup('branding', { taglineEn: e.target.value })}
              maxLength={200}
            />
          </Field>
          <Field label={t('taglineAr')}>
            <input
              className="admin-input"
              dir="rtl"
              value={form.branding.taglineAr}
              onChange={(e) => setGroup('branding', { taglineAr: e.target.value })}
              maxLength={200}
            />
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <SingleImageInput
              label={t('logo')}
              mediaId={form.branding.logoMediaId}
              onChange={(id) => setGroup('branding', { logoMediaId: id })}
              aspect="w-28 h-16"
            />
            <p className="text-xs text-stone">{t('logoHint')}</p>
          </div>
          <div className="space-y-1">
            <SingleImageInput
              label={t('favicon')}
              mediaId={form.branding.faviconMediaId}
              onChange={(id) => setGroup('branding', { faviconMediaId: id })}
            />
            <p className="text-xs text-stone">{t('faviconHint')}</p>
          </div>
        </div>
        <Field label={t('accentColor')} error={fieldErrors.accentColor}>
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label={t('accentColor')}
              value={form.theme.accentColor}
              onChange={(e) => setGroup('theme', { accentColor: e.target.value })}
              className="w-12 h-10 border border-line bg-porcelain cursor-pointer"
            />
            <input
              className="admin-input flex-1"
              dir="ltr"
              value={form.theme.accentColor}
              onChange={(e) => setGroup('theme', { accentColor: e.target.value })}
              pattern="#[0-9a-fA-F]{6}"
              maxLength={7}
            />
          </div>
        </Field>
      </div>

      {/* Contact */}
      <div className="admin-card p-5 space-y-4">
        <h2 className="text-sm font-medium">{t('contact')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('phone')}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.contact.phone}
              onChange={(e) => setGroup('contact', { phone: e.target.value })}
              maxLength={30}
            />
          </Field>
          <Field label={t('whatsapp')}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.contact.whatsapp}
              onChange={(e) => setGroup('contact', { whatsapp: e.target.value })}
              maxLength={30}
            />
          </Field>
          <Field label={t('email')} error={fieldErrors.email}>
            <input
              className="admin-input"
              dir="ltr"
              type="email"
              value={form.contact.email}
              onChange={(e) => setGroup('contact', { email: e.target.value })}
              maxLength={120}
            />
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('addressEn')}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.contact.addressEn}
              onChange={(e) => setGroup('contact', { addressEn: e.target.value })}
              maxLength={300}
            />
          </Field>
          <Field label={t('addressAr')}>
            <input
              className="admin-input"
              dir="rtl"
              value={form.contact.addressAr}
              onChange={(e) => setGroup('contact', { addressAr: e.target.value })}
              maxLength={300}
            />
          </Field>
        </div>
      </div>

      {/* Social */}
      <div className="admin-card p-5 space-y-4">
        <h2 className="text-sm font-medium">{t('social')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {(['instagram', 'facebook', 'tiktok', 'x', 'youtube'] as const).map((key) => (
            <Field key={key} label={t(key)} error={fieldErrors[key]}>
              <input
                className="admin-input"
                dir="ltr"
                type="url"
                placeholder="https://"
                value={form.social[key]}
                onChange={(e) => setGroup('social', { [key]: e.target.value })}
                maxLength={300}
              />
            </Field>
          ))}
        </div>
      </div>

      {/* Locale & currency */}
      <div className="admin-card p-5 space-y-4">
        <h2 className="text-sm font-medium">{t('locale')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('defaultLocale')}>
            <select
              className="admin-input"
              value={form.locale.defaultLocale}
              onChange={(e) => setGroup('locale', { defaultLocale: e.target.value as 'en' | 'ar' })}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </Field>
          <Field label={t('currencyCode')}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.locale.currencyCode}
              onChange={(e) => setGroup('locale', { currencyCode: e.target.value })}
              required
              maxLength={10}
            />
          </Field>
          <Field label={t('currencySymbolEn')}>
            <input
              className="admin-input"
              dir="ltr"
              value={form.locale.currencySymbolEn}
              onChange={(e) => setGroup('locale', { currencySymbolEn: e.target.value })}
              required
              maxLength={10}
            />
          </Field>
          <Field label={t('currencySymbolAr')}>
            <input
              className="admin-input"
              dir="rtl"
              value={form.locale.currencySymbolAr}
              onChange={(e) => setGroup('locale', { currencySymbolAr: e.target.value })}
              required
              maxLength={10}
            />
          </Field>
        </div>
      </div>

      {/* Shipping & checkout */}
      <div className="admin-card p-5 space-y-4">
        <h2 className="text-sm font-medium">{t('shipping')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('flatFee')} error={fieldErrors.shipping}>
            <input
              className="admin-input"
              dir="ltr"
              inputMode="decimal"
              value={flatFee}
              onChange={(e) => setFlatFee(e.target.value)}
            />
          </Field>
          <Field label={t('freeOverThreshold')} hint={t('freeOverThresholdHint')}>
            <input
              className="admin-input"
              dir="ltr"
              inputMode="decimal"
              value={freeOver}
              onChange={(e) => setFreeOver(e.target.value)}
            />
          </Field>
        </div>
        <Field label={t('governorates')} hint={t('governoratesHint')} error={fieldErrors.checkout}>
          <textarea
            className="admin-input min-h-48 font-mono text-xs"
            dir="ltr"
            value={governoratesText}
            onChange={(e) => setGovernoratesText(e.target.value)}
          />
        </Field>
      </div>

      {notice ? (
        <p role="status" className={`text-sm ${notice.kind === 'ok' ? 'text-[#2f6b4f]' : 'text-[#8c2f2f]'}`}>
          {notice.text}
        </p>
      ) : null}
      <div className="flex items-center gap-4">
        <button type="submit" className="admin-btn" disabled={busy}>
          {busy ? '…' : tCommon('save')}
        </button>
        <p className="text-xs text-stone">{t('storefrontPreview')}</p>
      </div>
    </form>
  );
}
