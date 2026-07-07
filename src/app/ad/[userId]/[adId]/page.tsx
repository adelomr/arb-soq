import { Metadata } from 'next';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import AdDetailClient from '@/components/AdDetailClient';
import { Ad, UserProfile } from '@/lib/types';
import { notFound } from 'next/navigation';
import { getAdViewType, serializeFirestoreData } from '@/lib/utils';
import RegularVideoPlayer from '@/components/video-ad/RegularVideoPlayer';
import VideoFeed from '@/components/video-ad/VideoFeed';

type Props = {
  params: Promise<{ userId: string; adId: string }>;
};

async function getAdData(userId: string, adId: string): Promise<Ad | null> {
  // 1. Try fetching from top-level 'ads' collection (Sync with Android)
  let adDocRef = doc(firestore, 'ads', adId);
  let adSnap = await getDoc(adDocRef);

  // 2. Fallback to sub-collection if not found
  if (!adSnap.exists()) {
    adDocRef = doc(firestore, 'users', userId, 'ads', adId);
    adSnap = await getDoc(adDocRef);
  }

  // 3. Fallback to store products
  if (!adSnap.exists()) {
    const storeCollectionRef = collection(firestore, 'users', userId, 'store');
    const storeSnapshot = await getDocs(storeCollectionRef);
    if (!storeSnapshot.empty) {
        const storeId = storeSnapshot.docs[0].id;
        adDocRef = doc(firestore, 'users', userId, 'store', storeId, 'products', adId);
        adSnap = await getDoc(adDocRef);
    }
  }

  if (!adSnap.exists()) return null;

  const adData = adSnap.data() as Ad;
  
  // Fetch user profile
  const userRef = doc(firestore, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    adData.user = { id: userSnap.id, ...userSnap.data() } as UserProfile;
  }

  return { ...adData, id: adSnap.id };
}

async function getRelatedAds(market: string, currentAdId: string): Promise<Ad[]> {
    const q = query(
        collection(firestore, 'ads'),
        where('market', '==', market),
        where('status', '==', 'active'),
        limit(12)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Ad))
        .filter(ad => ad.id !== currentAdId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId, adId } = await params;
  const ad = await getAdData(userId, adId);

  if (!ad) {
    return {
      title: 'الإعلان غير موجود | سوق العرب',
    };
  }

  const description = (ad.description || '').substring(0, 160);
  const imageUrl = ad.imageUrls && ad.imageUrls.length > 0 ? ad.imageUrls[0] : '/og-image.png';

  return {
    title: `${ad.title} | سوق العرب`,
    description: description,
    openGraph: {
      title: ad.title,
      description: description,
      images: [imageUrl],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: ad.title,
      description: description,
      images: [imageUrl],
    },
  };
}

export default async function AdPage({ params }: Props) {
  const { userId, adId } = await params;
  const ad = await getAdData(userId, adId);

  if (!ad) {
    notFound();
  }

  const viewType = getAdViewType(ad);
  const relatedAds = viewType === 'video' ? await getRelatedAds(ad.market || 'all', adId) : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": ad.title,
    "description": ad.description,
    "image": ad.imageUrls,
    "offers": {
      "@type": "Offer",
      "price": ad.price || 0,
      "priceCurrency": ad.market ? (ad.market === 'sa' ? 'SAR' : ad.market === 'eg' ? 'EGP' : 'AED') : 'SAR',
      "availability": "https://schema.org/InStock",
      "url": `https://sooq-elarab.com/ad/${userId}/${adId}`
    }
  };

  const serializedAd = serializeFirestoreData(ad);
  const serializedRelated = serializeFirestoreData(relatedAds);

  if (viewType === 'shorts') {
      return <VideoFeed initialAdId={adId} initialViewMode="shorts" initialCategory={ad.category || ad.categoryId || 'all'} exitToHome={true} />;
  }

  if (viewType === 'video') {
      return (
          <div className="bg-background min-h-screen">
               <RegularVideoPlayer ad={serializedAd} relatedAds={serializedRelated} />
          </div>
      );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AdDetailClient initialAd={serializedAd} />
    </>
  );
}
