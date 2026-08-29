'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useCart, cartCount } from '@/lib/store/cart';
import { useWishlist } from '@/lib/store/wishlist';
import { MenuIcon, CloseIcon, SearchIcon, BagIcon, HeartIcon, ArrowIcon } from '@/components/ui/Icons';
import SearchOverlay from './SearchOverlay';
import type { Locale } from '@/i18n/routing';

export interface HeaderCollection {
  slug: string;
  name: string;
}

export default function Header({
  storeName,
  collections,
  locale
}: {
  storeName: string;
  collections: HeaderCollection[];
  locale: Locale;
}) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const items = useCart((s) => s.items);
  const wishlist = useWishlist((s) => s.items);
  const count = cartCount(items);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close overlays on navigation
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Lock body scroll when an overlay is open
  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen, searchOpen]);

  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  // pathname from @/i18n/navigation is already locale-stripped; the Link
  // `locale` prop makes it render the same path under the other locale.
  const switchHref = pathname === '/' ? '/' : pathname;

  const navLink = 'link-luxe text-[0.72rem] font-medium uppercase tracking-[0.16em] text-stone-deep';
  const navLinkAr = 'link-luxe text-sm font-medium text-stone-deep';

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[100] focus:bg-ink focus:text-porcelain focus:px-4 focus:py-2 focus:text-xs"
      >
        {t('skipToContent')}
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-porcelain/95 backdrop-blur-sm border-b border-line'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 md:h-20 max-w-[1400px] items-center justify-between px-4 md:px-8">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t('openMenu')}
            className="p-2 -ms-2 lg:hidden"
          >
            <MenuIcon size={22} />
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label={t('collections')}>
            <Link href="/" className={locale === 'ar' ? navLinkAr : navLink}>
              {t('home')}
            </Link>
            {collections.slice(0, 3).map((c) => (
              <Link key={c.slug} href={`/collections/${c.slug}`} className={locale === 'ar' ? navLinkAr : navLink}>
                {c.name}
              </Link>
            ))}
            <Link href="/new-arrivals" className={locale === 'ar' ? navLinkAr : navLink}>
              {t('newArrivals')}
            </Link>
            <Link href="/lookbook" className={locale === 'ar' ? navLinkAr : navLink}>
              {t('lookbook')}
            </Link>
          </nav>

          {/* Wordmark */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-center"
            aria-label={storeName}
          >
            <span className="display-heading text-xl md:text-2xl tracking-[0.08em] uppercase whitespace-nowrap">
              {storeName}
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t('openSearch')}
              className="p-2"
            >
              <SearchIcon size={20} />
            </button>
            <Link href="/wishlist" aria-label={t('wishlist')} className="p-2 hidden sm:block relative">
              <HeartIcon size={20} />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 end-0.5 min-w-[16px] h-4 px-0.5 text-[10px] leading-4 text-center bg-accent text-accent-ink" aria-hidden="true">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link href="/cart" aria-label={t('cart')} className="p-2 relative">
              <BagIcon size={20} />
              {count > 0 && (
                <span className="absolute top-0.5 end-0.5 min-w-[16px] h-4 px-0.5 text-[10px] leading-4 text-center bg-accent text-accent-ink" aria-hidden="true">
                  {count}
                </span>
              )}
            </Link>
            <Link
              href={switchHref}
              locale={otherLocale}
              aria-label={tc('language')}
              className="p-2 text-[0.7rem] font-medium tracking-widest uppercase"
            >
              {otherLocale === 'ar' ? 'ع' : 'EN'}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={t('openMenu')}>
          <div className="absolute inset-0 bg-night/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-[85%] max-w-sm bg-porcelain flex flex-col animate-[slideIn_.35s_var(--ease-luxe)]">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <span className="display-heading text-lg uppercase tracking-wider">{storeName}</span>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label={t('closeMenu')} className="p-2">
                <CloseIcon size={22} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-6 flex flex-col gap-6" aria-label={t('collections')}>
              <Link href="/" className="display-heading text-2xl">
                {t('home')}
              </Link>
              <Link href="/collections" className="display-heading text-2xl">
                {t('collections')}
              </Link>
              {collections.map((c) => (
                <Link key={c.slug} href={`/collections/${c.slug}`} className="text-lg text-stone-deep ps-4">
                  {c.name}
                </Link>
              ))}
              <Link href="/new-arrivals" className="display-heading text-2xl">
                {t('newArrivals')}
              </Link>
              <Link href="/lookbook" className="display-heading text-2xl">
                {t('lookbook')}
              </Link>
              <Link href="/about" className="display-heading text-2xl">
                {t('about')}
              </Link>
              <Link href="/wishlist" className="display-heading text-2xl flex items-center gap-2">
                {t('wishlist')} <HeartIcon size={18} />
              </Link>
            </nav>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(var(--drawer-from, -100%));
          }
          to {
            transform: translateX(0);
          }
        }
        [dir='rtl'] {
          --drawer-from: 100%;
        }
      `}</style>
    </>
  );
}
