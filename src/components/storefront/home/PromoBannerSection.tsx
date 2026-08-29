import { Link } from '@/i18n/navigation';
import Reveal from '@/components/ui/Reveal';
import SmartImage from '@/components/ui/SmartImage';
import type { Locale } from '@/i18n/routing';

interface Config {
  imageMediaId?: number | null;
  headlineEn?: string;
  headlineAr?: string;
  bodyEn?: string;
  bodyAr?: string;
  ctaLabelEn?: string;
  ctaLabelAr?: string;
  ctaHref?: string;
}

export default function PromoBannerSection({
  config,
  locale
}: {
  config: Record<string, unknown>;
  locale: Locale;
}) {
  const c = config as Config;
  const headline = locale === 'ar' ? c.headlineAr : c.headlineEn;
  const body = locale === 'ar' ? c.bodyAr : c.bodyEn;
  const ctaLabel = locale === 'ar' ? c.ctaLabelAr : c.ctaLabelEn;

  if (!headline && !body && !c.imageMediaId) return null;

  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      {c.imageMediaId && (
        <div className="absolute inset-0 bg-night">
          <SmartImage mediaId={c.imageMediaId} alt="" sizes="100vw" imgClassName="object-cover opacity-80" />
          <div className="absolute inset-0 bg-night/50" />
        </div>
      )}
      <div
        className={`relative mx-auto max-w-3xl px-4 md:px-8 text-center ${
          c.imageMediaId ? 'text-ivory' : 'bg-ivory py-16 md:py-24'
        }`}
      >
        <Reveal>
          {headline && (
            <h2 className={`display-heading text-3xl md:text-5xl mb-5 ${c.imageMediaId ? '' : ''}`}>
              {headline}
            </h2>
          )}
          {body && (
            <p className={`leading-relaxed max-w-xl mx-auto ${c.imageMediaId ? 'text-ivory/80' : 'text-stone-deep'}`}>
              {body}
            </p>
          )}
          {ctaLabel && c.ctaHref && (
            <Link
              href={c.ctaHref}
              className={`inline-flex items-center gap-3 mt-10 px-10 py-4 text-[0.72rem] uppercase tracking-[0.22em] border transition-all duration-500 ${
                c.imageMediaId
                  ? 'border-ivory/80 text-ivory hover:bg-ivory hover:text-night'
                  : 'border-ink text-ink hover:bg-ink hover:text-porcelain'
              }`}
            >
              {ctaLabel}
            </Link>
          )}
        </Reveal>
      </div>
    </section>
  );
}
