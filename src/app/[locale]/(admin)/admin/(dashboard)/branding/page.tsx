import { getTranslations } from 'next-intl/server';
import { getSettings } from '@/lib/db/repos/settings';
import BrandingForm from '@/components/admin/BrandingForm';

export const dynamic = 'force-dynamic';

export default async function AdminBrandingPage() {
  const t = await getTranslations('admin.branding');
  const settings = getSettings();

  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('title')}</h1>
      <BrandingForm initial={settings} />
    </div>
  );
}
