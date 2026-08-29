import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { allLookbookForAdmin } from '@/lib/db/repos/content';
import LookbookForm from '@/components/admin/LookbookForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditLookbookItemPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const item = allLookbookForAdmin().find((i) => i.id === id);
  if (!item) notFound();

  const t = await getTranslations('admin.lookbook');
  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('edit')}</h1>
      <LookbookForm
        initial={{
          id: item.id,
          imageMediaId: item.image_media_id,
          titleEn: item.title_en ?? '',
          titleAr: item.title_ar ?? '',
          subtitleEn: item.subtitle_en ?? '',
          subtitleAr: item.subtitle_ar ?? '',
          linkUrl: item.link_url ?? '',
          isVisible: item.is_visible === 1,
          sortOrder: item.sort_order
        }}
      />
    </div>
  );
}
