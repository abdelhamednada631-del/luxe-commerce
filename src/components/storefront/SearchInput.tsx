'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/ui/Icons';

/**
 * Search field — updates the ?q= search param (server-rendered results).
 * Debounced so typing stays calm; instant clear button.
 */
export default function SearchInput({ initialQuery }: { initialQuery: string }) {
  const t = useTranslations('search');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const timer = useRef<number | undefined>(undefined);

  // Keep field in sync when the URL changes (locale switch, clear)
  useEffect(() => {
    setValue(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    window.clearTimeout(timer.current);
    const trimmed = value.trim();
    if (trimmed === (searchParams.get('q') || '').trim()) return;
    timer.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (trimmed) params.set('q', trimmed);
      else params.delete('q');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full">
      <span className="absolute start-0 top-1/2 -translate-y-1/2 text-stone" aria-hidden="true">
        <SearchIcon size={18} />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('placeholder')}
        aria-label={t('title')}
        autoComplete="off"
        className="field !ps-8"
      />
    </div>
  );
}
