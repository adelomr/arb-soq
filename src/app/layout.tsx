
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { FontSizeProvider } from '@/context/FontSizeContext';
import { LanguageProvider, FontSizeApplier } from '@/context/LanguageContext';
import { MarketProvider } from '@/context/MarketContext';
import { CartProvider } from '@/context/CartContext';
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
  title: 'سوق العرب',
  description: 'سوقك العربي الاحترافي للإعلانات.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4808414573627321"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          ></Script>
      </head>
      <body className={`${cairo.variable} min-h-screen bg-background font-body text-base flex flex-col antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          <LanguageProvider>
            <ThemeProvider>
                <FontSizeProvider>
                    <MarketProvider>
                      <AuthProvider>
                        <CartProvider>
                          <FontSizeApplier>
                            <ErrorWatcher />
                            {children}
                            <CookieConsent />
                            <div id="recaptcha-container"></div>
                            <Toaster />
                          </FontSizeApplier>
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
