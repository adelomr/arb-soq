import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.1.6'],
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
    const securityHeaders = [
      // HSTS — إجبار HTTPS لمدة سنة كاملة مع subdomains
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
      // منع تخمين نوع المحتوى (MIME sniffing)
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      // الحماية من Clickjacking
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      // COOP — عزل النطاق بشكل صحيح
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin-allow-popups',
      },
      // COEP — منع تحميل الموارد غير الآمنة
      {
        key: 'Cross-Origin-Embedder-Policy',
        value: 'unsafe-none',
      },
      // CORP
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'cross-origin',
      },
      // سياسة الإحالة
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      // تقليل صلاحيات المتصفح
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
      },
      // CSP — سياسة أمان المحتوى
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://js.stripe.com https://accounts.google.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https: http:",
          "media-src 'self' blob: https:",
          "connect-src 'self' https: wss: https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://ip-api.com https://ipapi.co https://ipinfo.io https://accounts.google.com",
          "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.firebaseapp.com https://accounts.google.com",
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
