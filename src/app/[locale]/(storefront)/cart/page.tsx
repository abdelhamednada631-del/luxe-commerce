import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getSettings } from '@/lib/db/repos/settings';
import CartView from '@/components/storefront/cart/CartView';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cart');
  return { title: t('title') };
}

export default async function CartPage() {
  const t = await getTranslations('cart');
  const settings = getSettings();

  return (
    <div>
      <header className="bg-ivory/60">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-16 md:py-24 text-center">
          <h1 className="display-heading text-4xl md:text-5xl">{t('title')}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-12 md:py-16">
        <CartView
          currency={{ en: settings.locale.currencySymbolEn, ar: settings.locale.currencySymbolAr }}
          shipping={{ flatFee: settings.shipping.flatFee, freeOverThreshold: settings.shipping.freeOverThreshold }}
        />
      </div>
    </div>
  );
}
