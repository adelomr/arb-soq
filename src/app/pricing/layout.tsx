import type { Metadata } from 'next';

const BASE_URL = 'https://www.arb-soq.com';

export const metadata: Metadata = {
  title: 'باقات الاشتراك والأسعار | سوق العرب',
  description: 'اطلع على باقات الاشتراك المتاحة في سوق العرب: الباقة المجانية، الباقة المميزة، والباقة الذهبية. ترقية إعلاناتك لمضاعفة المشاهدات في دول الخليج والوطن العربي.',
  keywords: ['باقات سوق العرب', 'أسعار الإعلانات', 'ترقية إعلان', 'باقة ذهبية', 'باقة مميزة'],
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': 50,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: `${BASE_URL}/pricing`,
    siteName: 'سوق العرب',
    title: 'باقات الاشتراك والأسعار | سوق العرب',
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
