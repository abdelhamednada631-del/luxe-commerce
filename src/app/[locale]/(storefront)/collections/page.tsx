import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { visibleCollections } from '@/lib/db/repos/collections';
import { queryProducts } from '@/lib/db/repos/products';
import { Link } from '@/i18n/navigation';
import Reveal from '@/components/ui/Reveal';
import SmartImage from '@/components/ui/SmartImage';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('collection');
  return { title: t('title') };
}

export default async function CollectionsPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('collection');
  const collections = visibleCollections();

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-16 md:py-24">
      <Reveal className="text-center mb-14 md:mb-20">
        <h1 className="display-heading text-4xl md:text-6xl">{t('title')}</h1>
        <div className="mx-auto mt-6 h-px w-16 bg-accent" aria-hidden="true" />
      </Reveal>

      {collections.length === 0 ? (
        <div className="text-center py-24">
          <p className="display-heading text-2xl mb-3">{t('empty')}</p>
          <p className="text-stone">{t('emptyBody')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {collections.map((c, i) => {
            const count = queryProducts({ collectionSlug: c.slug, limit: 1 }).total;
            return (
              <Reveal key={c.id} delay={i * 70}>
                <Link href={`/collections/${c.slug}`} className="group block">
                  <div className="relative aspect-[4/5] bg-ivory overflow-hidden">
                    <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
                      <SmartImage
                        mediaId={c.image_media_id}
                        alt={locale === 'ar' ? c.name_ar : c.name_en}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-night/50 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                      <h2 className="display-heading text-2xl md:text-3xl">
                        {locale === 'ar' ? c.name_ar : c.name_en}
                      </h2>
                      <p className="text-xs text-ivory/70 mt-1 tracking-wide">
                        {t('productsCount', { count })}
                      </p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
