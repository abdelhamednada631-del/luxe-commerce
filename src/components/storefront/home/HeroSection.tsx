import { Link } from '@/i18n/navigation';
import SmartImage from '@/components/ui/SmartImage';
import type { Locale } from '@/i18n/routing';

interface HeroConfig {
  imageMediaId?: number | null;
  headlineEn?: string;
  headlineAr?: string;
  sublineEn?: string;
  sublineAr?: string;
  ctaLabelEn?: string;
  ctaLabelAr?: string;
  ctaHref?: string;
}

export default function HeroSection({ config, locale }: { config: Record<string, unknown>; locale: Locale }) {
  const c = config as HeroConfig;
  const headline = locale === 'ar' ? c.headlineAr : c.headlineEn;
  const subline = locale === 'ar' ? c.sublineAr : c.sublineEn;
  const ctaLabel = locale === 'ar' ? c.ctaLabelAr : c.ctaLabelEn;

  return (
    <section className="relative h-[85vh] min-h-[540px] max-h-[900px] -mt-16 md:-mt-20" aria-label={headline}>
      {/* Background */}
      <div className="absolute inset-0 bg-night">
        {c.imageMediaId ? (
          <SmartImage
            mediaId={c.imageMediaId}
            alt=""
            sizes="100vw"
            priority
            imgClassName="object-cover opacity-90"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/20 to-night/30" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-ivory">
        {subline && <p className="eyebrow !text-ivory/70 mb-6 reveal is-visible">{subline}</p>}
        {headline && (
          <h1 className="display-heading text-4xl md:text-6xl lg:text-7xl max-w-4xl reveal is-visible">
            {headline}
          </h1>
        )}
        {ctaLabel && c.ctaHref && (
          <div className="mt-10 reveal is-visible">
            <Link
              href={c.ctaHref}
              className="inline-flex items-center gap-3 border border-ivory/80 text-ivory px-10 py-4 text-[0.72rem] uppercase tracking-[0.22em] hover:bg-ivory hover:text-night transition-all duration-500"
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
