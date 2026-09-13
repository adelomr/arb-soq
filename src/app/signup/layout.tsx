import type { Metadata } from 'next';

const BASE_URL = 'https://www.arb-soq.com';

export const metadata: Metadata = {
  title: 'انضم إلى سوق العرب | بيع واشتري مجاناً في منطقتك',
  description:
    'سجّل حسابك في منصة سوق العرب. بيع واشتري السيارات، العقارات، السلع والخدمات في منطقتك بكل سهولة وأمان وبدون أي عمولة.',
  keywords: ['سوق العرب', 'تسجيل حساب', 'انضمام', 'إعلانات مبوبة', 'بيع وشراء'],
  alternates: {
    canonical: `${BASE_URL}/signup`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: `${BASE_URL}/signup`,
    siteName: 'سوق العرب',
    title: 'انضم إلى سوق العرب | بيع واشتري مجاناً في منطقتك',
    description:
      'سجّل دخولك الآن بضغطة واحدة باستخدام Google وابدأ الإعلان والبيع والشراء في منطقتك.',
    images: [
      {
        url: `${BASE_URL}/og-image.png?v=2`,
        secureUrl: `${BASE_URL}/og-image.png?v=2`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'سوق العرب — تسجيل حساب',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'انضم إلى سوق العرب | سجّل بضغطة واحدة مع Google',
    description: 'سجّل الآن في منصة سوق العرب للبيع والشراء في منطقتك.',
    images: [`${BASE_URL}/og-image.png?v=2`],
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
