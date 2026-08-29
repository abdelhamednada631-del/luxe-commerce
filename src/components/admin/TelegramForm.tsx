'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/admin-client';
import Field from '@/components/admin/Field';
import { TelegramIcon } from '@/components/ui/Icons';

interface TelegramState {
  isConfigured: boolean;
  maskedTokenHint: string;
  chatId: string;
}

/** Telegram bot configuration + test-message sender. */
export default function TelegramForm({ state }: { state: TelegramState }) {
  const t = useTranslations('admin.telegram');
  const tCommon = useTranslations('admin.common');
  const router = useRouter();

  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState(state.chatId);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setFieldErrors({});
    setBusy(true);

    try {
      await api.put('/api/admin/telegram', { botToken, chatId });
      setNotice({ kind: 'ok', text: tCommon('saved') });
      setBotToken('');
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

  async function handleTest() {
    setNotice(null);
    setTesting(true);
    try {
      await api.post('/api/admin/telegram');
      setNotice({ kind: 'ok', text: t('testOk') });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'rate_limited') {
          setNotice({ kind: 'err', text: t('rateLimited', { seconds: err.retryAfterSeconds ?? 60 }) });
        } else if (err.code === 'test_failed') {
          setNotice({ kind: 'err', text: t('testFail', { error: err.detail ?? 'Telegram error' }) });
        } else {
          setNotice({ kind: 'err', text: t('testFail', { error: err.detail ?? err.code }) });
        }
      } else {
        setNotice({ kind: 'err', text: t('testFail', { error: 'network' }) });
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {!state.isConfigured ? (
        <div className="admin-card p-4 flex items-start gap-3 border-[#e0c9a8]">
          <TelegramIcon size={20} className="text-[#8c6a2f] shrink-0 mt-0.5" />
          <p className="text-sm text-[#8c6a2f]">{t('notConfigured')}</p>
        </div>
      ) : null}

      <form onSubmit={handleSave} className="admin-card p-5 space-y-4">
        <p className="text-sm text-stone-deep">{t('intro')}</p>

        <Field
          label={state.isConfigured ? t('botTokenKeep', { hint: state.maskedTokenHint }) : t('botToken')}
          hint={t('botTokenHint')}
          error={fieldErrors.botToken}
        >
          <input
            className="admin-input"
            dir="ltr"
            type="password"
            autoComplete="off"
            placeholder={state.isConfigured ? '••••••••' : '123456789:AA…'}
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
          />
        </Field>

        <Field label={t('chatId')} hint={t('chatIdHint')} error={fieldErrors.chatId}>
          <input
            className="admin-input"
            dir="ltr"
            inputMode="numeric"
            placeholder="123456789"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
          />
        </Field>

        {notice ? (
          <p role="status" className={`text-sm ${notice.kind === 'ok' ? 'text-[#2f6b4f]' : 'text-[#8c2f2f]'}`}>
            {notice.text}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="admin-btn" disabled={busy}>
            {busy ? '…' : t('save')}
          </button>
          <button
            type="button"
            onClick={handleTest}
            className="admin-btn-secondary"
            disabled={testing || !state.isConfigured}
          >
            <TelegramIcon size={14} />
            {testing ? t('testing') : t('test')}
          </button>
        </div>
      </form>

      {/* Setup instructions */}
      <div className="admin-card p-5">
        <h2 className="text-sm font-medium mb-3">{t('howTo')}</h2>
        <ol className="space-y-2 text-sm text-stone-deep list-decimal list-inside">
          <li>{t('step1')}</li>
          <li>{t('step2')}</li>
          <li>{t('step3')}</li>
          <li>{t('step4')}</li>
        </ol>
      </div>
    </div>
  );
}
