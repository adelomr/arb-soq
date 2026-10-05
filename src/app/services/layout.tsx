import type { Metadata } from 'next';

const BASE_URL = 'https://www.arb-soq.com';

export const metadata: Metadata = {
  title: 'سوق الخدمات والأعمال | سوق العرب',
  description: 'اعثر على أفضل الخدمات والمهنيين والمحترفين المستقلين لإنجاز مشاريعك وأعمالك في السعودية ومصر وكل الدول العربية.',
  keywords: ['خدمات سوق العرب', 'أعمال وخدمات', 'مهنيين', 'حرفيين', 'خدمات تسويق', 'برمجة وتصميم'],
  alternates: {
    canonical: `${BASE_URL}/services`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: `${BASE_URL}/services`,
    siteName: 'سوق العرب',
    title: 'سوق الخدمات والأعمال | سوق العرب',
    description: 'اعثر على أفضل الخدمات والمحترفين في الوطن العربي.',
    images: [`${BASE_URL}/og-image.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سوق الخدمات | سوق العرب',
    description: 'اعثر على أفضل المحترفين والخدمات في الوطن العربي.',
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
