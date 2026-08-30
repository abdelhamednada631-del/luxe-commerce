import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Security headers applied to every response.
 * CSP note: 'unsafe-inline' for scripts is still required by Next.js
 * hydration (no nonce infrastructure in this app — documented trade-off).
 * 'unsafe-eval' is a development-only need (React DevTools/HMR), so it is
 * dropped in production. HSTS + upgrade-insecure-requests are prod-only
 * (meaningless or noisy on local http).
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
    : []),
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      ...(isProd ? ['upgrade-insecure-requests'] : [])
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
