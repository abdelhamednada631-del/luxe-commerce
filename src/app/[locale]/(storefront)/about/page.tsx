import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getAboutPage } from '@/lib/db/repos/content';
import Reveal from '@/components/ui/Reveal';
import SmartImage from '@/components/ui/SmartImage';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const about = getAboutPage();
  const locale = (await getLocale()) as Locale;
  return { title: locale === 'ar' ? about.title_ar : about.title_en };
}

export default async function AboutPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('about');
  const about = getAboutPage();

  const title = locale === 'ar' ? about.title_ar : about.title_en;
  const body = locale === 'ar' ? about.body_ar : about.body_en;
  let images: number[] = [];
  try {
    const parsed = JSON.parse(about.image_ids);
    if (Array.isArray(parsed)) images = parsed.filter((n: unknown) => typeof n === 'number');
  } catch {
    images = [];
  }

  const hasContent = !!(body || images.length > 0);
  const [leadImage, ...restImages] = images;

  return (
    <div>
      <header className="bg-ivory/60">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-16 md:py-24 text-center">
          <h1 className="display-heading text-4xl md:text-6xl">{title}</h1>
        </div>
      </header>

      {!hasContent ? (
        <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-24 text-center">
          <p className="display-heading text-2xl">{t('empty')}</p>
        </div>
      ) : (
        <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-12 md:py-20">
          {/* Editorial split: lead image + measured text column */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {leadImage ? (
              <Reveal>
                <div className="relative aspect-[4/5] bg-ivory overflow-hidden">
                  <SmartImage
                    mediaId={leadImage}
                    alt={title}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              </Reveal>
            ) : (
              <div className="hidden lg:block" aria-hidden="true" />
            )}

            <Reveal delay={100}>
              <div className="lg:pt-8 max-w-xl">
                {body && (
                  <p className="text-base md:text-lg leading-loose text-stone-deep whitespace-pre-line">
                    {body}
                  </p>
                )}
              </div>
            </Reveal>
          </div>

          {/* Remaining images — quiet two/three-column rhythm */}
          {restImages.length > 0 && (
            <div className="mt-12 md:mt-20 grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {restImages.map((id, i) => (
                <Reveal key={id} delay={Math.min(i, 6) * 60}>
                  <div className="relative aspect-[3/4] bg-ivory overflow-hidden">
                    <SmartImage
                      mediaId={id}
                      alt=""
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
