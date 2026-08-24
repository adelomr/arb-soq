import type { Metadata } from 'next';

const BASE_URL = 'https://www.arb-soq.com';

export const metadata: Metadata = {
  title: 'باقات الأسعار وترقية الإعلانات | سوق العرب',
  description: 'تعرف على باقات الاشتراك وترقية الإعلانات في سوق العرب. باقات مجانية ومميزة وذهبية لتثبيت إعلاناتك ومضاعفة المشاهدات والمبيعات في السعودية ومصر والوطن العربي.',
  keywords: ['أسعار سوق العرب', 'ترقية الإعلانات', 'باقات الإعلانات', 'إعلانات مميزة', 'سوق العرب'],
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: `${BASE_URL}/pricing`,
    siteName: 'سوق العرب',
    title: 'باقات الأسعار وترقية الإعلانات | سوق العرب',
    description: 'اختر الباقة المناسبة لإعلاناتك وضاعف مبيعاتك مع باقات سوق العرب المميزة.',
  },
  twitter: {
    card: 'summary',
    title: 'باقات الأسعار | سوق العرب',
    description: 'باقات متميزة لترقية وتثبيت الإعلانات على سوق العرب.',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
