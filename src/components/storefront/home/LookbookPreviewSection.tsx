import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Reveal from '@/components/ui/Reveal';
import SmartImage from '@/components/ui/SmartImage';
import type { Locale } from '@/i18n/routing';
import type { LookbookRow } from '@/lib/db/repos/content';

interface Config {
  titleEn?: string;
  titleAr?: string;
  limit?: number;
}

export default async function LookbookPreviewSection({
  config,
  locale,
  lookbookItems,
  fallbackTitle
}: {
  config: Record<string, unknown>;
  locale: Locale;
  lookbookItems: (limit: number) => LookbookRow[];
  fallbackTitle: string;
}) {
  const t = await getTranslations('common');
  const c = config as Config;
  const title = (locale === 'ar' ? c.titleAr : c.titleEn) || fallbackTitle;
  const items = lookbookItems(c.limit ?? 4);

  if (items.length === 0) return null;

  return (
    <section className="bg-night text-ivory py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="text-center mb-12 md:mb-16">
          <h2 className="display-heading text-3xl md:text-5xl">{title}</h2>
          <div className="mx-auto mt-6 h-px w-16 bg-accent" aria-hidden="true" />
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {items.map((item, i) => {
            const itemTitle = locale === 'ar' ? item.title_ar : item.title_en;
            const subtitle = locale === 'ar' ? item.subtitle_ar : item.subtitle_en;
            const inner = (
              <>
                <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]">
                  <SmartImage mediaId={item.image_media_id} alt={itemTitle ?? ''} sizes="(max-width: 640px) 50vw, 25vw" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {(itemTitle || subtitle) && (
                  <div className="absolute inset-x-0 bottom-0 p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    {itemTitle && <p className="display-heading text-xl">{itemTitle}</p>}
                    {subtitle && <p className="text-xs text-ivory/70 mt-1">{subtitle}</p>}
                  </div>
                )}
              </>
            );
            return (
              <Reveal key={item.id} delay={i * 60}>
                {item.link_url ? (
                  <a
                    href={item.link_url}
                    className="group relative block aspect-[3/4] bg-night-soft overflow-hidden"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="group relative aspect-[3/4] bg-night-soft overflow-hidden">{inner}</div>
                )}
              </Reveal>
            );
          })}
        </div>
        <Reveal className="text-center mt-14">
          <Link
            href="/lookbook"
            className="inline-flex items-center gap-3 border border-ivory/60 text-ivory px-10 py-4 text-[0.72rem] uppercase tracking-[0.22em] hover:bg-ivory hover:text-night transition-all duration-500"
          >
            {t('viewAll')}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
