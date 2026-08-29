import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { isAuthenticated } from '@/lib/server/auth';
import type { Locale } from '@/i18n/routing';
import LoginForm from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations({ namespace: 'admin.login' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function AdminLoginPage() {
  // Already signed in → straight to the dashboard.
  if (await isAuthenticated()) {
    const locale = (await getLocale()) as Locale;
    redirect({ href: '/admin', locale });
  }
  const t = await getTranslations({ namespace: 'admin.login' });

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-sm">
        <h1 className="display-heading text-center text-3xl">{t('title')}</h1>
        <div className="mt-8 border border-line bg-porcelain p-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
