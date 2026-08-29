import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { productBySlug, parseVariants, parseImageIds, queryProducts } from '@/lib/db/repos/products';
import { collectionsForProduct } from '@/lib/db/repos/collections';
import { getSettings } from '@/lib/db/repos/settings';
import { formatPrice } from '@/lib/format';
import Reveal from '@/components/ui/Reveal';
import ProductCard from '@/components/storefront/ProductCard';
import ProductGallery from '@/components/storefront/product/ProductGallery';
import AddToCartPanel from '@/components/storefront/product/AddToCartPanel';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product || product.status !== 'active') return { title: 'Not found' };
  const locale = (await getLocale()) as Locale;
  const name = locale === 'ar' ? product.name_ar : product.name_en;
  const description = locale === 'ar' ? product.description_ar : product.description_en;
  return { title: name, description: description || undefined };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('product');
  const tCommon = await getTranslations('common');
  const settings = getSettings();

  const product = productBySlug(slug);
  if (!product || product.status !== 'active') notFound();

  const name = locale === 'ar' ? product.name_ar : product.name_en;
  const description = locale === 'ar' ? product.description_ar : product.description_en;
  const imageIds = parseImageIds(product.image_ids);
  const variants = parseVariants(product.variants);
  const currency = { en: settings.locale.currencySymbolEn, ar: settings.locale.currencySymbolAr };
  const onSale = product.compare_at_price !== null && product.compare_at_price > product.price;

  // Breadcrumb collection (first visible collection this product belongs to)
  const productCollections = collectionsForProduct(product.id).filter((c) => c.is_visible === 1);
  const primaryCollection = productCollections[0];

  // Related products: same primary collection, else newest arrivals
  let related = primaryCollection
    ? queryProducts({ collectionSlug: primaryCollection.slug, limit: 5 }).products.filter(
        (p) => p.id !== product.id
      )
    : [];
  if (related.length === 0) {
    related = queryProducts({ sort: 'newest', limit: 5 }).products.filter((p) => p.id !== product.id);
  }
  related = related.slice(0, 4);

  return (
    <div>
      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-stone">
          <Link href="/" className="hover:text-ink transition-colors">
            {tCommon('backHome')}
          </Link>
          {primaryCollection && (
            <>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <Link
                href={`/collections/${primaryCollection.slug}`}
                className="hover:text-ink transition-colors"
              >
                {locale === 'ar' ? primaryCollection.name_ar : primaryCollection.name_en}
              </Link>
            </>
          )}
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-ink">{name}</span>
        </nav>

        {/* Gallery + info */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          <Reveal>
            <ProductGallery images={imageIds} alt={name} />
          </Reveal>

          <Reveal delay={100}>
            <div className="lg:sticky lg:top-28 flex flex-col gap-6">
              {/* Badges */}
              {(product.is_new === 1 || onSale) && (
                <div className="flex gap-2">
                  {product.is_new === 1 && (
                    <span className="bg-porcelain text-ink text-[0.6rem] font-medium uppercase tracking-[0.18em] px-2.5 py-1">
                      {t('newBadge')}
                    </span>
                  )}
                  {onSale && (
                    <span className="bg-accent text-accent-ink text-[0.6rem] font-medium uppercase tracking-[0.18em] px-2.5 py-1">
                      {t('saleBadge')}
                    </span>
                  )}
                </div>
              )}

              <h1 className="display-heading text-3xl md:text-5xl">{name}</h1>

              {/* Price */}
              <p className="text-lg">
                {formatPrice(product.price, locale, currency.en, currency.ar)}
                {onSale && product.compare_at_price !== null && (
                  <span className="ms-3 text-sm text-stone line-through">
                    {formatPrice(product.compare_at_price, locale, currency.en, currency.ar)}
                  </span>
                )}
              </p>

              {/* SKU */}
              {product.sku && (
                <p className="text-xs text-stone">
                  {t('sku')}: <span className="tabular-nums">{product.sku}</span>
                </p>
              )}

              {/* Variants + quantity + add to cart + wishlist */}
              <AddToCartPanel
                product={{
                  id: product.id,
                  slug: product.slug,
                  nameEn: product.name_en,
                  nameAr: product.name_ar,
                  price: product.price,
                  imageId: imageIds[0] ?? null,
                  stock: product.stock
                }}
                variants={variants}
              />

              {/* Description */}
              {description && (
                <div className="border-t border-line pt-6 mt-2">
                  <h2 className="field-label mb-3">{t('description')}</h2>
                  <p className="text-sm leading-relaxed text-stone-deep whitespace-pre-line">
                    {description}
                  </p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="border-t border-line bg-ivory/60">
          <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-14 md:py-20">
            <Reveal>
              <h2 className="display-heading text-2xl md:text-3xl text-center mb-10 md:mb-14">
                {t('relatedProducts')}
              </h2>
            </Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i, 8) * 50}>
                  <ProductCard
                    product={{
                      id: p.id,
                      slug: p.slug,
                      name: locale === 'ar' ? p.name_ar : p.name_en,
                      price: p.price,
                      compareAtPrice: p.compare_at_price,
                      isNew: p.is_new === 1,
                      imageIds: parseImageIds(p.image_ids)
                    }}
                    currency={currency}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
