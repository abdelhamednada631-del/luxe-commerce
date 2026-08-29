import { getTranslations } from 'next-intl/server';

/**
 * Storefront loading state — a single calm line, no spinners or noise.
 * Streams in while dynamic pages fetch data from SQLite.
 */
export default async function StorefrontLoading() {
  const t = await getTranslations('common');

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-32 md:py-48 text-center">
      <p className="eyebrow animate-pulse">{t('loading')}</p>
    </div>
  );
}
