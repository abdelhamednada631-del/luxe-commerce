import { useTranslations } from 'next-intl';

/** Small status pill for order states (pending / delivered / failed). */
export default function OrderStatusBadge({ status }: { status: 'pending' | 'delivered' | 'failed' }) {
  const t = useTranslations('admin.orders');
  const styles: Record<typeof status, string> = {
    pending: 'border-line bg-ivory text-stone-deep',
    delivered: 'border-[#cfe3d8] bg-[#eef5f0] text-[#2f6b4f]',
    failed: 'border-[#e5cfcf] bg-[#faf1f1] text-[#8c2f2f]'
  };
  const labels: Record<typeof status, string> = {
    pending: t('statusPending'),
    delivered: t('statusDelivered'),
    failed: t('statusFailed')
  };
  return (
    <span className={`inline-block border px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
