import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

/**
 * Security headers applied to every response.
 * CSP note: 'unsafe-inline'/'unsafe-eval' for scripts are required by
 * Next.js hydration; all other directives are strict. Documented trade-off.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'"
    ].join('; ')
  }
];

const nextConfig: NextConfig = {
  // Native modules must stay external so better-sqlite3 / sharp load correctly.
  serverExternalPackages: ['better-sqlite3', 'sharp'],
  webpack: (config, { nextRuntime }) => {
    // instrumentation.ts is compiled for the Edge runtime too (middleware),
    // where serverExternalPackages does not apply and node: builtins cannot
    // be bundled. Alias the Node-only boot module to an empty module there —
    // the NEXT_RUNTIME guard in register() ensures it is never executed in
    // Edge, so only the bundling needs to be prevented.
    if (nextRuntime === 'edge') {
      config.resolve.alias['./instrumentation-node'] = false;
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ];
  }
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
