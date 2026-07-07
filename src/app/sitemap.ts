import { MetadataRoute } from 'next';
import { firestore } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sooq-elarab.com';

  // 1. Static Routes
  const staticRoutes = [
    '',
    '/pricing',
    '/services',
    '/sooq-baladna',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Fetch all ads
  let adRoutes: any[] = [];
  try {
    const adsSnapshot = await getDocs(collection(firestore, 'ads'));
    adRoutes = adsSnapshot.docs.map((doc) => {
        const ad = doc.data();
        return {
            url: `${baseUrl}/ad/${ad.userId}/${doc.id}`,
            lastModified: new Date(ad.postedAt || Date.now()),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        };
    });
  } catch (e) {
    console.error("Error fetching ads for sitemap:", e);
  }

  // 3. Fetch all workers
  let workerRoutes: any[] = [];
  try {
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    workerRoutes = usersSnapshot.docs
        .filter(doc => doc.data().profession && doc.data().phoneVerified)
        .map((doc) => ({
            url: `${baseUrl}/worker/${doc.id}`,
            lastModified: new Date(), // Could be updated if we track last edit
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));
  } catch (e) {
    console.error("Error fetching workers for sitemap:", e);
  }

  return [...staticRoutes, ...adRoutes, ...workerRoutes];
}
