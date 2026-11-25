import type { NextConfig } from 'next';

function buildContentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://avatars.githubusercontent.com https://raw.githubusercontent.com",
    "font-src 'self'",
    "connect-src 'self' https://api.github.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ];

  if (!isDev) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';

    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: buildContentSecurityPolicy(),
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin-allow-popups',
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-origin',
      },
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      ...(isProd
        ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
          ]
        : []),
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
