// =====================================================================
// page.tsx — الصفحة الرئيسية (Server Component)
// تتضمن: metadata كاملة لـ SEO، JSON-LD Schema، ثم يُرسَل HomeClient
// =====================================================================

import type { Metadata } from 'next';
import HomeClient from './HomeClient';

const BASE_URL = 'https://www.arb-soq.com';

export const metadata: Metadata = {
  title: 'سوق العرب | بيع واشتري مجاناً في منطقتك',
  description:
    'سوق العرب منصة الإعلانات المبوبة الأولى في الوطن العربي. أضف إعلانك مجاناً وبيع أو اشتري السيارات، العقارات، الخدمات والمنتجات في السعودية، الإمارات، مصر وكل الدول العربية.',
  keywords: [
    'سوق العرب', 'حراج', 'سوق مستعمل', 'إعلانات مبوبة', 'بيع وشراء',
    'سيارات للبيع', 'عقارات', 'وظائف', 'خدمات', 'السعودية', 'الإمارات',
    'مصر', 'الخليج العربي', 'سوق اون لاين', 'مجاناً',
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: BASE_URL,
    siteName: 'سوق العرب',
    title: 'سوق العرب | أكبر سوق للإعلانات في الوطن العربي',
    description: 'بيع واشتري كل شيء في منطقتك. سيارات، عقارات، وتوظيف مجاناً.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'سوق العرب — بيع واشتري مجاناً',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سوق العرب - بيع واشتري في منطقتك',
    description: 'أفضل العروض والخدمات في الوطن العربي والخليج.',
    images: [`${BASE_URL}/og-image.png`],
  },
};

// JSON-LD structured data للصفحة الرئيسية
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'سوق العرب',
  url: BASE_URL,
  description:
    'منصة الإعلانات المبوبة الأولى في الوطن العربي. بيع واشتري السيارات، العقارات والخدمات مجاناً.',
  inLanguage: 'ar',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  publisher: {
    '@type': 'Organization',
    name: 'سوق العرب',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/favicon.ico`,
    },
  },
};

export default function Home() {
  return (
    <>
      {/* JSON-LD Schema للفهرسة */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* الجزء التفاعلي من الصفحة */}
      <HomeClient />
    </>
  );
}
