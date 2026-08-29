'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  InstagramIcon, FacebookIcon, TikTokIcon, XIcon, YoutubeIcon,
  WhatsappIcon, PhoneIcon, MailIcon, PinIcon
} from '@/components/ui/Icons';
import SmartImage from '@/components/ui/SmartImage';

export interface FooterData {
  storeName: string;
  logoMediaId: number | null;
  social: { key: string; url: string }[];
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
  };
  policies: { key: string; title: string }[];
}

const socialIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  x: XIcon,
  youtube: YoutubeIcon
};

export default function Footer({ data }: { data: FooterData }) {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const year = new Date().getFullYear();

  return (
    <footer className="bg-night text-ivory">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div>
            {data.logoMediaId ? (
              <div className="relative h-10 w-32 mb-4">
                <SmartImage mediaId={data.logoMediaId} alt={data.storeName} sizes="128px" />
              </div>
            ) : (
              <p className="display-heading text-2xl tracking-[0.08em] uppercase mb-4">{data.storeName}</p>
            )}
            <p className="text-sm text-ivory/50 leading-relaxed max-w-xs">{t('newsletterBody')}</p>
          </div>

          {/* Explore */}
          <nav aria-label={t('quickLinks')}>
            <p className="eyebrow !text-ivory/40 mb-5">{t('quickLinks')}</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/collections" className="link-luxe text-ivory/70">{tNav('collections')}</Link></li>
              <li><Link href="/new-arrivals" className="link-luxe text-ivory/70">{tNav('newArrivals')}</Link></li>
              <li><Link href="/lookbook" className="link-luxe text-ivory/70">{tNav('lookbook')}</Link></li>
              <li><Link href="/about" className="link-luxe text-ivory/70">{tNav('about')}</Link></li>
              <li><Link href="/wishlist" className="link-luxe text-ivory/70">{tNav('wishlist')}</Link></li>
            </ul>
          </nav>

          {/* Customer care */}
          <nav aria-label={t('customerCare')}>
            <p className="eyebrow !text-ivory/40 mb-5">{t('customerCare')}</p>
            <ul className="space-y-3 text-sm">
              {data.policies.map((p) => (
                <li key={p.key}>
                  <Link href={`/policies/${p.key}`} className="link-luxe text-ivory/70">{p.title}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact + social */}
          <div>
            <p className="eyebrow !text-ivory/40 mb-5">{t('contactUs')}</p>
            <ul className="space-y-3 text-sm text-ivory/70">
              {data.contact.phone && (
                <li>
                  <a href={`tel:${data.contact.phone}`} className="flex items-center gap-3 hover:text-ivory transition-colors">
                    <PhoneIcon size={16} /> <span dir="ltr">{data.contact.phone}</span>
                  </a>
                </li>
              )}
              {data.contact.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${data.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-ivory transition-colors"
                  >
                    <WhatsappIcon size={16} /> <span dir="ltr">{data.contact.whatsapp}</span>
                  </a>
                </li>
              )}
              {data.contact.email && (
                <li>
                  <a href={`mailto:${data.contact.email}`} className="flex items-center gap-3 hover:text-ivory transition-colors">
                    <MailIcon size={16} /> {data.contact.email}
                  </a>
                </li>
              )}
              {data.contact.address && (
                <li className="flex items-start gap-3">
                  <PinIcon size={16} className="mt-0.5 shrink-0" /> {data.contact.address}
                </li>
              )}
            </ul>

            {data.social.length > 0 && (
              <div className="mt-8">
                <p className="eyebrow !text-ivory/40 mb-4">{t('followUs')}</p>
                <div className="flex items-center gap-4">
                  {data.social.map(({ key, url }) => {
                    const Icon = socialIcons[key];
                    return Icon ? (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={key}
                        className="text-ivory/60 hover:text-ivory transition-colors"
                      >
                        <Icon size={18} />
                      </a>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-ivory/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ivory/40 tracking-wide">
            © {year} {data.storeName}. {t('rightsReserved')}.
          </p>
          {/* Discreet admin entry point */}
          <a href="/admin" className="text-[0.65rem] text-ivory/25 hover:text-ivory/60 transition-colors tracking-[0.2em] uppercase">
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
}
