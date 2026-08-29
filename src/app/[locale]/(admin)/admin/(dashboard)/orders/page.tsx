import { getLocale, getTranslations } from 'next-intl/server';
import { listOrdersForAdmin, parseOrderItems } from '@/lib/db/repos/orders';
import { getSettings } from '@/lib/db/repos/settings';
import OrdersView from '@/components/admin/OrdersView';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('admin.orders');
  const settings = getSettings();

  const orders = listOrdersForAdmin().map((o) => ({
    id: o.id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    phone: o.phone,
    governorate: o.governorate,
    city: o.city,
    address_details: o.address_details,
    notes: o.notes,
    items: parseOrderItems(o.items),
    subtotal: o.subtotal,
    shipping_fee: o.shipping_fee,
    total: o.total,
    status: o.status,
    telegram_error: o.telegram_error,
    attempts: o.attempts,
    last_attempt_at: o.last_attempt_at,
    delivered_at: o.delivered_at,
    created_at: o.created_at
  }));

  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('title')}</h1>
      {orders.length === 0 ? (
        <div className="admin-card p-10 text-center">
          <p className="text-sm text-stone">{t('noOrders')}</p>
        </div>
      ) : (
        <OrdersView
          orders={orders}
          locale={locale}
          currencySymbolEn={settings.locale.currencySymbolEn}
          currencySymbolAr={settings.locale.currencySymbolAr}
        />
      )}
    </div>
  );
}
