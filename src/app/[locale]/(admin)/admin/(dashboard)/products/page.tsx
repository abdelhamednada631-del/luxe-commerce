import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listAllProductsForAdmin, parseImageIds } from '@/lib/db/repos/products';
import { getSettings } from '@/lib/db/repos/settings';
import { formatPrice } from '@/lib/format';
import { PlusIcon } from '@/components/ui/Icons';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('admin.products');
  const tCommon = await getTranslations('admin.common');

  const products = listAllProductsForAdmin();
  const settings = getSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display-heading text-3xl">{t('title')}</h1>
        <Link href="/admin/products/new" className="admin-btn">
          <PlusIcon size={16} />
          {t('new')}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="admin-card p-10 text-center">
          <p className="text-sm text-stone">{tCommon('noItems')}</p>
          <Link href="/admin/products/new" className="admin-btn mt-4 inline-flex">
            <PlusIcon size={16} />
            {t('new')}
          </Link>
        </div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-start text-xs text-stone">
                <th className="p-3 text-start font-medium">{t('title')}</th>
                <th className="p-3 text-start font-medium">{t('price')}</th>
                <th className="p-3 text-start font-medium">{t('stock')}</th>
                <th className="p-3 text-start font-medium">{t('status')}</th>
                <th className="p-3 text-start font-medium">{t('sortOrder')}</th>
                <th className="p-3 text-start font-medium" aria-label={t('edit')} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const name = locale === 'ar' ? p.name_ar : p.name_en;
                const cover = parseImageIds(p.image_ids)[0];
                return (
                  <tr key={p.id} className="hover:bg-ivory/60">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/media/${cover}`}
                            alt=""
                            className="w-10 h-12 object-cover border border-line"
                            loading="lazy"
                          />
                        ) : (
                          <span className="w-10 h-12 border border-line bg-ivory inline-block" aria-hidden="true" />
                        )}
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-xs text-stone" dir="ltr">
                            /{p.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 tabular-nums whitespace-nowrap" dir="ltr">
                      {formatPrice(p.price, locale, settings.locale.currencySymbolEn, settings.locale.currencySymbolAr)}
                    </td>
                    <td className="p-3 tabular-nums" dir="ltr">
                      {p.stock === null ? '—' : p.stock}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block border px-2 py-0.5 text-xs ${
                          p.status === 'active'
                            ? 'border-[#cfe3d8] bg-[#eef5f0] text-[#2f6b4f]'
                            : 'border-line bg-ivory text-stone-deep'
                        }`}
                      >
                        {p.status === 'active' ? t('statusActive') : t('statusDraft')}
                      </span>
                    </td>
                    <td className="p-3 tabular-nums" dir="ltr">
                      {p.sort_order}
                    </td>
                    <td className="p-3 text-end">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="admin-btn-secondary !py-1.5 !px-3 text-xs"
                      >
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
