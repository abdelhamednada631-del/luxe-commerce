import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { allHomeSectionsForAdmin } from '@/lib/db/repos/content';
import { listAllProductsForAdmin } from '@/lib/db/repos/products';
import { allCollectionsForAdmin } from '@/lib/db/repos/collections';
import HomeSectionForm, { type SectionType } from '@/components/admin/HomeSectionForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditHomeSectionPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const section = allHomeSectionsForAdmin().find((s) => s.id === id);
  if (!section) notFound();

  const t = await getTranslations('admin.homeSections');

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(section.config) as Record<string, unknown>;
  } catch {
    config = {};
  }

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
      <h1 className="display-heading text-3xl">{t('title')}</h1>
      <HomeSectionForm
        initial={{
          id: section.id,
          type: section.type as SectionType,
          config,
          isVisible: section.is_visible === 1,
          sortOrder: section.sort_order
        }}
        products={products}
        collections={collections}
      />
    </div>
  );
}
