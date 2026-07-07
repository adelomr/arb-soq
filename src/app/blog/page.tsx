'use client';

import { useEffect, useState } from 'react';
import { getAllBlogs } from "@/lib/blog-service";
import type { BlogPost } from "@/lib/blog-service";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Plus, BookOpen, Calendar, User, Tag, ArrowLeft, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });
const QuickOptions = dynamic(() => import('@/components/QuickOptions'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

export default function BlogListingPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    getAllBlogs().then((data) => {
      setBlogs(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <QuickOptions />
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
            {isAdmin && (
              <Link href="/admin" className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md">
                <Plus className="w-5 h-5" />
                إضافة موضوع جديد
              </Link>
            )}
          </div>
        </div>

        {/* Articles Grid (Centered layout without sidebar since newsletter is homepage-only) */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                  <div className="h-48 bg-muted" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border" dir="rtl">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-medium text-muted-foreground">لا توجد مقالات بعد</h3>
              <p className="text-sm text-muted-foreground mt-2">سيتم إضافة محتوى قريباً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" dir="rtl">
              {blogs.map((blog) => (
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
                        __html: (blog.content?.substring(0, 130).replace(/<[^>]+>/g, '') || '') + '...'
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
