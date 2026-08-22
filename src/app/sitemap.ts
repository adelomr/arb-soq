import { MetadataRoute } from 'next';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export const revalidate = 3600; // إعادة التوليد كل ساعة

const BASE_URL = 'https://www.arb-soq.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // 1. الصفحات الثابتة الأساسية (الأعلى أولوية)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shops`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/sooq-baladna`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 2. صفحات الهبوط والصفحات المنشورة (أولوية عالية لإعلانات جوجل)
  let pageRoutes: MetadataRoute.Sitemap = [];
  try {
    const pagesSnapshot = await getDocs(collection(firestore, 'pages'));
    pageRoutes = pagesSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .filter((page) => page.isPublished && page.slug && !['redirect'].includes(page.slug))
      .map((page) => ({
        url: `${BASE_URL}/p/${page.slug}`,
        lastModified: page.updatedAt?.seconds
          ? new Date(page.updatedAt.seconds * 1000)
          : new Date(),
        changeFrequency: (page.pageType === 'landing' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
        priority: page.pageType === 'landing' ? 0.95 : 0.7,
      }));
  } catch (e) {
    console.error('Error fetching pages for sitemap:', e);
  }

  // 3. مقالات المدونة
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const blogsSnapshot = await getDocs(collection(firestore, 'blogs'));
    blogRoutes = blogsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .filter((blog) => blog.isPublished !== false && blog.slug)
      .map((blog) => ({
        url: `${BASE_URL}/blog/${blog.slug}`,
        lastModified: blog.updatedAt?.seconds
          ? new Date(blog.updatedAt.seconds * 1000)
          : blog.createdAt?.seconds
          ? new Date(blog.createdAt.seconds * 1000)
          : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.85,
      }));
  } catch (e) {
    console.error('Error fetching blogs for sitemap:', e);
  }

  // 4. صفحات المتاجر الموثقة الفردية
  let storeRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/store/gulf-fashion-store-demo`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];
  try {
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    const dynamicStores = usersSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return data.store && data.store.storeName;
      })
      .map((doc) => ({
        url: `${BASE_URL}/store/${doc.id}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }));
    storeRoutes = [...storeRoutes, ...dynamicStores];
  } catch (e) {
    console.error('Error fetching stores for sitemap:', e);
  }

  // 5. صفحات الإعلانات النشطة (أعلى أولوية لأنها المحتوى الرئيسي)
  let adRoutes: MetadataRoute.Sitemap = [];
  try {
    const adsSnapshot = await getDocs(
      query(collection(firestore, 'ads'), where('status', '==', 'active'))
    );
    adRoutes = adsSnapshot.docs.map((doc) => {
      const ad = doc.data();
      let lastMod = new Date();
      if (ad.updatedAt?.seconds) lastMod = new Date(ad.updatedAt.seconds * 1000);
      else if (ad.postedAt) lastMod = new Date(ad.postedAt);
      else if (ad.createdAt?.seconds) lastMod = new Date(ad.createdAt.seconds * 1000);

      return {
        url: `${BASE_URL}/ad/${ad.userId}/${doc.id}`,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: ad.isPromoted ? 0.9 : 0.8,
      };
    });
  } catch (e) {
    console.error('Error fetching ads for sitemap:', e);
  }

  // 6. صفحات العمال المتحقق منهم
  let workerRoutes: MetadataRoute.Sitemap = [];
  try {
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    workerRoutes = usersSnapshot.docs
      .filter((doc) => doc.data().profession && doc.data().phoneVerified)
      .map((doc) => ({
        url: `${BASE_URL}/worker/${doc.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
  } catch (e) {
    console.error('Error fetching workers for sitemap:', e);
  }

  return [
    ...staticRoutes,
    ...storeRoutes,  // صفحات المتاجر
    ...pageRoutes,   // صفحات الهبوط
    ...blogRoutes,   // مقالات المدونة
    ...adRoutes,     // الإعلانات النشطة
    ...workerRoutes, // العمال
  ];
}
