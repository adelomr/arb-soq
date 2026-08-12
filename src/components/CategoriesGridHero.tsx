'use client';

import React from 'react';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';
import { useAuth } from '@/context/AuthContext';
import { getCategoryIcon } from '@/lib/data';
import { DEFAULT_ORGANIZED_CATEGORIES } from '@/lib/default-categories';
import { getCategorySlug } from '@/lib/category-utils';
import {
  ChevronLeft,
  ChevronDown,
  Grid,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function CategoriesGridHero() {
  const { market } = useMarket();
  const { categories: authCategories } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [showCategories, setShowCategories] = React.useState(false);
  const [subcatLimit, setSubcatLimit] = React.useState<number>(4);

  React.useEffect(() => {
    setMounted(true);
    const loadLimit = () => {
      const saved = localStorage.getItem('subcategories_display_limit');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) setSubcatLimit(parsed);
      }
    };
    loadLimit();
    window.addEventListener('subcat_limit_updated', loadLimit);
    return () => window.removeEventListener('subcat_limit_updated', loadLimit);
  }, []);

  // Use categories from Database (AuthContext) if available, otherwise use default structured dataset
  const activeCategories: Category[] = (authCategories && authCategories.length > 0)
    ? authCategories
    : DEFAULT_ORGANIZED_CATEGORIES;

  return (
    <section className="w-full bg-background border-b py-4 md:py-6" dir="rtl">
      <div className="container mx-auto px-4">
        {/* Top bar with Title & Toggle Categories Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground font-headline tracking-tight">
              استكشف أكبر سوق في <span className="text-primary">{market.name.ar}</span>
            </h1>
          </div>

          <Button
            onClick={() => setShowCategories(!showCategories)}
            variant="outline"
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg border-primary/40 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-xs"
          >
            {showCategories ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>إخفاء الفئات</span>
              </>
            ) : (
              <>
                <Grid className="h-4 w-4" />
                <span>أظهر جميع الفئات</span>
              </>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", showCategories && "rotate-180")} />
          </Button>
        </div>

        {/* Dynamic Categories Grid - Only rendered when showCategories is true */}
        {showCategories && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-8 pt-4 animate-in fade-in-50 duration-300">
            {activeCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon || 'Shapes', cat.id);
              const idLower = (cat.id || '').toLowerCase();
              const nameLower = (cat.name?.ar || '').toLowerCase();

              let catHref = `/p/${cat.id}`;
              if (idLower === 'vehicles' || nameLower.includes('سيار') || nameLower.includes('عربيا')) catHref = '/p/cars-auto-parts';
              else if (idLower === 'realestate' || nameLower.includes('عقار')) catHref = '/p/real-estate';
              else if (idLower === 'mobiles' || nameLower.includes('موبايل') || nameLower.includes('هاتف')) catHref = '/p/mobiles-tablets';
              else if (idLower === 'jobs' || nameLower.includes('وظائف')) catHref = '/p/jobs-careers';
              else if (idLower === 'furniture' || nameLower.includes('أثاث')) catHref = '/p/home-office-furniture';
              else if (idLower === 'electronics' || nameLower.includes('إلكترون') || nameLower.includes('كهربائ') || nameLower.includes('كهربا')) catHref = '/p/electronics-appliances';
              else if (idLower === 'fashion' || nameLower.includes('موضة')) catHref = '/p/fashion-beauty';
              else if (idLower === 'pets' || nameLower.includes('حيوان')) catHref = '/p/pets-animals';
              else if (idLower === 'baby' || nameLower.includes('أطفال')) catHref = '/p/baby-kids';
              else if (idLower === 'hobbies' || nameLower.includes('هوايات')) catHref = '/p/hobbies-sports';
              else if (idLower === 'trade' || nameLower.includes('تجارة')) catHref = '/p/commercial-industrial';
              else if (idLower === 'services' || nameLower.includes('خدمات')) catHref = '/p/professional-services';
              else if (idLower === 'crafts' || idLower === 'cat_1786316040524' || nameLower.includes('مهن') || nameLower.includes('حرف')) catHref = '/p/crafts-professions';

              const subitems = cat.subcategories || [];
              const visibleSubitems = subitems.slice(0, subcatLimit);

              return (
                <div key={cat.id} className="flex flex-col space-y-2.5">
                  {/* Category Header */}
                  <Link
                    href={catHref}
                    className="group flex items-center gap-2.5 text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors font-headline"
                  >
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-xs flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="leading-snug">{cat.name.ar}</span>
                  </Link>

                  {/* Subcategories List */}
                  <ul className="flex flex-col space-y-1.5 pr-7">
                    {visibleSubitems.map((sub) => {
                      const catSlug = getCategorySlug(cat.id);
                      const subHref = `/p/${catSlug}?sub=${sub.id}&q=${encodeURIComponent(sub.name.ar)}`;
                      return (
                        <li key={sub.id}>
                          <Link
                            href={subHref}
                            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
                          >
                            {sub.name.ar}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Category Footer All Link */}
                  <div className="pr-7 pt-1">
                    <Link
                      href={catHref}
                      className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors group"
                    >
                      <span>أظهر المزيد من {cat.name.ar}</span>
                      <ChevronLeft className="h-3.5 w-3.5 mr-0.5 group-hover:-translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
