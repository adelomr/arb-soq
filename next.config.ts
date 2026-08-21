import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.1.3', '192.168.1.6', 'localhost'],
  serverExternalPackages: [
    '@genkit-ai/core',
    '@genkit-ai/ai',
    '@genkit-ai/googleai',
    '@genkit-ai/firebase',
    '@genkit-ai/next',
    'genkit',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      '@radix-ui/react-accordion',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'axios',
      'zod',
    ],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      }
    ],
  },

  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) {
      return [];
    }

    const securityHeaders = [
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin-allow-popups',
      },
      {
        key: 'Cross-Origin-Embedder-Policy',
        value: 'unsafe-none',
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'cross-origin',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self)',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://js.stripe.com https://accounts.google.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.google https://*.adtrafficquality.google https://*.googleadservices.com https://*.doubleclick.net https://*.firebaseio.com https://*.firebaseapp.com https://connect.facebook.net https://www.youtube.com",
          "script-src-elem 'self' 'unsafe-inline' blob: https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://js.stripe.com https://accounts.google.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.google https://*.adtrafficquality.google https://*.googleadservices.com https://*.doubleclick.net https://*.firebaseio.com https://*.firebaseapp.com https://connect.facebook.net https://www.youtube.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.google.com https://*.google",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https: http:",
          "media-src 'self' blob: https: http:",
          "connect-src 'self' https: http: wss: ws: https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://ip-api.com https://ipapi.co https://ipinfo.io https://accounts.google.com https://api.bigdatacloud.net https://nominatim.openstreetmap.org https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.google https://*.adtrafficquality.google https://*.google-analytics.com https://*.doubleclick.net",
          "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.firebaseapp.com https://accounts.google.com https://www.facebook.com https://web.facebook.com https://*.googlesyndication.com https://googleads.g.doubleclick.net https://*.google.com https://*.google https://js.stripe.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests",
        ].join('; '),
      },
    ];

    return [
      // رؤوس الأمان لجميع الصفحات
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // كاش الأصول الثابتة
      {
        source: '/:all*(svg|jpg|png|webp|avif|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
