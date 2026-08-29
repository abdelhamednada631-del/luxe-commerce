import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { allHomeSectionsForAdmin } from '@/lib/db/repos/content';
import { PlusIcon } from '@/components/ui/Icons';

export const dynamic = 'force-dynamic';

const TYPE_LABEL_KEYS: Record<string, string> = {
  hero: 'typeHero',
  featured_products: 'typeFeatured',
  collection_highlight: 'typeCollectionHighlight',
  new_arrivals: 'typeNewArrivals',
  lookbook_preview: 'typeLookbookPreview',
  brand_story: 'typeBrandStory',
  promo_banner: 'typePromoBanner'
};

export default async function AdminHomeSectionsPage() {
  const t = await getTranslations('admin.homeSections');
  const tCommon = await getTranslations('admin.common');

  const sections = allHomeSectionsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display-heading text-3xl">{t('title')}</h1>
        <Link href="/admin/home-sections/new" className="admin-btn">
          <PlusIcon size={16} />
          {t('new')}
        </Link>
      </div>

      {sections.length === 0 ? (
        <div className="admin-card p-10 text-center">
          <p className="text-sm text-stone">{tCommon('noItems')}</p>
          <Link href="/admin/home-sections/new" className="admin-btn mt-4 inline-flex">
            <PlusIcon size={16} />
            {t('new')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <Link
                href={`/admin/home-sections/${s.id}`}
                className="admin-card p-4 flex items-center justify-between gap-4 hover:border-ink transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs text-stone tabular-nums shrink-0" dir="ltr">
                    {i + 1}.
                  </span>
                  <span className="text-sm font-medium truncate">
                    {t(TYPE_LABEL_KEYS[s.type] ?? s.type)}
                  </span>
                  {s.is_visible !== 1 ? (
                    <span className="text-xs text-stone border border-line px-1.5 py-0.5 shrink-0">
                      {tCommon('hidden')}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-stone tabular-nums shrink-0" dir="ltr">
                  #{s.sort_order}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
