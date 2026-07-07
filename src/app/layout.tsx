
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { FontSizeProvider } from '@/context/FontSizeContext';
import { LanguageProvider, FontSizeApplier } from '@/context/LanguageContext';
import { MarketProvider } from '@/context/MarketContext';
import { CartProvider } from '@/context/CartContext';
import { ViewProvider } from '@/context/ViewContext';
import Script from 'next/script';
import CookieConsent from '@/components/CookieConsent';
import { appIconUrl } from '@/lib/data';
import { Cairo } from 'next/font/google';
import { Suspense } from 'react';
import ErrorWatcher from '@/components/ErrorWatcher';
import { Toaster } from "@/components/ui/toaster";

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
  metadataBase: new URL('https://sooq-elarab.com'),
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: 'https://sooq-elarab.com',
    siteName: 'سوق العرب',
    title: 'سوق العرب | أكبر سوق للإعلانات في الوطن العربي',
    description: 'بيع واشتري كل شيء في منطقتك. سيارات، عقارات، وتوظيف مجاناً.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'سوق العرب',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سوق العرب - بيع واشتري في منطقتك',
    description: 'أفضل العروض والخدمات في الوطن العربي والخليج.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};


import AdminNodeInitializer from '@/components/AdminNodeInitializer';
import LinkInterceptor from '@/components/LinkInterceptor';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
          <Script
             async
             src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4808414573627321"
             crossOrigin="anonymous"
             strategy="lazyOnload"
          ></Script>
      </head>
      <body className={`${cairo.variable} min-h-screen bg-background font-body text-base flex flex-col antialiased`} suppressHydrationWarning>
        <Suspense fallback={<div>Loading...</div>}>
          <LanguageProvider>
            <ThemeProvider>
                <FontSizeProvider>
                    <MarketProvider>
                      <AuthProvider>
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
                                  "url": "https://sooq-elarab.com",
                                  "potentialAction": {
                                    "@type": "SearchAction",
                                    "target": "https://sooq-elarab.com/?q={search_term_string}",
                                    "query-input": "required name=search_term_string"
                                  }
                                })
                              }}
                            />
                            {children}
                            <CookieConsent />
                            <div id="recaptcha-container"></div>
                            <Toaster />
                          </FontSizeApplier>
                          </ViewProvider>
                        </CartProvider>
                      </AuthProvider>
                    </MarketProvider>
                </FontSizeProvider>
            </ThemeProvider>
          </LanguageProvider>
        </Suspense>
      </body>
    </html>
  );
}
