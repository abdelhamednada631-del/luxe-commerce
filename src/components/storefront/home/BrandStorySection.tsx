import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Reveal from '@/components/ui/Reveal';
import SmartImage from '@/components/ui/SmartImage';
import type { Locale } from '@/i18n/routing';

interface Config {
  titleEn?: string;
  titleAr?: string;
  bodyEn?: string;
  bodyAr?: string;
  imageMediaId?: number | null;
}

export default async function BrandStorySection({
  config,
  locale
}: {
  config: Record<string, unknown>;
  locale: Locale;
}) {
  const t = await getTranslations('home');
  const c = config as Config;
  const title = locale === 'ar' ? c.titleAr : c.titleEn;
  const body = locale === 'ar' ? c.bodyAr : c.bodyEn;

  if (!title && !body && !c.imageMediaId) return null;

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {c.imageMediaId && (
          <Reveal>
            <div className="relative aspect-[4/5] bg-ivory overflow-hidden">
              <SmartImage mediaId={c.imageMediaId} alt={title ?? ''} sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          </Reveal>
        )}
        <Reveal delay={100} className={c.imageMediaId ? '' : 'lg:col-span-2 text-center'}>
          <p className="eyebrow mb-4">{t('ourStory')}</p>
          {title && <h2 className="display-heading text-3xl md:text-5xl mb-6">{title}</h2>}
          {body && <p className="text-stone-deep leading-loose max-w-xl mx-auto whitespace-pre-line">{body}</p>}
          <Link href="/about" className="link-luxe inline-block mt-8 text-xs uppercase tracking-[0.18em] font-medium">
            <span className={locale === 'ar' ? 'text-sm normal-case tracking-normal' : ''}>{t('readStory')}</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
