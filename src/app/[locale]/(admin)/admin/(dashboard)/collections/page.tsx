import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { allCollectionsForAdmin } from '@/lib/db/repos/collections';
import { collectionProductIds } from '@/lib/db/repos/collections';
import { PlusIcon } from '@/components/ui/Icons';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function AdminCollectionsPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('admin.collections');
  const tCommon = await getTranslations('admin.common');

  const collections = allCollectionsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display-heading text-3xl">{t('title')}</h1>
        <Link href="/admin/collections/new" className="admin-btn">
          <PlusIcon size={16} />
          {t('new')}
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="admin-card p-10 text-center">
          <p className="text-sm text-stone">{tCommon('noItems')}</p>
          <Link href="/admin/collections/new" className="admin-btn mt-4 inline-flex">
            <PlusIcon size={16} />
            {t('new')}
          </Link>
        </div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-stone">
                <th className="p-3 text-start font-medium">{t('title')}</th>
                <th className="p-3 text-start font-medium">{t('products')}</th>
                <th className="p-3 text-start font-medium">{tCommon('visible')}</th>
                <th className="p-3 text-start font-medium">{t('sortOrder')}</th>
                <th className="p-3 text-start font-medium" aria-label={t('edit')} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {collections.map((c) => {
                const name = locale === 'ar' ? c.name_ar : c.name_en;
                return (
                  <tr key={c.id} className="hover:bg-ivory/60">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {c.image_media_id ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/media/${c.image_media_id}`}
                            alt=""
                            className="w-12 h-12 object-cover border border-line"
                            loading="lazy"
                          />
                        ) : (
                          <span className="w-12 h-12 border border-line bg-ivory inline-block" aria-hidden="true" />
                        )}
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-xs text-stone" dir="ltr">
                            /{c.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 tabular-nums" dir="ltr">
                      {collectionProductIds(c.id).length}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block border px-2 py-0.5 text-xs ${
                          c.is_visible === 1
                            ? 'border-[#cfe3d8] bg-[#eef5f0] text-[#2f6b4f]'
                            : 'border-line bg-ivory text-stone-deep'
                        }`}
                      >
                        {c.is_visible === 1 ? tCommon('visible') : tCommon('hidden')}
                      </span>
                    </td>
                    <td className="p-3 tabular-nums" dir="ltr">
                      {c.sort_order}
                    </td>
                    <td className="p-3 text-end">
                      <Link href={`/admin/collections/${c.id}`} className="admin-btn-secondary !py-1.5 !px-3 text-xs">
                        {t('edit')}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
