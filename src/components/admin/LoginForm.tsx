'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/admin-client';
import { LockIcon } from '@/components/ui/Icons';

/**
 * Admin login with the forced first-password-change flow:
 * sign in → if mustChange, show new/confirm fields → change → dashboard.
 */
export default function LoginForm() {
  const t = useTranslations('admin.login');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mustChange, setMustChange] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post<{ ok: boolean; mustChange: boolean }>('/api/admin/login', {
        password
      });
      if (res.mustChange) {
        setMustChange(true);
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'rate_limited') {
          setError(t('rateLimited', { seconds: err.retryAfterSeconds ?? 60 }));
        } else {
          setError(t('invalid'));
        }
      } else {
        setError(t('invalid'));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(t('confirmPassword'));
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/admin/password', {
        currentPassword: password,
        newPassword,
        confirmPassword
      });
      router.replace('/admin');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'wrong_password') setError(t('invalid'));
        else if (err.fieldErrors?.newPassword) setError(err.fieldErrors.newPassword);
        else setError(err.message);
      } else {
        setError(t('invalid'));
      }
    } finally {
      setBusy(false);
    }
  }

  if (!mustChange) {
    return (
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="admin-password" className="admin-label">
            {t('password')}
          </label>
          <input
            id="admin-password"
            type="password"
            className="admin-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            autoFocus
            dir="ltr"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-[#8c2f2f]">
            {error}
          </p>
        ) : null}
        <button type="submit" className="admin-btn w-full" disabled={busy}>
          <LockIcon size={16} />
          {t('submit')}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleChange} className="space-y-5">
      <p className="text-sm text-stone-deep">{t('mustChange')}</p>
      <div>
        <label htmlFor="new-password" className="admin-label">
          {t('newPassword')}
        </label>
        <input
          id="new-password"
          type="password"
          className="admin-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          dir="ltr"
          autoFocus
        />
        <p className="mt-1 text-xs text-stone">{t('passwordRule')}</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className="admin-label">
          {t('confirmPassword')}
        </label>
        <input
          id="confirm-password"
          type="password"
          className="admin-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          dir="ltr"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-[#8c2f2f]">
          {error}
        </p>
      ) : null}
      <button type="submit" className="admin-btn w-full" disabled={busy}>
        {t('changeButton')}
      </button>
    </form>
  );
}
