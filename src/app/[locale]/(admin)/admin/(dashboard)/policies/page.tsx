import { getTranslations } from 'next-intl/server';
import { ensurePolicies, allPoliciesForAdmin } from '@/lib/db/repos/content';
import PoliciesEditor from '@/components/admin/PoliciesEditor';

export const dynamic = 'force-dynamic';

export default async function AdminPoliciesPage() {
  const t = await getTranslations('admin.policies');

  ensurePolicies();
  const policies = allPoliciesForAdmin().map((p) => ({
    key: p.key,
    titleEn: p.title_en,
    titleAr: p.title_ar,
    bodyEn: p.body_en,
    bodyAr: p.body_ar,
    isVisible: p.is_visible === 1
  }));

  return (
    <div className="space-y-6">
      <h1 className="display-heading text-3xl">{t('title')}</h1>
      <PoliciesEditor policies={policies} />
    </div>
  );
}
