import { getTranslations } from 'next-intl/server';
import { listAllProductsForAdmin } from '@/lib/db/repos/products';
import CollectionForm from '@/components/admin/CollectionForm';

export const dynamic = 'force-dynamic';

export default async function NewCollectionPage() {
  const t = await getTranslations('admin.collections');
  const products = listAllProductsForAdmin();

  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('new')}</h1>
      <CollectionForm
        initial={{
          slug: '',
          nameEn: '',
          nameAr: '',
          descriptionEn: '',
          descriptionAr: '',
          imageMediaId: null,
          isVisible: true,
          sortOrder: 0,
          productIds: []
        }}
        products={products.map((p) => ({
          id: p.id,
          nameEn: p.name_en,
          nameAr: p.name_ar,
          status: p.status
        }))}
      />
    </div>
  );
}
