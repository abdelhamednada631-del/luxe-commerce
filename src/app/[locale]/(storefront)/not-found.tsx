import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('common');

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-32 md:py-48 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="display-heading text-4xl md:text-6xl mb-4">{t('notFoundTitle')}</h1>
      <p className="text-stone mb-10 max-w-md mx-auto">{t('notFoundBody')}</p>
      <Link href="/" className="btn-luxe">
        {t('backHome')}
      </Link>
    </div>
  );
}
