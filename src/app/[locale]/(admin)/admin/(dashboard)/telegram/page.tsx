import { getTranslations } from 'next-intl/server';
import { getTelegramState } from '@/lib/server/telegram';
import TelegramForm from '@/components/admin/TelegramForm';

export const dynamic = 'force-dynamic';

export default async function AdminTelegramPage() {
  const t = await getTranslations('admin.telegram');
  const state = getTelegramState();

  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('title')}</h1>
      <TelegramForm state={state} />
    </div>
  );
}
