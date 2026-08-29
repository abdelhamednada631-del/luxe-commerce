'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';

/** Sort control — updates the ?sort= search param. */
export default function CollectionToolbar({
  collectionSlug,
  currentSort
}: {
  collectionSlug: string;
  currentSort: string;
}) {
  const t = useTranslations('collection');
  const router = useRouter();
  const pathname = usePathname();

  const options = [
    { value: 'default', label: t('sortDefault') },
    { value: 'newest', label: t('sortNewest') },
    { value: 'price-asc', label: t('sortPriceAsc') },
    { value: 'price-desc', label: t('sortPriceDesc') }
  ];

  return (
    <div className="flex items-center justify-end mb-10">
      <label htmlFor="collection-sort" className="sr-only">
        {t('sortBy')}
      </label>
      <select
        id="collection-sort"
        value={currentSort}
        onChange={(e) => router.push(`${pathname}?sort=${e.target.value}`)}
        className="field !w-auto text-sm cursor-pointer border border-line px-4 py-2.5"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
