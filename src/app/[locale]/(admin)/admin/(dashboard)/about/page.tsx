import { getTranslations } from 'next-intl/server';
import { getAboutPage } from '@/lib/db/repos/content';
import { parseImageIds } from '@/lib/db/repos/products';
import AboutForm from '@/components/admin/AboutForm';

export const dynamic = 'force-dynamic';

export default async function AdminAboutPage() {
  const t = await getTranslations('admin.about');
  const about = getAboutPage();

  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('title')}</h1>
      <AboutForm
        initial={{
          titleEn: about.title_en,
          titleAr: about.title_ar,
          bodyEn: about.body_en,
          bodyAr: about.body_ar,
          imageIds: parseImageIds(about.image_ids)
        }}
      />
    </div>
  );
}
