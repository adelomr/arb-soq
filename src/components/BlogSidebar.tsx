'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/blog-service';
import { 
  Flame, 
  Eye, 
  Calendar, 
  Tag, 
  BookOpen, 
  FolderOpen, 
  ChevronLeft,
  Search,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CategoryWithCount {
  name: string;
  count: number;
}

interface BlogSidebarProps {
  mostViewedBlogs: BlogPost[];
  categories?: CategoryWithCount[];
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

export default function BlogSidebar({
  mostViewedBlogs,
  categories = [],
  selectedCategory = null,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  className = '',
}: BlogSidebarProps) {
  return (
    <aside className={`space-y-6 ${className}`} dir="rtl">
      {/* Search Widget (Optional, if handlers provided) */}
      {onSearchChange !== undefined && (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-xs">
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث في المقالات والمواضيع..."
              className="w-full pr-10 pl-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground text-right"
              dir="rtl"
            />
          </div>
        </div>
      )}

      {/* Widget 1: Most Viewed Blogs (المدونات الأكثر مشاهدة) */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        {/* Header with vibrant flame icon */}
        <div className="p-4 border-b border-border/60 bg-gradient-to-l from-amber-500/10 via-primary/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-red-500 text-white flex items-center justify-center shadow-xs">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base leading-tight">
                المدونات الأكثر مشاهدة
              </h3>
              <p className="text-[11px] text-muted-foreground">المقالات الأكثر قراءة وإقبالاً</p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>

        {/* Most Viewed List */}
        <div className="divide-y divide-border/40 p-2">
          {mostViewedBlogs.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              لا توجد مقالات لعرضها حالياً
            </div>
          ) : (
            mostViewedBlogs.slice(0, 5).map((blog, index) => {
              const rank = index + 1;
              return (
                <Link
                  key={blog.id || blog.slug || index}
                  href={`/blog/${blog.slug}`}
                  className="group flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200"
                >
                  {/* Rank Badge */}
                  <div className="shrink-0 mt-0.5">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black shadow-xs ${
                        rank === 1
                          ? 'bg-amber-500 text-white ring-2 ring-amber-400/40'
                          : rank === 2
                          ? 'bg-slate-500 text-white'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-muted text-muted-foreground font-semibold'
                      }`}
                    >
                      {rank}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/60">
                    {blog.imageUrl ? (
                      <Image
                        src={blog.imageUrl}
                        alt={blog.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/40">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Category or First Tag */}
                    {(blog.category || (blog.tags && blog.tags[0])) && (
                      <span className="inline-block text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md mb-1 truncate max-w-full">
                        {blog.category || blog.tags?.[0]}
                      </span>
                    )}

                    {/* Title */}
                    <h4 className="text-xs md:text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {blog.title}
                    </h4>

                    {/* Meta Info: Views & Date */}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                        <Eye className="w-3 h-3" />
                        <span>{blog.views || 0}</span>
                      </span>

                      {blog.createdAt?.seconds && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(blog.createdAt.seconds * 1000), 'd MMM', {
                              locale: ar,
                            })}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Widget 2: Categories / Labels (الأقسام والتسميات) */}
      {categories.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border/60 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-foreground text-base">أقسام المدونة</h3>
            </div>
            {selectedCategory && onSelectCategory && (
              <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className="text-xs text-primary hover:underline font-medium"
              >
                عرض الكل
              </button>
            )}
          </div>

          <div className="p-3 space-y-1">
            {onSelectCategory && (
              <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  <span>جميع المواضيع والأقسام</span>
                </span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {categories.map((cat, idx) => {
              const isSelected = selectedCategory === cat.name;
              return onSelectCategory ? (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? null : cat.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              ) : (
                <Link
                  key={idx}
                  href={`/blog?category=${encodeURIComponent(cat.name)}`}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {cat.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
