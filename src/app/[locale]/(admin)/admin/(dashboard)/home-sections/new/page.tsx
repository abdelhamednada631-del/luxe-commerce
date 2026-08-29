import { getTranslations } from 'next-intl/server';
import { listAllProductsForAdmin } from '@/lib/db/repos/products';
import { allCollectionsForAdmin } from '@/lib/db/repos/collections';
import HomeSectionForm from '@/components/admin/HomeSectionForm';

export const dynamic = 'force-dynamic';

export default async function NewHomeSectionPage() {
  const t = await getTranslations('admin.homeSections');

  const products = listAllProductsForAdmin()
    .filter((p) => p.status === 'active')
    .map((p) => ({ id: p.id, nameEn: p.name_en, nameAr: p.name_ar }));
  const collections = allCollectionsForAdmin().map((c) => ({
    id: c.id,
    nameEn: c.name_en,
    nameAr: c.name_ar
  }));

  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('new')}</h1>
      <HomeSectionForm
        initial={{ type: 'hero', config: {}, isVisible: true, sortOrder: 0 }}
        products={products}
        collections={collections}
      />
    </div>
  );
}
