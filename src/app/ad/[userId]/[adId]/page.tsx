import { Suspense } from 'react';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
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
  // 1. Try fetching from top-level 'ads' collection
  let adDocRef = doc(firestore, 'ads', adId);
  let adSnap = await getDoc(adDocRef);

  const isValidUser = userId && userId !== 'undefined' && userId !== 'null' && userId !== 'owner';

  // 2. Fallback to sub-collection if not found
  if (!adSnap.exists() && isValidUser) {
    adDocRef = doc(firestore, 'users', userId, 'ads', adId);
    adSnap = await getDoc(adDocRef);
  }

  // 3. Fallback to store products
  if (!adSnap.exists() && isValidUser) {
    const storeCollectionRef = collection(firestore, 'users', userId, 'store');
    const storeSnapshot = await getDocs(storeCollectionRef);
    if (!storeSnapshot.empty) {
        const storeId = storeSnapshot.docs[0].id;
        adDocRef = doc(firestore, 'users', userId, 'store', storeId, 'products', adId);
        adSnap = await getDoc(adDocRef);
    }
  }

  if (!adSnap.exists()) {
    return null;
  }

  const adData = adSnap.data() as Ad;
  const targetUserId = adData.userId || (isValidUser ? userId : '');
  
  // Fetch user profile if available
  if (targetUserId) {
    const userRef = doc(firestore, 'users', targetUserId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      adData.user = { id: userSnap.id, ...userSnap.data() } as UserProfile;
    }
  }

  return { ...adData, id: adSnap.id, userId: adData.userId || targetUserId || userId };
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

function cleanSeoDescription(text?: string): string {
  if (!text) return '';
  return text
    .replace(/[_=\-#*`~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId, adId } = await params;
  const ad = await getAdData(userId, adId);

  if (!ad) {
    return {
      title: 'الإعلان غير موجود | سوق العرب',
      robots: { index: false },
    };
  }

  // Clean description stripped of symbols, formatted for search snippets
  const cleanBody = cleanSeoDescription(ad.description);
  const locationText = [ad.city, ad.governorate, ad.country].filter(Boolean).join(' - ');
  const priceText = ad.price ? `السعر: ${ad.price.toLocaleString('ar-SA')} ${ad.currency || 'ريال'}` : '';
  
  const rawDescParts = [
    ad.title,
    locationText ? `في ${locationText}` : '',
    priceText,
    cleanBody
  ].filter(Boolean);

  const description = rawDescParts.join(' — ').substring(0, 160);

  const imageUrl = ad.imageUrls && ad.imageUrls.length > 0 ? ad.imageUrls[0] : 'https://www.arb-soq.com/og-image.png';
  const canonicalUrl = `https://www.arb-soq.com/ad/${userId}/${adId}`;

  // Rich keywords combining title tokens + brand + category + location
  const keywordParts = [
    ad.title,
    ad.brand,
    ad.category,
    ad.subcategory,
    ad.location,
    ad.city,
    ad.governorate,
    ad.country,
    'حراج السيارات',
    'سيارات للبيع',
    'سوق العرب',
    'إعلانات مبوبة',
  ].filter(Boolean) as string[];

  const isVehicle = (ad.category === 'vehicles' || ad.categoryId === 'vehicles' || Boolean(ad.brand));

  return {
    title: `${ad.title}${ad.city ? ` في ${ad.city}` : ''} | سوق العرب`,
    description,
    keywords: keywordParts,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: `${ad.title}${ad.city ? ` في ${ad.city}` : ''}`,
      description,
      images: [
        ...(ad.imageUrls && ad.imageUrls.length > 0
          ? ad.imageUrls.map((url) => ({ url, width: 1200, height: 630, alt: ad.title }))
          : [{ url: imageUrl, width: 1200, height: 630, alt: ad.title }]),
      ],
      type: isVehicle ? 'article' : 'website',
      locale: 'ar_SA',
      siteName: 'سوق العرب',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: ad.title,
      description,
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

  const canonicalUrl = `https://www.arb-soq.com/ad/${userId}/${adId}`;
  const currencyMap: Record<string, string> = { sa: 'SAR', eg: 'EGP', ae: 'AED', kw: 'KWD', qa: 'QAR', bh: 'BHD', om: 'OMR', jo: 'JOD' };
  const currency = ad.currency || currencyMap[ad.market || ''] || 'SAR';
  const isVehicle = (ad.category === 'vehicles' || ad.categoryId === 'vehicles' || Boolean(ad.brand));
  const cleanBody = cleanSeoDescription(ad.description);
  const sellerPhone = ad.phoneNumber || (ad as any).phone || ad.user?.phone || ad.user?.phoneNumber;

  // Rich Schema.org structured data (Car / Vehicle for cars, Product for other goods)
  const mainSchema = isVehicle
    ? {
        "@context": "https://schema.org",
        "@type": "Car",
        "name": ad.title,
        "description": cleanBody || ad.title,
        "url": canonicalUrl,
        ...(ad.imageUrls?.length && { "image": ad.imageUrls }),
        ...(ad.brand && {
          "brand": {
            "@type": "Brand",
            "name": ad.brand,
          },
        }),
        "model": ad.title,
        "itemCondition": ad.condition === 'new'
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
        ...(sellerPhone && { "telephone": sellerPhone }),
        "offers": {
          "@type": "Offer",
          "price": ad.price ?? 0,
          "priceCurrency": currency,
          "availability": "https://schema.org/InStock",
          "url": canonicalUrl,
          ...(ad.location && { "availableAtOrFrom": { "@type": "Place", "name": ad.location } }),
          "seller": {
            "@type": "AutoDealer",
            "name": ad.user?.name || ad.user?.fullName || 'معرض سيارات',
            ...(sellerPhone && { "telephone": sellerPhone }),
            ...(ad.city && {
              "address": {
                "@type": "PostalAddress",
                "addressLocality": ad.city,
                "addressCountry": ad.country || "SA",
              },
            }),
          },
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": ad.title,
        "description": cleanBody || ad.title,
        "url": canonicalUrl,
        ...(ad.imageUrls?.length && { "image": ad.imageUrls }),
        ...(ad.brand && {
          "brand": {
            "@type": "Brand",
            "name": ad.brand,
          },
        }),
        ...(ad.condition && {
          "itemCondition": ad.condition === 'new'
            ? "https://schema.org/NewCondition"
            : "https://schema.org/UsedCondition",
        }),
        ...(ad.user && {
          "seller": {
            "@type": "Person",
            "name": ad.user.name || ad.user.fullName || 'بائع',
            "url": `https://www.arb-soq.com/worker/${userId}`,
          },
        }),
        "offers": {
          "@type": "Offer",
          "price": ad.price ?? 0,
          "priceCurrency": currency,
          "availability": "https://schema.org/InStock",
          "url": canonicalUrl,
          ...(ad.location && { "availableAtOrFrom": { "@type": "Place", "name": ad.location } }),
        },
      };

  const breadcrumbsList = [
    { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": "https://www.arb-soq.com" },
    ...(isVehicle
      ? [
          { "@type": "ListItem", "position": 2, "name": "سيارات ومركبات", "item": "https://www.arb-soq.com/p/cars-auto" },
          ...(ad.brand ? [{ "@type": "ListItem", "position": 3, "name": ad.brand, "item": `https://www.arb-soq.com/p/cars-auto?brand=${encodeURIComponent(ad.brand)}` }] : []),
          { "@type": "ListItem", "position": ad.brand ? 4 : 3, "name": ad.title, "item": canonicalUrl },
        ]
      : [
          ...(ad.category ? [{ "@type": "ListItem", "position": 2, "name": ad.category, "item": `https://www.arb-soq.com/?category=${encodeURIComponent(ad.category)}` }] : []),
          { "@type": "ListItem", "position": ad.category ? 3 : 2, "name": ad.title, "item": canonicalUrl },
        ]),
  ];

  const jsonLd = [
    mainSchema,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbsList,
    },
  ];

  const serializedAd = serializeFirestoreData(ad);
  const serializedRelated = serializeFirestoreData(relatedAds);

  // JSON-LD script — shared across all view types
  const JsonLdScript = (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );

  if (viewType === 'shorts') {
    return (
      <>
        {JsonLdScript}
        <VideoFeed initialAdId={adId} initialViewMode="shorts" initialCategory={ad.category || ad.categoryId || 'all'} exitToHome={true} />
      </>
    );
  }

  if (viewType === 'video') {
    return (
      <div className="bg-background min-h-screen">
        {JsonLdScript}
        <RegularVideoPlayer ad={serializedAd} relatedAds={serializedRelated} />
      </div>
    );
  }

  return (
    <>
      {JsonLdScript}
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <AdDetailClient initialAd={serializedAd} />
      </Suspense>
    </>
  );
}
