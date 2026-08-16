import { Metadata } from 'next';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import AdLogPageClient from '@/components/AdLogPageClient';
import { Ad, UserProfile } from '@/lib/types';
import { notFound } from 'next/navigation';
import { serializeFirestoreData } from '@/lib/utils';

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

  if (!adSnap.exists()) return null;

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId, adId } = await params;
  const ad = await getAdData(userId, adId);

  if (!ad) {
    return {
      title: 'السجل | الإعلان غير موجود | سوق العرب',
      robots: { index: false },
    };
  }

  return {
    title: `السجل | ${ad.title} | سوق العرب`,
    description: `سجل النشاط وإحصائيات المشاهدات ونقرات الاتصال والواتساب لإعلان: ${ad.title}`,
    robots: { index: false },
  };
}

export default async function AdLogPage({ params }: Props) {
  const { userId, adId } = await params;
  const ad = await getAdData(userId, adId);

  if (!ad) {
    notFound();
  }

  const serializedAd = serializeFirestoreData(ad) as Ad;

  return <AdLogPageClient initialAd={serializedAd} />;
}
