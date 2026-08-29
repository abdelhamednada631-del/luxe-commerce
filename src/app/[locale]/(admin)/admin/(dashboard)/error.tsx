'use client';

import { useTranslations } from 'next-intl';

/**
 * Admin error boundary — rendered inside the dashboard shell so the
 * sidebar stays available for navigation away from a broken screen.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  return (
    <div className="admin-card p-10 text-center max-w-lg mx-auto mt-8">
      <h1 className="text-xl font-medium mb-2">{t('error')}</h1>
      <p className="text-sm text-stone mb-6">
        {error.digest ? `Ref: ${error.digest}` : null}
      </p>
      <button type="button" onClick={reset} className="admin-btn">
        {t('retry')}
      </button>
    </div>
  );
}
