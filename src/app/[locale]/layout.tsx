import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Cormorant_Garamond, Amiri, Jost, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { routing, LOCALE_DIRECTIONS } from '@/i18n/routing';
import { getSettings } from '@/lib/db/repos/settings';
import { getSiteUrl } from '@/lib/server/site-url';

/** Coherent bilingual pairing: serif display + humanist sans, EN ↔ AR. */
const displayEn = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display-en'
});

const displayAr = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-display-ar'
});

const bodyEn = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body-en'
});

const bodyAr = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500'],
  variable: '--font-body-ar'
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  const locale = await getLocale();
  const storeName = locale === 'ar' ? settings.branding.storeNameAr : settings.branding.storeNameEn;
  const t = await getTranslations({ namespace: 'meta' });

  const base = await getSiteUrl();

  return {
    title: {
      default: t('title', { storeName }),
      template: `%s — ${storeName}`
    },
    description: t('description', { storeName }),
    metadataBase: new URL(base),
    ...(settings.branding.faviconMediaId
      ? { icons: { icon: `/api/media/${settings.branding.faviconMediaId}` } }
      : {}),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`]))
    },
    openGraph: {
      title: t('title', { storeName }),
      description: t('description', { storeName }),
      locale,
      type: 'website'
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as never)) notFound();

  const settings = getSettings();
  // next-intl v3 does NOT auto-inherit messages into the client provider —
  // they must be passed explicitly or client components render raw keys.
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={LOCALE_DIRECTIONS[locale as keyof typeof LOCALE_DIRECTIONS]}
      className={`${displayEn.variable} ${displayAr.variable} ${bodyEn.variable} ${bodyAr.variable}`}
      style={{ ['--accent' as string]: settings.theme.accentColor }}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
