import { getLocale } from 'next-intl/server';
import Header from '@/components/storefront/Header';
import Footer, { type FooterData } from '@/components/storefront/Footer';
import { getSettings } from '@/lib/db/repos/settings';
import { visibleCollections } from '@/lib/db/repos/collections';
import { visiblePolicies } from '@/lib/db/repos/content';
import type { Locale } from '@/i18n/routing';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  const settings = getSettings();
  const collections = visibleCollections();
  const policies = visiblePolicies();

  const storeName = locale === 'ar' ? settings.branding.storeNameAr : settings.branding.storeNameEn;

  const footerData: FooterData = {
    storeName,
    logoMediaId: settings.branding.logoMediaId,
    social: Object.entries(settings.social)
      .filter(([, url]) => url)
      .map(([key, url]) => ({ key, url })),
    contact: {
      phone: settings.contact.phone,
      whatsapp: settings.contact.whatsapp,
      email: settings.contact.email,
      address: locale === 'ar' ? settings.contact.addressAr : settings.contact.addressEn
    },
    policies: policies.map((p) => ({
      key: p.key,
      title: locale === 'ar' ? p.title_ar : p.title_en
    }))
  };

  return (
    <>
      <Header
        storeName={storeName}
        collections={collections.map((c) => ({
          slug: c.slug,
          name: locale === 'ar' ? c.name_ar : c.name_en
        }))}
        locale={locale}
      />
      <main id="main-content" className="pt-16 md:pt-20">
        {children}
      </main>
      <Footer data={footerData} />
    </>
  );
}
