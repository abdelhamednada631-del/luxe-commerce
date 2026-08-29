import { getTranslations } from 'next-intl/server';
import HeroSection from './HeroSection';
import FeaturedProductsSection from './FeaturedProductsSection';
import CollectionHighlightSection from './CollectionHighlightSection';
import NewArrivalsSection from './NewArrivalsSection';
import LookbookPreviewSection from './LookbookPreviewSection';
import BrandStorySection from './BrandStorySection';
import PromoBannerSection from './PromoBannerSection';
import type { Locale } from '@/i18n/routing';
import type { ProductRow } from '@/lib/db/repos/products';
import type { LookbookRow, HomeSectionRow } from '@/lib/db/repos/content';
import type { CollectionRow } from '@/lib/db/repos/collections';

export interface SectionProps {
  id: number;
  type: string;
  config: Record<string, unknown>;
}

interface RendererProps {
  sections: SectionProps[];
  locale: Locale;
  currency: { en: string; ar: string };
  resolveProducts: (ids: number[]) => ProductRow[];
  newArrivals: (limit: number) => ProductRow[];
  lookbookItems: (limit: number) => LookbookRow[];
  resolveCollection: (id: number) => CollectionRow | undefined;
  collectionProducts: (slug: string, limit: number) => ProductRow[];
}

/**
 * Server-side dispatcher for the controlled section architecture.
 * Unknown types are skipped gracefully (forward compatibility).
 */
export default async function HomeSectionRenderer(props: RendererProps) {
  const t = await getTranslations('home');

  return (
    <>
      {props.sections.map((section) => {
        switch (section.type) {
          case 'hero':
            return <HeroSection key={section.id} config={section.config} locale={props.locale} />;
          case 'featured_products':
            return (
              <FeaturedProductsSection
                key={section.id}
                config={section.config}
                locale={props.locale}
                currency={props.currency}
                resolveProducts={props.resolveProducts}
                fallbackTitle={t('featured')}
              />
            );
          case 'collection_highlight':
            return (
              <CollectionHighlightSection
                key={section.id}
                config={section.config}
                locale={props.locale}
                currency={props.currency}
                resolveCollection={props.resolveCollection}
                collectionProducts={props.collectionProducts}
              />
            );
          case 'new_arrivals':
            return (
              <NewArrivalsSection
                key={section.id}
                config={section.config}
                locale={props.locale}
                currency={props.currency}
                newArrivals={props.newArrivals}
                fallbackTitle={t('newArrivalsTitle')}
              />
            );
          case 'lookbook_preview':
            return (
              <LookbookPreviewSection
                key={section.id}
                config={section.config}
                locale={props.locale}
                lookbookItems={props.lookbookItems}
                fallbackTitle={t('lookbookTitle')}
              />
            );
          case 'brand_story':
            return <BrandStorySection key={section.id} config={section.config} locale={props.locale} />;
          case 'promo_banner':
            return <PromoBannerSection key={section.id} config={section.config} locale={props.locale} />;
          default:
            return null;
        }
      })}
    </>
  );
}
