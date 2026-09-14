import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { FontSizeProvider } from '@/context/FontSizeContext';
import { LanguageProvider, FontSizeApplier } from '@/context/LanguageContext';
import { MarketProvider } from '@/context/MarketContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { CartProvider } from '@/context/CartContext';
import { ViewProvider } from '@/context/ViewContext';
import Script from 'next/script';
import CookieConsent from '@/components/CookieConsent';
import { appIconUrl } from '@/lib/data';
import { Cairo } from 'next/font/google';
import { Suspense } from 'react';
import ErrorWatcher from '@/components/ErrorWatcher';
import { Toaster } from "@/components/ui/toaster";
import AdminNodeInitializer from '@/components/AdminNodeInitializer';
import LinkInterceptor from '@/components/LinkInterceptor';
import GoogleAdSenseLoader from '@/components/GoogleAdSenseLoader';
import GoogleOneTap from '@/components/GoogleOneTap';
import BottomNav from '@/components/BottomNav';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'سوق العرب | بيع واشتري مجاناً في منطقتك',
    template: '%s | سوق العرب'
  },
  description: 'سوق العرب هو منصتك الأولى للإعلانات المبوبة في الوطن العربي. بيع واشتري السيارات، العقارات، والخدمات بسهولة وأمان في السعودية، الإمارات، مصر وكل الدول العربية.',
  keywords: ['سوق العرب', 'حراج', 'سيارات للبيع', 'عقارات', 'سوق مستعمل', 'إعلانات مبوبة', 'السعودية', 'الإمارات', 'مصر', 'الخليج العربي'],
  authors: [{ name: 'سوق العرب' }],
  creator: 'سوق العرب',
  publisher: 'سوق العرب',
  metadataBase: new URL('https://www.arb-soq.com'),
  verification: {
    google: 'google62a0a2329452de9a',
  },
  other: {
    google: 'notranslate',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: 'https://www.arb-soq.com',
    siteName: 'سوق العرب',
    title: 'سوق العرب | أكبر سوق للإعلانات في الوطن العربي',
    description: 'بيع واشتري كل شيء في منطقتك. سيارات، عقارات، وتوظيف مجاناً.',
    images: [
      {
        url: 'https://www.arb-soq.com/og-image.png?v=2',
        secureUrl: 'https://www.arb-soq.com/og-image.png?v=2',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'سوق العرب',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سوق العرب - بيع واشتري في منطقتك',
    description: 'أفضل العروض والخدمات في الوطن العربي والخليج.',
    images: ['https://www.arb-soq.com/og-image.png?v=2'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/icons/icon-192x192.png',
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" translate="no" className="notranslate" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://arb-soq.firebaseapp.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {process.env.NODE_ENV === 'production' && (
          <>
            <meta name="google-adsense-account" content="ca-pub-4808414573627321" />
            <script
              async
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4808414573627321"
              crossOrigin="anonymous"
            />
          </>
        )}
      </head>
      <body className={`${cairo.variable} min-h-screen w-full max-w-full overflow-x-hidden bg-background font-body text-base flex flex-col antialiased`} suppressHydrationWarning>
        <Script
          id="google-gtm"
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-EKJ4JF0LZQ"
          strategy="lazyOnload"
        />
        <Script
          id="google-analytics-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
              });
              gtag('js', new Date());
              gtag('config', 'G-EKJ4JF0LZQ');
            `,
          }}
        />
        <Suspense fallback={<div className="min-h-screen w-full bg-background flex flex-col items-center justify-center" aria-hidden="true" />}>
          <LanguageProvider>
            <ThemeProvider>
                <FontSizeProvider>
                    <MarketProvider>
                      <CurrencyProvider>
                        <AuthProvider>
                          <GoogleAdSenseLoader />
                          <GoogleOneTap />
                          <CartProvider>
                            <ViewProvider>
                            <FontSizeApplier>
                              <ErrorWatcher />
                              <AdminNodeInitializer />
                              <LinkInterceptor />
                              <script
                                type="application/ld+json"
                                dangerouslySetInnerHTML={{
                                  __html: JSON.stringify({
                                    "@context": "https://schema.org",
                                    "@type": "WebSite",
                                    "name": "سوق العرب",
                                    "url": "https://www.arb-soq.com",
                                    "potentialAction": {
                                      "@type": "SearchAction",
                                      "target": "https://www.arb-soq.com/?q={search_term_string}",
                                      "query-input": "required name=search_term_string"
                                    }
                                  })
                                }}
                              />
                              {children}
                              <CookieConsent />
                              <div id="recaptcha-container"></div>
                              <Toaster />
                              <BottomNav />
                            </FontSizeApplier>
                            </ViewProvider>
                          </CartProvider>
                        </AuthProvider>
                      </CurrencyProvider>
                    </MarketProvider>
                </FontSizeProvider>
            </ThemeProvider>
          </LanguageProvider>
        </Suspense>
      </body>
    </html>
  );
}
