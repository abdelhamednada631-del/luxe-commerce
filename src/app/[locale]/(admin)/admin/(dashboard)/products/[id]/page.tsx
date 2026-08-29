import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { productById, parseVariants, parseImageIds, productCollectionIds } from '@/lib/db/repos/products';
import { allCollectionsForAdmin } from '@/lib/db/repos/collections';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const product = productById(id);
  if (!product) notFound();

  const t = await getTranslations('admin.products');
  const collections = allCollectionsForAdmin();

  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('edit')}</h1>
      <ProductForm
        initial={{
          id: product.id,
          slug: product.slug,
          nameEn: product.name_en,
          nameAr: product.name_ar,
          descriptionEn: product.description_en,
          descriptionAr: product.description_ar,
          price: product.price,
          compareAtPrice: product.compare_at_price,
          sku: product.sku ?? '',
          stock: product.stock,
          variants: parseVariants(product.variants),
          status: product.status,
          isNew: product.is_new === 1,
          isFeatured: product.is_featured === 1,
          imageIds: parseImageIds(product.image_ids),
          sortOrder: product.sort_order,
          collectionIds: productCollectionIds(product.id)
        }}
        collections={collections.map((c) => ({ id: c.id, nameEn: c.name_en, nameAr: c.name_ar }))}
      />
    </div>
  );
}
