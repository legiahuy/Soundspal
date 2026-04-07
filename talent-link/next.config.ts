import { withSentryConfig } from '@sentry/nextjs';
// next.config.ts
/* eslint-disable @typescript-eslint/no-require-imports */
import type { NextConfig } from 'next'

// next-intl plugin (giữ nguyên theo dự án của bạn)
const withNextIntl = require('next-intl/plugin')('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/socket.io',
        destination: 'https://talentlink.io.vn/socket.io/', // Ensure trailing slash for destination if backend needs it, or match source
      },
      {
        source: '/socket.io/:path+',
        destination: 'https://talentlink.io.vn/socket.io/:path+',
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'talentlink.io.vn',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'talentlink.io.vn',
        pathname: '/api/v1/images/**',
      },
      {
        protocol: 'https',
        hostname: 'avatar.iran.liara.run',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
      },
    ],
  },
}

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "soundspal",

  project: "soundspal",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
