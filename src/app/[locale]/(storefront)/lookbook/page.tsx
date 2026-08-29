import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { visibleLookbook } from '@/lib/db/repos/content';
import Reveal from '@/components/ui/Reveal';
import SmartImage from '@/components/ui/SmartImage';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('lookbook');
  return { title: t('title') };
}

export default async function LookbookPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('lookbook');
  const items = visibleLookbook();

  return (
    <div>
      <header className="bg-night text-ivory">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-16 md:py-24 text-center">
          <h1 className="display-heading text-4xl md:text-6xl">{t('title')}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-12 md:py-16">
        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="display-heading text-2xl mb-3">{t('empty')}</p>
            <p className="text-stone">{t('emptyBody')}</p>
          </div>
        ) : (
          /* Editorial masonry — CSS columns keep the rhythm calm and asymmetric */
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 [&>*]:mb-4 md:[&>*]:mb-6">
            {items.map((item, i) => {
              const title = locale === 'ar' ? item.title_ar : item.title_en;
              const subtitle = locale === 'ar' ? item.subtitle_ar : item.subtitle_en;
              const hasCaption = !!(title || subtitle);
              const hasLink = !!item.link_url;

              const figure = (
                <figure className="group relative break-inside-avoid overflow-hidden bg-ivory">
                  <div className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]">
                    <SmartImage
                      mediaId={item.image_media_id}
                      alt={title || t('title')}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      imgClassName="object-cover"
                      className="w-full"
                      priority={i < 3}
                    />
                  </div>
                  {hasCaption && (
                    <figcaption className="absolute inset-0 flex flex-col items-center justify-center text-center bg-night/0 group-hover:bg-night/35 transition-colors duration-500">
                      <div className="opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 px-6">
                        {title && (
                          <p className="display-heading text-ivory text-2xl md:text-3xl">{title}</p>
                        )}
                        {subtitle && <p className="mt-2 text-ivory/80 text-sm">{subtitle}</p>}
                      </div>
                    </figcaption>
                  )}
                </figure>
              );

              return (
                <Reveal key={item.id} delay={Math.min(i, 6) * 60}>
                  {hasLink ? (
                    <Link href={item.link_url!} className="block" aria-label={title || t('title')}>
                      {figure}
                    </Link>
                  ) : (
                    figure
                  )}
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
