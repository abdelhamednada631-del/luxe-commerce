'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/admin-client';
import Field from '@/components/admin/Field';

export interface PolicyFormInitial {
  key: 'shipping' | 'returns' | 'privacy' | 'terms';
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  isVisible: boolean;
}

const POLICY_KEYS: PolicyFormInitial['key'][] = ['shipping', 'returns', 'privacy', 'terms'];

/** Tabbed editor for the four fixed policy pages. */
export default function PoliciesEditor({ policies }: { policies: PolicyFormInitial[] }) {
  const t = useTranslations('admin.policies');
  const tCommon = useTranslations('admin.common');
  const router = useRouter();

  const [activeKey, setActiveKey] = useState<PolicyFormInitial['key']>(policies[0]?.key ?? 'shipping');
  const [forms, setForms] = useState<Record<string, PolicyFormInitial>>(
    Object.fromEntries(policies.map((p) => [p.key, p]))
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const active = forms[activeKey];

  function set<K extends keyof PolicyFormInitial>(key: K, value: PolicyFormInitial[K]) {
    setForms((f) => ({ ...f, [activeKey]: { ...f[activeKey], [key]: value } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setFieldErrors({});
    setBusy(true);

    try {
      await api.put('/api/admin/policies', active);
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
    <div className="space-y-6 max-w-3xl">
      {/* Policy tabs */}
      <div role="tablist" aria-label={t('title')} className="flex flex-wrap gap-2">
        {POLICY_KEYS.filter((k) => forms[k]).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={k === activeKey}
            onClick={() => {
              setActiveKey(k);
              setNotice(null);
              setFieldErrors({});
            }}
            className={`px-4 py-2 text-sm border transition-colors ${
              k === activeKey
                ? 'border-ink bg-ink text-porcelain'
                : 'border-line bg-porcelain text-stone-deep hover:text-ink'
            }`}
          >
            {t(k)}
            {forms[k].isVisible ? null : <span className="ms-1.5 text-xs opacity-60">○</span>}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="admin-card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('titleEn')} error={fieldErrors.titleEn}>
            <input
              className="admin-input"
              dir="ltr"
              value={active.titleEn}
              onChange={(e) => set('titleEn', e.target.value)}
              required
              maxLength={160}
            />
          </Field>
          <Field label={t('titleAr')} error={fieldErrors.titleAr}>
            <input
              className="admin-input"
              dir="rtl"
              value={active.titleAr}
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
            value={active.bodyEn}
            onChange={(e) => set('bodyEn', e.target.value)}
            maxLength={20000}
          />
        </Field>
        <Field label={t('bodyAr')}>
          <textarea
            className="admin-input min-h-48"
            dir="rtl"
            value={active.bodyAr}
            onChange={(e) => set('bodyAr', e.target.value)}
            maxLength={20000}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active.isVisible}
            onChange={(e) => set('isVisible', e.target.checked)}
          />
          {t('visible')}
        </label>

        {notice ? (
          <p role="status" className={`text-sm ${notice.kind === 'ok' ? 'text-[#2f6b4f]' : 'text-[#8c2f2f]'}`}>
            {notice.text}
          </p>
        ) : null}
        <button type="submit" className="admin-btn" disabled={busy}>
          {busy ? '…' : tCommon('save')}
        </button>
      </form>
    </div>
  );
}
