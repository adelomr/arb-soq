'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/blog-service';
import BlogSidebar from './BlogSidebar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  BookOpen, 
  User, 
  Calendar, 
  ArrowLeft, 
  Eye, 
  Tag, 
  Filter, 
  X,
  Layers
} from 'lucide-react';

interface BlogListingClientProps {
  initialBlogs: BlogPost[];
}

export default function BlogListingClient({ initialBlogs }: BlogListingClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Most viewed blogs (sorted by views desc)
  const mostViewedBlogs = useMemo(() => {
    return [...initialBlogs]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, [initialBlogs]);

  // 2. Compute category counts
  const categoriesWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    initialBlogs.forEach((blog) => {
      const cat = blog.category?.trim();
      if (cat) {
        map.set(cat, (map.get(cat) || 0) + 1);
      } else if (blog.tags && blog.tags.length > 0 && blog.tags[0].trim()) {
        const fallbackCat = blog.tags[0].trim();
        map.set(fallbackCat, (map.get(fallbackCat) || 0) + 1);
      }
    });

    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [initialBlogs]);

  // 3. Filtered blogs based on search query and selected category
  const filteredBlogs = useMemo(() => {
    return initialBlogs.filter((blog) => {
      // Category filter
      if (selectedCategory) {
        const matchesCategory =
          blog.category === selectedCategory ||
          (blog.tags && blog.tags.includes(selectedCategory));
        if (!matchesCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = blog.title?.toLowerCase().includes(q);
        const matchesAuthor = blog.author?.toLowerCase().includes(q);
        const matchesContent = blog.content?.toLowerCase().includes(q);
        const matchesTags = blog.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesCat = blog.category?.toLowerCase().includes(q);

        return matchesTitle || matchesAuthor || matchesContent || matchesTags || matchesCat;
      }

      return true;
    });
  }, [initialBlogs, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12" dir="rtl">
      {/* Category Quick Filter Pills Bar */}
      {categoriesWithCounts.length > 0 && (
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground ml-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>تصفح حسب القسم:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            الكل ({initialBlogs.length})
          </button>

          {categoriesWithCounts.map((cat, idx) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Filter Notification Bar */}
      {(selectedCategory || searchQuery) && (
        <div className="mb-6 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 text-xs text-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">تصفية النتائج:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-md">
                <Tag className="w-3 h-3" />
                {selectedCategory}
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md">
                البحث: &quot;{searchQuery}&quot;
              </span>
            )}
            <span className="text-muted-foreground">({filteredBlogs.length} موضوع)</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery('');
            }}
            className="text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>إلغاء التصفية</span>
          </button>
        </div>
      )}

      {/* 2-Column Responsive Layout: Main Content (8 cols) + Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>
                {selectedCategory ? `مواضيع: ${selectedCategory}` : 'أحدث مواضيع المدونة'}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                ({filteredBlogs.length} موضوع)
              </span>
            </h2>
          </div>

          {filteredBlogs.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border p-6">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-bold text-foreground">لا توجد مواضيع مطابقة</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                لم يتم العثور على أي مقالات تطابق خيارات البحث الحالية. يمكنك إلغاء التصفية لعرض جميع المواضيع.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                عرض كل المواضيع
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBlogs.map((blog, index) => (
                <Link
                  href={`/blog/${blog.slug}`}
                  key={blog.id || blog.slug || index}
                  className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 border border-border hover:border-primary/40"
                >
                  {/* Image */}
                  <div className="relative w-full h-48 bg-muted overflow-hidden">
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

                    {/* Category Overlay Badge */}
                    {(blog.category || (blog.tags && blog.tags.length > 0)) && (
                      <div className="absolute top-3 right-3">
                        <span className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-md backdrop-blur-xs">
                          {blog.category || blog.tags?.[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {blog.title}
                    </h3>

                    <div
                      className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html:
                          (blog.content?.substring(0, 140).replace(/<[^>]+>/g, '') || '') + '...',
                      }}
                    />

                    {/* Metadata Footer */}
                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                      <div className="flex items-center gap-1.5 truncate max-w-[40%]">
                        <User className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium truncate">{blog.author}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          <span>{blog.views || 0}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>
                            {blog.createdAt?.seconds
                              ? format(new Date(blog.createdAt.seconds * 1000), 'd MMM yyyy', {
                                  locale: ar,
                                })
                              : 'حديثاً'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Read More Link */}
                    <div className="mt-3 flex items-center gap-1 text-primary text-xs md:text-sm font-semibold group-hover:gap-2 transition-all">
                      <span>اقرأ التفاصيل</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Area (4 cols, sticky on desktop) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <BlogSidebar
            mostViewedBlogs={mostViewedBlogs}
            categories={categoriesWithCounts}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      </div>
    </div>
  );
}
