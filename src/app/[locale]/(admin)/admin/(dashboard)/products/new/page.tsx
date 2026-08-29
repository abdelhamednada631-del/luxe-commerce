import { getTranslations } from 'next-intl/server';
import { allCollectionsForAdmin } from '@/lib/db/repos/collections';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const t = await getTranslations('admin.products');
  const collections = allCollectionsForAdmin();

  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('new')}</h1>
      <ProductForm
        initial={{
          slug: '',
          nameEn: '',
          nameAr: '',
          descriptionEn: '',
          descriptionAr: '',
          price: 0,
          compareAtPrice: null,
          sku: '',
          stock: null,
          variants: [],
          status: 'draft',
          isNew: false,
          isFeatured: false,
          imageIds: [],
          sortOrder: 0,
          collectionIds: []
        }}
        collections={collections.map((c) => ({ id: c.id, nameEn: c.name_en, nameAr: c.name_ar }))}
      />
    </div>
  );
}
