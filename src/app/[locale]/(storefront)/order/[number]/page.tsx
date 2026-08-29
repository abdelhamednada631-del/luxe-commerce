import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { orderByNumber } from '@/lib/db/repos/orders';
import { Link } from '@/i18n/navigation';
import { CheckIcon, AlertIcon } from '@/components/ui/Icons';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ number: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params;
  const t = await getTranslations('order');
  return { title: `${t('orderNumber')} #${number}` };
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { number } = await params;
  const t = await getTranslations('order');
  const tCommon = await getTranslations('common');
  await getLocale();

  const orderNumber = Number(number);
  if (!Number.isInteger(orderNumber) || orderNumber < 10001) notFound();

  const order = orderByNumber(orderNumber);
  if (!order) notFound();

  const isDelivered = order.status === 'delivered';
  const isPending = order.status === 'pending';

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-8 py-20 md:py-32 text-center">
      {/* Status mark */}
      <div
        aria-hidden="true"
        className={`mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full ${
          isDelivered ? 'bg-accent/10 text-accent' : 'bg-porcelain text-stone-deep'
        }`}
      >
        {isDelivered ? <CheckIcon size={28} /> : <AlertIcon size={28} />}
      </div>

      <h1 className="display-heading text-3xl md:text-5xl mb-4">
        {isDelivered ? t('successTitle') : isPending ? t('pendingTitle') : t('failedTitle')}
      </h1>

      <p className="text-stone-deep leading-relaxed max-w-md mx-auto mb-8">
        {isDelivered
          ? t('successBody', { name: order.customer_name })
          : isPending
            ? t('pendingBody')
            : t('failedBody')}
      </p>

      {/* Order number — the customer's reference */}
      <div className="inline-flex items-baseline gap-3 border border-line bg-ivory/40 px-8 py-4 mb-10">
        <span className="field-label !mb-0">{t('orderNumber')}</span>
        <span className="display-heading text-2xl tabular-nums" dir="ltr">
          #{order.order_number}
        </span>
      </div>

      <div>
        <Link href="/collections" className="btn-luxe">
          {t('continueShopping')}
        </Link>
      </div>
    </div>
  );
}
