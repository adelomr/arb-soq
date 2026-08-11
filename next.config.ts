import type { NextConfig } from 'next';

// الحزم التي تعمل على المتصفح فقط ولا تحتاجها Cloud Function
const CLIENT_ONLY_PACKAGES = [
  // محرر النصوص TipTap - يعمل على المتصفح فقط
  '@tiptap/react',
  '@tiptap/starter-kit',
  '@tiptap/extension-color',
  '@tiptap/extension-highlight',
  '@tiptap/extension-image',
  '@tiptap/extension-link',
  '@tiptap/extension-placeholder',
  '@tiptap/extension-text-align',
  '@tiptap/extension-text-style',
  '@tiptap/extension-underline',
  '@tiptap/extension-subscript',
  '@tiptap/extension-superscript',
  '@tiptap/extension-table',
  '@tiptap/extension-table-cell',
  '@tiptap/extension-table-header',
  '@tiptap/extension-table-row',
  '@tiptap/extension-youtube',
  // ProseMirror (محرك TipTap) - Client only
  'prosemirror-commands',
  'prosemirror-dropcursor',
  'prosemirror-gapcursor',
  'prosemirror-history',
  'prosemirror-inputrules',
  'prosemirror-keymap',
  'prosemirror-model',
  'prosemirror-schema-list',
  'prosemirror-state',
  'prosemirror-tables',
  'prosemirror-transform',
  'prosemirror-view',
  'prosemirror-changeset',
  // Radix UI - مكونات واجهة المستخدم
  '@radix-ui/react-accordion',
  '@radix-ui/react-alert-dialog',
  '@radix-ui/react-aspect-ratio',
  '@radix-ui/react-avatar',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-label',
  '@radix-ui/react-menubar',
  '@radix-ui/react-popover',
  '@radix-ui/react-progress',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-select',
  '@radix-ui/react-separator',
  '@radix-ui/react-slider',
  '@radix-ui/react-slot',
  '@radix-ui/react-switch',
  '@radix-ui/react-tabs',
  '@radix-ui/react-toast',
  '@radix-ui/react-tooltip',
  // أدوات UI أخرى - Client only
  'embla-carousel-react',
  'html2canvas',
  'react-quill',
  'react-hook-form',
  'react-day-picker',
  'pigeon-maps',
  '@emailjs/browser',
  '@hookform/resolvers',
  'lucide-react',
  // Genkit CLI - أداة تطوير فقط
  'genkit-cli',
];

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.1.6'],
  typescript: {
    ignoreBuildErrors: true,
  },
  // إقصاء حزم Client-Only من حزمة Cloud Function لتقليل الحجم
  outputFileTracingExcludes: {
    '*': CLIENT_ONLY_PACKAGES.map(pkg => `./node_modules/${pkg}/**`),
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
    // تعطيل محسّن الصور تماماً لتجاوز قيود remotePatterns وعرض جميع الصور مباشرة من مصادرها
    // هذا يحل مشكلة عدم عرض صور Firebase Storage و Google على السيرفر
    unoptimized: true,
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
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://js.stripe.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https: http:",
          "media-src 'self' blob: https:",
          "connect-src 'self' https: wss: https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://ip-api.com https://ipapi.co https://ipinfo.io",
          "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.firebaseapp.com",
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
