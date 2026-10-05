import type { Metadata } from 'next';

const BASE_URL = 'https://www.arb-soq.com';

export const metadata: Metadata = {
  title: 'دليل المتاجر والشركات المعتمدة | سوق العرب',
  description: 'تصفح قائمة المتاجر والشركات الموثقة في سوق العرب. تسوق منتجات متنوعة وتواصل مع التجار المعتمدين مباشرة.',
  keywords: ['متاجر سوق العرب', 'دليل المتاجر', 'تسوق اونلاين', 'متاجر موثقة', 'متاجر إلكترونية'],
  alternates: {
    canonical: `${BASE_URL}/shops`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: `${BASE_URL}/shops`,
    siteName: 'سوق العرب',
    title: 'دليل المتاجر والشركات المعتمدة | سوق العرب',
    description: 'تصفح المتاجر المعتمدة في سوق العرب.',
    images: [`${BASE_URL}/og-image.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دليل المتاجر المعتمدة | سوق العرب',
    description: 'تصفح المتاجر المعتمدة في سوق العرب.',
  },
};

export default function ShopsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
