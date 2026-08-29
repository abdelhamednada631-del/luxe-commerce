import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listAllProductsForAdmin } from '@/lib/db/repos/products';
import { allCollectionsForAdmin } from '@/lib/db/repos/collections';
import { listOrdersForAdmin, orderStatusCounts } from '@/lib/db/repos/orders';
import { getTelegramState } from '@/lib/server/telegram';
import { getSettings } from '@/lib/db/repos/settings';
import { formatPrice } from '@/lib/format';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import { CheckIcon, TelegramIcon } from '@/components/ui/Icons';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('admin.dashboard');
  const tOrders = await getTranslations('admin.orders');

  const products = listAllProductsForAdmin();
  const collections = allCollectionsForAdmin();
  const orderCounts = orderStatusCounts();
  const telegram = getTelegramState();
  const recentOrders = listOrdersForAdmin(5);
  const settings = getSettings();

  const stats = [
    { label: t('products'), value: products.length, sub: t('activeProducts', { count: products.filter((p) => p.status === 'active').length }) },
    { label: t('collections'), value: collections.length, sub: '' },
    { label: t('orders'), value: orderCounts.total, sub: '' },
    { label: t('pendingOrders'), value: orderCounts.pending, sub: '' },
    { label: t('deliveredOrders'), value: orderCounts.delivered, sub: '' },
    { label: t('failedOrders'), value: orderCounts.failed, sub: '' }
  ];

  const setupSteps = [
    { done: telegram.isConfigured, label: t('step1'), href: '/admin/telegram' },
    { done: products.length > 0, label: t('step2'), href: '/admin/products' },
    { done: collections.length > 0, label: t('step3'), href: '/admin/collections' },
    { done: false, label: t('step4'), href: '/admin/branding' }
  ];

  return (
    <div className="space-y-8">
      <h1 className="display-heading text-3xl">{t('title')}</h1>

      {/* Telegram status banner */}
      <div
        className={`admin-card p-4 flex flex-wrap items-center justify-between gap-3 ${
          telegram.isConfigured ? '' : 'border-[#e0c9a8]'
        }`}
      >
        <div className="flex items-center gap-3">
          <TelegramIcon size={20} className={telegram.isConfigured ? 'text-[#2f6b4f]' : 'text-stone'} />
          <div>
            <p className="text-sm font-medium">{t('telegramStatus')}</p>
            <p className={`text-xs ${telegram.isConfigured ? 'text-[#2f6b4f]' : 'text-[#8c6a2f]'}`}>
              {telegram.isConfigured ? t('telegramConfigured') : t('telegramNotConfigured')}
            </p>
          </div>
        </div>
        {!telegram.isConfigured ? (
          <Link href="/admin/telegram" className="admin-btn">
            {t('telegramCta')}
          </Link>
        ) : null}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="admin-card p-4">
            <p className="text-xs text-stone">{s.label}</p>
            <p className="mt-1 text-2xl font-medium tabular-nums" dir="ltr">
              {s.value}
            </p>
            {s.sub ? <p className="mt-0.5 text-xs text-stone">{s.sub}</p> : null}
          </div>
        ))}
      </div>

      {/* Getting-started checklist (hidden once everything is done) */}
      {setupSteps.some((s) => !s.done) ? (
        <div className="admin-card p-5">
          <h2 className="text-sm font-medium mb-3">{t('setupSteps')}</h2>
          <ul className="space-y-2">
            {setupSteps.map((step) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  className="flex items-center gap-3 text-sm text-stone-deep hover:text-ink transition-colors"
                >
                  <span
                    className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                      step.done ? 'border-[#2f6b4f] bg-[#eef5f0] text-[#2f6b4f]' : 'border-line'
                    }`}
                    aria-hidden="true"
                  >
                    {step.done ? <CheckIcon size={12} /> : null}
                  </span>
                  <span className={step.done ? 'line-through opacity-60' : ''}>{step.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Recent orders */}
      <div className="admin-card">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-sm font-medium">{t('recentOrders')}</h2>
          <Link href="/admin/orders" className="text-xs text-stone-deep hover:text-ink underline underline-offset-4">
            {tOrders('title')}
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="p-5 pt-0 text-sm text-stone">{t('noOrders')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium tabular-nums" dir="ltr">
                    #{order.order_number}
                  </span>
                  <span className="text-sm text-stone-deep">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums" dir="ltr">
                    {formatPrice(order.total, locale, settings.locale.currencySymbolEn, settings.locale.currencySymbolAr)}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
