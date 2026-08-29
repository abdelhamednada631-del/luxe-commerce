import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getPolicy } from '@/lib/db/repos/content';
import Reveal from '@/components/ui/Reveal';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const VALID_KEYS = ['shipping', 'returns', 'privacy', 'terms'] as const;
type PolicyKey = (typeof VALID_KEYS)[number];

interface Props {
  params: Promise<{ key: string }>;
}

function isPolicyKey(key: string): key is PolicyKey {
  return (VALID_KEYS as readonly string[]).includes(key);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  if (!isPolicyKey(key)) return { title: 'Not found' };
  const policy = getPolicy(key);
  if (!policy || !policy.is_visible) return { title: 'Not found' };
  const locale = (await getLocale()) as Locale;
  return { title: locale === 'ar' ? policy.title_ar : policy.title_en };
}

export default async function PolicyPage({ params }: Props) {
  const { key } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('policies');

  if (!isPolicyKey(key)) notFound();
  const policy = getPolicy(key);
  if (!policy || !policy.is_visible) notFound();

  const title = locale === 'ar' ? policy.title_ar : policy.title_en;
  const body = locale === 'ar' ? policy.body_ar : policy.body_en;

  return (
    <div>
      <header className="bg-ivory/60">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-16 md:py-24 text-center">
          <h1 className="display-heading text-4xl md:text-5xl">{title}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 md:px-8 py-12 md:py-20">
        <Reveal>
          {body ? (
            <div className="text-sm md:text-base leading-loose text-stone-deep whitespace-pre-line">
              {body}
            </div>
          ) : (
            <p className="text-center text-stone">{t('empty')}</p>
          )}
        </Reveal>
      </div>
    </div>
  );
}
