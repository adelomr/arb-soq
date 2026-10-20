// =====================================================================
// blog/page.tsx — صفحة قائمة المدونة (Server Component)
// تجلب المقالات server-side لضمان فهرسة Google الكاملة
// =====================================================================

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getAllBlogs, getAuthorSettings } from '@/lib/blog-service';
import type { BlogPost, AuthorSettings } from '@/lib/blog-service';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogListingClient from '@/components/BlogListingClient';

const BASE_URL = 'https://www.arb-soq.com';

export const revalidate = 30; // إعادة التوليد كل 30 ثانية لتحديث المقالات فوراً

export const metadata: Metadata = {
  title: 'مدونة سوق العرب | مقالات ونصوص وشروحات وملفات قنوات',
  description:
    'اقرأ أحدث المقالات والأخبار من مدونة سوق العرب. ملفات قنوات محدثة، فلاشات، شروحات تقنية للأجهزة، ونصائح مفيدة للبيع والشراء.',
  keywords: [
    'مدونة سوق العرب',
    'ملفات قنوات',
    'فلاشات',
    'شروحات ريسيفرات',
    'نايل سات',
    'مقالات',
    'أخبار السوق',
  ],
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: `${BASE_URL}/blog`,
    siteName: 'سوق العرب',
    title: 'مدونة سوق العرب | مقالات ونصوص وشروحات وملفات قنوات',
    description: 'أحدث المقالات والأخبار التقنية، ملفات القنوات، الفلاشات والشروحات.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        secureUrl: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'مدونة سوق العرب',
      },
    ],
  },
};

// JSON-LD لقائمة المدونة
function getBlogListJsonLd(blogs: BlogPost[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'مدونة سوق العرب',
    url: `${BASE_URL}/blog`,
    description: 'أحدث المقالات والنصائح وملفات القنوات من سوق العرب',
    blogPost: blogs.slice(0, 10).map((blog) => ({
      '@type': 'BlogPosting',
      headline: blog.title,
      url: `${BASE_URL}/blog/${blog.slug}`,
      datePublished: blog.createdAt?.seconds
        ? new Date(blog.createdAt.seconds * 1000).toISOString()
        : new Date().toISOString(),
      author: { '@type': 'Person', name: blog.author || 'سوق العرب' },
      ...(blog.imageUrl && { image: blog.imageUrl }),
    })),
  };
}

function BlogListingLoadingFallback() {
  return (
    <div className="min-h-screen py-16 px-4 max-w-7xl mx-auto animate-pulse" dir="rtl">
      <div className="h-10 w-64 bg-muted rounded-2xl mx-auto mb-4" />
      <div className="h-6 w-96 bg-muted/60 rounded-xl mx-auto mb-10" />
      <div className="max-w-2xl mx-auto h-12 bg-muted/50 rounded-2xl mb-12" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-card rounded-2xl border border-border" />
          ))}
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="h-20 bg-card rounded-2xl border border-border" />
          <div className="h-72 bg-card rounded-2xl border border-border" />
        </div>
      </div>
    </div>
  );
}

interface BlogPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogListingPage(props: BlogPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const initialCategory =
    typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const initialQuery =
    typeof searchParams.q === 'string'
      ? searchParams.q
      : typeof searchParams.search === 'string'
      ? searchParams.search
      : undefined;

  // جلب المقالات وإعدادات المؤلف server-side
  const [blogs, authorSettings] = await Promise.all([
    getAllBlogs().catch(() => [] as BlogPost[]),
    getAuthorSettings().catch(() => null),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getBlogListJsonLd(blogs)) }}
      />

      <Header />

      <main className="flex-1 bg-background">
        <Suspense fallback={<BlogListingLoadingFallback />}>
          <BlogListingClient 
            initialBlogs={JSON.parse(JSON.stringify(blogs))} 
            authorSettings={authorSettings ? JSON.parse(JSON.stringify(authorSettings)) : null} 
            initialCategory={initialCategory}
            initialQuery={initialQuery}
          />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
