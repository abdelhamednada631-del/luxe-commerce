import { redirect } from 'next/navigation';
import { getSettings } from '@/lib/db/repos/settings';

/**
 * Bare root — redirects to the admin-configured default locale.
 * (Decision made in Node runtime because it reads the SQLite store.)
 */
export default async function RootPage() {
  const settings = getSettings();
  redirect(`/${settings.locale.defaultLocale}`);
}
