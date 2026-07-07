import VideoFeed from '@/components/video-ad/VideoFeed';
import Header from '@/components/Header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سوق بلدنا - إعلانات الفيديو | سوق العرب',
  description: 'اكتشف أفضل العروض والخدمات والمنتجات من خلال فيديوهات قصيرة وعروض حية في منطقتك. بيع واشتري وتصفح كل شيء في ميزة سوق بلدنا الإعلانية.',
  keywords: ['سوق العرب', 'إعلانات فيديو', 'سوق بلدنا', 'شورتس', 'بيع وشراء', 'إعلانات مصر'],
  openGraph: {
    title: 'سوق بلدنا - إعلانات الفيديو | سوق العرب',
    description: 'اكتشف أفضل العروض والخدمات من خلال فيديوهات مميزة.',
    type: 'video.other',
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "سوق بلدنا - إعلانات الفيديو",
  "description": "تصفح أفضل الإعلانات المرئية والفيديوهات القصيرة للبيع والشراء في منطقتك.",
  "publisher": {
    "@type": "Organization",
    "name": "سوق العرب",
    "logo": {
      "@type": "ImageObject",
      "url": "https://sooq-elarab.com/logo.png"
    }
  }
};

export default function SooqBaladnaPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1 overflow-hidden">
        <VideoFeed />
      </main>
    </div>
  );
}
