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
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'مدونة سوق العرب' }],
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

        {/* Articles Grid */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {blogs.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border" dir="rtl">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-xl font-medium text-muted-foreground">لا توجد مقالات بعد</h2>
              <p className="text-sm text-muted-foreground mt-2">سيتم إضافة محتوى قريباً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" dir="rtl">
              {blogs.map((blog, index) => (
                <Link
                  href={`/blog/${blog.slug}`}
                  key={blog.id}
                  className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/30"
                >
                  {/* Image */}
                  <div className="relative w-full h-52 bg-muted overflow-hidden">
                    {blog.imageUrl ? (
                      <Image
                        src={blog.imageUrl}
                        alt={blog.title}
                        fill
                        priority={index < 2}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <BookOpen className="w-12 h-12 text-primary/30" />
                      </div>
                    )}
                    {/* Tag overlay */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="text-xs font-medium bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow">
                          {blog.tags[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h2 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {blog.title}
                    </h2>
                    <div
                      className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: (blog.content?.substring(0, 130).replace(/<[^>]+>/g, '') || '') + '...',
                      }}
                    />

                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium">{blog.author}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>
                          {blog.createdAt?.seconds
                            ? format(new Date(blog.createdAt.seconds * 1000), 'd MMMM, yyyy', { locale: ar })
                            : 'حديثاً'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span>{blog.views || 0}</span>
                      </div>
                    </div>

                    {/* Read More */}
                    <div className="mt-3 flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                      <span>اقرأ المزيد</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
