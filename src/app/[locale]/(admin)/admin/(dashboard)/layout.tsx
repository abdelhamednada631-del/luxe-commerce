import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { isAuthenticated } from '@/lib/server/auth';
import { getSettings } from '@/lib/db/repos/settings';
import type { Locale } from '@/i18n/routing';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

/** The admin dashboard must never be indexed, even if a URL leaks publicly. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Admin shell — dark sidebar + content area. Every /admin/* page except
 * /admin/login renders inside this layout and is auth-guarded here.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;

  // The login page lives outside this guard via its own route group segment.
  if (!(await isAuthenticated())) {
    redirect({ href: '/admin/login', locale });
  }

  const settings = getSettings();
  const storeName = locale === 'ar' ? settings.branding.storeNameAr : settings.branding.storeNameEn;
  const t = await getTranslations({ namespace: 'admin.nav' });

  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[240px_1fr]">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-20 bg-night text-ivory">
        <div className="flex items-center justify-between px-4 h-14">
          <p className="text-xs uppercase tracking-[0.18em]">{storeName}</p>
          <details className="relative">
            <summary
              className="list-none cursor-pointer text-sm px-3 py-1.5 border border-line-dark"
              aria-label={t('dashboard')}
            >
              ☰
            </summary>
            <div className="absolute end-0 mt-2 w-56 bg-night border border-line-dark p-3">
              <AdminSidebar storeName={storeName} />
            </div>
          </details>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col bg-night text-ivory p-4 sticky top-0 h-screen">
        <AdminSidebar storeName={storeName} />
      </aside>

      <main className="p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}
