import { getPublishedLandingPages } from '@/lib/page-service';
import LandingSectionsClient from './LandingSectionsClient';
import { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'أقسام صفحات الهبوط والخدمات | سوق العرب',
  description: 'تصفح جميع أقسام صفحات الهبوط والخدمات المتخصصة من نقل عفش، صيانة منزلية، كشف تسربات، ومقاولات في سوق العرب مع إمكانية التواصل المباشر.',
  keywords: ['صفحات الهبوط', 'سوق العرب', 'نقل عفش', 'كشف تسربات', 'صيانة منازل', 'مقاولات', 'خدمات مصر والدول العربية'],
  openGraph: {
    title: 'أقسام ودليل صفحات الهبوط المتخصصة | سوق العرب',
    description: 'اعثر على أفضل الخدمات والحلول المتخصصة في منطقتك وتواصل مباشرة عبر الواتساب والاتصال.',
    type: 'website',
    url: 'https://www.arb-soq.com/landing-sections',
    siteName: 'سوق العرب',
  },
  alternates: {
    canonical: 'https://www.arb-soq.com/landing-sections',
  },
};

export default async function LandingSectionsPage() {
  const landingPages = await getPublishedLandingPages();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'أقسام ودليل صفحات الهبوط - سوق العرب',
    description: 'دليل وأقسام صفحات الهبوط المتخصصة للخدمات والمنتجات مع أرقام التواصل المباشر.',
    url: 'https://www.arb-soq.com/landing-sections',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: landingPages.map((page, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: page.title,
        url: `https://www.arb-soq.com/p/${page.slug}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingSectionsClient initialPages={landingPages} />
    </>
  );
}
