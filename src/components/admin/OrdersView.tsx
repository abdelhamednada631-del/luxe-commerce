'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/admin-client';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import { TelegramIcon } from '@/components/ui/Icons';
import type { Locale } from '@/i18n/routing';

export interface AdminOrderItem {
  productId: number;
  nameEn: string;
  nameAr: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
}

export interface AdminOrder {
  id: number;
  order_number: number;
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  address_details: string;
  notes: string | null;
  items: AdminOrderItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: 'pending' | 'delivered' | 'failed';
  telegram_error: string | null;
  attempts: number;
  last_attempt_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

/** Orders list with expandable details + manual Telegram resend. */
export default function OrdersView({
  orders,
  locale,
  currencySymbolEn,
  currencySymbolAr
}: {
  orders: AdminOrder[];
  locale: Locale;
  currencySymbolEn: string;
  currencySymbolAr: string;
}) {
  const t = useTranslations('admin.orders');
  const router = useRouter();

  const [openId, setOpenId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  function money(minor: number): string {
    const value = minor / 100;
    const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    }).format(value);
    return `${formatted} ${locale === 'ar' ? currencySymbolAr : currencySymbolEn}`;
  }

  async function handleResend(order: AdminOrder) {
    setNotice(null);
    setResendingId(order.id);
    try {
      await api.post(`/api/admin/orders/${order.id}/resend`);
      setNotice({ kind: 'ok', text: t('resendOk') });
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'rate_limited') {
          setNotice({ kind: 'err', text: t('resendFail', { error: `${err.retryAfterSeconds ?? 60}s` }) });
        } else {
          setNotice({ kind: 'err', text: t('resendFail', { error: err.detail ?? err.code }) });
        }
      } else {
        setNotice({ kind: 'err', text: t('resendFail', { error: 'network' }) });
      }
    } finally {
      setResendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <p role="status" className={`text-sm ${notice.kind === 'ok' ? 'text-[#2f6b4f]' : 'text-[#8c2f2f]'}`}>
          {notice.text}
        </p>
      ) : null}

      <ul className="space-y-3">
        {orders.map((order) => {
          const open = openId === order.id;
          return (
            <li key={order.id} className="admin-card">
              {/* Row summary */}
              <div className="flex flex-wrap items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : order.id)}
                  aria-expanded={open}
                  className="flex flex-1 min-w-0 items-center gap-3 text-start"
                >
                  <span className="text-sm font-medium tabular-nums shrink-0" dir="ltr">
                    #{order.order_number}
                  </span>
                  <span className="text-sm text-stone-deep truncate">{order.customer_name}</span>
                  <span className="text-xs text-stone shrink-0" dir="ltr">
                    {order.created_at}
                  </span>
                </button>
                <OrderStatusBadge status={order.status} />
                <span className="text-sm tabular-nums shrink-0" dir="ltr">
                  {money(order.total)}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : order.id)}
                  className="admin-btn-secondary !py-1.5 !px-3 text-xs shrink-0"
                  aria-expanded={open}
                >
                  {open ? t('closeDetails') : t('viewDetails')}
                </button>
              </div>

              {/* Expanded details */}
              {open ? (
                <div className="border-t border-line p-4 space-y-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="admin-label">{t('customer')}</p>
                      <p>{order.customer_name}</p>
                    </div>
                    <div>
                      <p className="admin-label">{t('phone')}</p>
                      <p dir="ltr">{order.phone}</p>
                    </div>
                    <div>
                      <p className="admin-label">{t('governorate')}</p>
                      <p>{order.governorate}</p>
                    </div>
                    <div>
                      <p className="admin-label">{t('city')}</p>
                      <p>{order.city}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="admin-label">{t('address')}</p>
                      <p>{order.address_details}</p>
                    </div>
                    {order.notes ? (
                      <div>
                        <p className="admin-label">{t('notes')}</p>
                        <p>{order.notes}</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Items */}
                  <div>
                    <p className="admin-label">{t('items')}</p>
                    <ul className="mt-1 divide-y divide-line border border-line">
                      {order.items.map((item, i) => (
                        <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                          <div>
                            <p>{locale === 'ar' ? item.nameAr : item.nameEn}</p>
                            {item.variantLabel ? (
                              <p className="text-xs text-stone">{item.variantLabel}</p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-4 tabular-nums" dir="ltr">
                            <span>×{item.quantity}</span>
                            <span>{money(item.unitPrice * item.quantity)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Totals + delivery info */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="text-sm space-y-1 tabular-nums" dir="ltr">
                      <p>
                        {t('total')}: <b>{money(order.total)}</b>{' '}
                        <span className="text-stone">
                          ({money(order.subtotal)} + {money(order.shipping_fee)})
                        </span>
                      </p>
                      <p className="text-xs text-stone">
                        {t('attempts')}: {order.attempts}
                        {order.last_attempt_at ? ` · ${t('lastAttempt')}: ${order.last_attempt_at}` : ''}
                      </p>
                      {order.telegram_error ? (
                        <p className="text-xs text-[#8c2f2f]">{order.telegram_error}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResend(order)}
                      disabled={resendingId !== null}
                      className="admin-btn"
                    >
                      <TelegramIcon size={14} />
                      {resendingId === order.id ? t('resending') : t('resend')}
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
