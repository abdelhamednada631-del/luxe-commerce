import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { collectionById, collectionProductIds } from '@/lib/db/repos/collections';
import { listAllProductsForAdmin } from '@/lib/db/repos/products';
import CollectionForm from '@/components/admin/CollectionForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const collection = collectionById(id);
  if (!collection) notFound();

  const t = await getTranslations('admin.collections');
  const products = listAllProductsForAdmin();

  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('edit')}</h1>
      <CollectionForm
        initial={{
          id: collection.id,
          slug: collection.slug,
          nameEn: collection.name_en,
          nameAr: collection.name_ar,
          descriptionEn: collection.description_en,
          descriptionAr: collection.description_ar,
          imageMediaId: collection.image_media_id,
          isVisible: collection.is_visible === 1,
          sortOrder: collection.sort_order,
          productIds: collectionProductIds(collection.id)
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
