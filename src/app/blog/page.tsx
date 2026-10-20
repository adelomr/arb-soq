// =====================================================================
// blog/page.tsx — صفحة قائمة المدونة (Server Component)
// تجلب المقالات server-side لضمان فهرسة Google الكاملة
// =====================================================================

import type { Metadata } from 'next';
import { getAllBlogs } from '@/lib/blog-service';
import type { BlogPost } from '@/lib/blog-service';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BookOpen, User, Calendar, ArrowLeft, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogListingClient from '@/components/BlogListingClient';

const BASE_URL = 'https://www.arb-soq.com';

export const revalidate = 300; // إعادة التوليد كل 5 دقائق

export const metadata: Metadata = {
  title: 'مدونة سوق العرب | مقالات ونصائح للبيع والشراء',
  description:
    'اقرأ أحدث المقالات والأخبار من مدونة سوق العرب. نصائح مفيدة للبيع والشراء، أخبار السوق، ومراجعات المنتجات في الوطن العربي.',
  keywords: ['مدونة سوق العرب', 'مقالات', 'نصائح تسوق', 'أخبار السوق', 'بيع وشراء'],
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: `${BASE_URL}/blog`,
    siteName: 'سوق العرب',
    title: 'مدونة سوق العرب | مقالات ونصائح للبيع والشراء',
    description: 'أحدث المقالات والأخبار التقنية ونصائح مفيدة لتجربة تسوق أفضل.',
    images: [{ url: `${BASE_URL}/og-image.png`, secureUrl: `${BASE_URL}/og-image.png`, width: 1200, height: 630, type: 'image/png', alt: 'مدونة سوق العرب' }],
  },
};

// JSON-LD لقائمة المدونة
function getBlogListJsonLd(blogs: BlogPost[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'مدونة سوق العرب',
    url: `${BASE_URL}/blog`,
    description: 'أحدث المقالات والنصائح من سوق العرب',
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

export default async function BlogListingPage() {
  // جلب المقالات server-side — مرئية لـ Google مباشرةً
  const blogs = await getAllBlogs().catch(() => [] as BlogPost[]);

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getBlogListJsonLd(blogs)) }}
      />

      <Header />

      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border/50 py-14 px-4">
          <div className="max-w-6xl mx-auto text-center" dir="rtl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <BookOpen className="w-4 h-4" />
              المدونة
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              مدونة سوق العرب
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              أحدث المقالات والأخبار التقنية ونصائح مفيدة لتجربة تسوق أفضل.
            </p>
          </div>
        </div>

        {/* Articles & Sidebar Section */}
        <BlogListingClient initialBlogs={blogs} />
      </main>

      <Footer />
    </div>
  );
}
