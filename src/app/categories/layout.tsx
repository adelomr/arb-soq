import type { Metadata } from 'next';

const BASE_URL = 'https://www.arb-soq.com';

export const metadata: Metadata = {
  title: 'جميع الفئات والأقسام | سوق العرب',
  description: 'تصفح جميع أقسام وفئات سوق العرب: سيارات للبيع، عقارات، إلكترونيات، وظائف، خدمات وسوق المستعمل في جميع الدول العربية.',
  keywords: ['أقسام سوق العرب', 'فئات الإعلانات', 'حراج السيارات', 'عقارات', 'وظائف', 'سوق مستعمل', 'خدمات'],
  alternates: {
    canonical: `${BASE_URL}/categories`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: `${BASE_URL}/categories`,
    siteName: 'سوق العرب',
    title: 'جميع الفئات والأقسام | سوق العرب',
    description: 'تصفح جميع أقسام وفئات سوق العرب بسهولة وسرعة.',
    images: [`${BASE_URL}/og-image.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'جميع الفئات والأقسام | سوق العرب',
    description: 'تصفح جميع أقسام وفئات سوق العرب بسهولة وسرعة.',
  },
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
