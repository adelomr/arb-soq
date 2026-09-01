'use client';

import React, { useState, useMemo } from 'react';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { getCategoryIcon } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Shapes, Search, X, FolderTree } from 'lucide-react';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
  allCategories: "جميع الفئات",
  browseAll: "تصفح وابحث في جميع الفئات والأقسام المتاحة في السوق.",
};

const normalizeArabic = (text: string): string => {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
};

export default function AllCategoriesPage() {
  const { categories, loading: authLoading, getPageUrlForCategory } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!searchQuery.trim()) return categories;

    const norm = normalizeArabic(searchQuery);
    return categories.filter((cat) => {
      const catName = cat.name?.ar || cat.id;
      const catNameNorm = normalizeArabic(catName);
      if (catNameNorm.includes(norm)) return true;

      // Check subcategories
      if (cat.subcategories && cat.subcategories.length > 0) {
        return cat.subcategories.some((sub) => {
          const subName = typeof sub.name === 'string' ? sub.name : sub.name?.ar || sub.id;
          return normalizeArabic(subName).includes(norm);
        });
      }

      return false;
    });
  }, [categories, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-right" dir="rtl">
      <Header />
      <main className="flex-1">
        {/* Hero Section with Dedicated Category Search */}
        <section className="bg-gradient-to-b from-primary/10 via-accent/5 to-background py-10 md:py-14 text-center border-b border-border/40">
          <div className="container mx-auto px-4 max-w-3xl space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-1">
              <Shapes className="h-10 w-10 md:h-12 md:w-12" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold font-headline tracking-tight text-foreground">
              {t.allCategories}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              {t.browseAll}
            </p>

            {/* Professional Search Input */}
            <div className="relative max-w-lg mx-auto w-full pt-2">
              <div className="relative flex items-center shadow-md hover:shadow-lg rounded-2xl bg-white dark:bg-card border-2 border-border/80 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15 transition-all">
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                  <Search className="h-5 w-5" />
                </div>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن فئة رئيسية أو قسم فرعي..."
                  className="w-full h-12 md:h-14 pr-11 pl-10 text-xs sm:text-sm md:text-base font-medium bg-transparent border-none outline-none focus:outline-none placeholder:text-muted-foreground rounded-2xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                    aria-label="مسح البحث"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {searchQuery.trim() && (
                <div className="flex items-center justify-between mt-2 px-1 text-xs text-muted-foreground">
                  <span>نتائج البحث عن: &quot;{searchQuery}&quot;</span>
                  <Badge variant="secondary" className="text-2xs font-bold bg-primary/10 text-primary border-none">
                    {filteredCategories.length} فئة مطابقة
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            {authLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-muted-foreground text-sm">
                  لم يتم العثور على فئات مطابقة لـ &quot;{searchQuery}&quot;
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>إعادة عرض جميع الفئات</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredCategories.map((category) => {
                  const CategoryIcon = getCategoryIcon(category.icon);
                  const catName = category.name?.ar || category.id;
                  const href = getPageUrlForCategory
                    ? getPageUrlForCategory(category.id, undefined, catName)
                    : category.id === 'stores'
                    ? '/shops'
                    : `/search?q=${encodeURIComponent(catName)}`;
                  const subCount = category.subcategories?.length || 0;

                  return (
                    <Link key={category.id} href={href} className="w-full group">
                      <Card className="flex flex-col items-center justify-center p-4 h-32 text-center transition-all bg-card hover:bg-primary/5 hover:border-primary/50 hover:shadow-md hover:-translate-y-1 rounded-2xl border border-border">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary mb-2.5 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <CategoryIcon className="h-6 w-6" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-center w-full truncate text-foreground group-hover:text-primary transition-colors">
                          {catName}
                        </p>
                        {subCount > 0 && (
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            {subCount} أقسام فرعية
                          </span>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
