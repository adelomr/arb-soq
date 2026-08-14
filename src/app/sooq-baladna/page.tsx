import { Metadata } from 'next';
import SooqBaladnaClient from './SooqBaladnaClient';

export const metadata: Metadata = {
  title: 'سوق بلدنا | إعلانات منطقتك وقريتك في سوق العرب',
  description: 'تصفح أحدث إعلانات البيع والشراء والخدمات في قريتك ومدينتك. إعلانات محلية حقيقية بالقرب منك مباشرة في سوق العرب.',
  keywords: ['سوق بلدنا', 'إعلانات محلية', 'إعلانات قريتي', 'إعلانات منطقتي', 'حراج محلي', 'سوق العرب'],
  openGraph: {
    title: 'سوق بلدنا | إعلانات منطقتك وقريتك',
    description: 'تصفح أحدث الإعلانات والصفقات في منطقتك ومدينتك.',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'سوق بلدنا - إعلانات منطقتك',
  description: 'تصفح أفضل الإعلانات المحلية للبيع والشراء في قريتك ومدينتك.',
  publisher: {
    '@type': 'Organization',
    name: 'سوق العرب',
    url: 'https://www.arb-soq.com',
  },
};

export default function SooqBaladnaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SooqBaladnaClient />
    </>
  );
}
