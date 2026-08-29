'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/admin-client';
import {
  GridIcon,
  BoxIcon,
  LayersIcon,
  SparkleIcon,
  EyeIcon,
  EditIcon,
  FileTextIcon,
  TelegramIcon,
  BagIcon,
  ArrowIcon
} from '@/components/admin/AdminIcons';

/** Primary admin navigation — shared across the dashboard shell. */
export default function AdminSidebar({ storeName }: { storeName: string }) {
  const t = useTranslations('admin.nav');
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const items = [
    { href: '/admin', label: t('dashboard'), icon: GridIcon, exact: true },
    { href: '/admin/products', label: t('products'), icon: BoxIcon },
    { href: '/admin/collections', label: t('collections'), icon: LayersIcon },
    { href: '/admin/home-sections', label: t('homeSections'), icon: SparkleIcon },
    { href: '/admin/lookbook', label: t('lookbook'), icon: EyeIcon },
    { href: '/admin/about', label: t('about'), icon: EditIcon },
    { href: '/admin/policies', label: t('policies'), icon: FileTextIcon },
    { href: '/admin/branding', label: t('branding'), icon: SparkleIcon },
    { href: '/admin/telegram', label: t('telegram'), icon: TelegramIcon },
    { href: '/admin/orders', label: t('orders'), icon: BagIcon }
  ];

  async function logout() {
    setLoggingOut(true);
    try {
      await api.post('/api/admin/logout');
    } catch {
      // Session cookie is cleared server-side best-effort; proceed to login.
    }
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <nav aria-label={t('dashboard')} className="flex flex-col gap-1 lg:h-full">
      <div className="hidden lg:block px-3 pb-4 mb-2 border-b border-line-dark">
        <p className="text-xs uppercase tracking-[0.18em] text-stone">{storeName}</p>
      </div>
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
              active
                ? 'bg-night-soft text-ivory'
                : 'text-stone hover:text-ivory hover:bg-night-soft/60'
            }`}
          >
            <Icon size={16} />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
      <div className="mt-auto pt-4 border-t border-line-dark flex flex-col gap-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 text-sm text-stone hover:text-ivory hover:bg-night-soft/60 transition-colors"
        >
          <ArrowIcon size={16} />
          <span className="whitespace-nowrap">{t('backToStore')}</span>
        </Link>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2 text-sm text-stone hover:text-ivory hover:bg-night-soft/60 transition-colors text-start disabled:opacity-50"
        >
          <span className="w-4 h-4 flex items-center justify-center" aria-hidden="true">
            ⏻
          </span>
          <span className="whitespace-nowrap">{t('logout')}</span>
        </button>
      </div>
    </nav>
  );
}
