import type { Viewport } from 'next';
import '@/styles/globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

/**
 * Pass-through root layout — the [locale] layout owns <html>/<body>
 * so that lang, dir, fonts and the accent variable can be applied
 * per locale (official next-intl i18n-routing pattern).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
