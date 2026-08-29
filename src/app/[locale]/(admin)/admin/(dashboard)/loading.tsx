import { getTranslations } from 'next-intl/server';

/**
 * Admin loading state — quiet skeleton block matching the dashboard cards.
 */
export default async function AdminLoading() {
  const t = await getTranslations('common');

  return (
    <div className="space-y-4" aria-busy="true">
      <p className="text-sm text-stone animate-pulse">{t('loading')}</p>
      <div className="admin-card h-24 animate-pulse" />
      <div className="admin-card h-48 animate-pulse" />
    </div>
  );
}
