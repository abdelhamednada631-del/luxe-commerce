import { getTranslations } from 'next-intl/server';
import LookbookForm from '@/components/admin/LookbookForm';

export const dynamic = 'force-dynamic';

export default async function NewLookbookItemPage() {
  const t = await getTranslations('admin.lookbook');
  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('new')}</h1>
      <LookbookForm
        initial={{
          imageMediaId: null,
          titleEn: '',
          titleAr: '',
          subtitleEn: '',
          subtitleAr: '',
          linkUrl: '',
          isVisible: true,
          sortOrder: 0
        }}
      />
    </div>
  );
}
