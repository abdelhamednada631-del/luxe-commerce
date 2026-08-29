'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Storefront error boundary — calm, editorial recovery screen.
 * Rendered inside the storefront layout (header/footer stay visible).
 */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-32 md:py-48 text-center">
      <h1 className="display-heading text-4xl md:text-6xl mb-4">{t('error')}</h1>
      <p className="text-stone mb-10 max-w-md mx-auto text-sm">
        {error.digest ? `Ref: ${error.digest}` : null}
      </p>
      <div className="flex items-center justify-center gap-6">
        <button type="button" onClick={reset} className="btn-luxe">
          {t('retry')}
        </button>
        <Link href="/" className="link-luxe">
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
