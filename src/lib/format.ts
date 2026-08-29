import type { Locale } from '@/i18n/routing';

/**
 * Locale-aware price formatting.
 * Prices are stored as integers in minor units; rendered per locale with
 * the admin-configured currency symbol.
 */
export function formatPrice(
  amountMinor: number,
  locale: Locale,
  symbolEn: string,
  symbolAr: string
): string {
  const value = amountMinor / 100;
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value);
  const symbol = locale === 'ar' ? symbolAr : symbolEn;
  return locale === 'ar' ? `${formatted} ${symbol}` : `${formatted} ${symbol}`;
}

/** Parse a user-typed major-unit price ("12.50") into integer minor units. */
export function toMinor(input: string | number): number {
  const value = typeof input === 'number' ? input : parseFloat(input.replace(',', '.'));
  if (!Number.isFinite(value) || value < 0) return NaN;
  return Math.round(value * 100);
}

/** Integer minor units → plain major-unit string for form fields. */
export function toMajor(minor: number | null): string {
  if (minor === null || minor === undefined) return '';
  return (minor / 100).toString();
}
