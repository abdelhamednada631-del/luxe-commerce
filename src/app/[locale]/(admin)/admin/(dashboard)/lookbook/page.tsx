import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { allLookbookForAdmin } from '@/lib/db/repos/content';
import { PlusIcon } from '@/components/ui/Icons';

export const dynamic = 'force-dynamic';

export default async function AdminLookbookPage() {
  const t = await getTranslations('admin.lookbook');
  const tCommon = await getTranslations('admin.common');

  const items = allLookbookForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display-heading text-3xl">{t('title')}</h1>
        <Link href="/admin/lookbook/new" className="admin-btn">
          <PlusIcon size={16} />
          {t('new')}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="admin-card p-10 text-center">
          <p className="text-sm text-stone">{tCommon('noItems')}</p>
          <Link href="/admin/lookbook/new" className="admin-btn mt-4 inline-flex">
            <PlusIcon size={16} />
            {t('new')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/lookbook/${item.id}`}
              className="admin-card overflow-hidden group hover:border-ink transition-colors"
            >
              <div className="relative aspect-[3/4] bg-ivory">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/media/${item.image_media_id}`}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {item.is_visible !== 1 ? (
                  <span className="absolute top-2 start-2 bg-night/80 text-ivory text-[10px] px-1.5 py-0.5">
                    {tCommon('hidden')}
                  </span>
                ) : null}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{item.title_en ?? item.title_ar ?? '—'}</p>
                <p className="text-xs text-stone tabular-nums" dir="ltr">
                  #{item.sort_order}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
