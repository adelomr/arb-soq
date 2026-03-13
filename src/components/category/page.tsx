

'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdCard from '@/components/AdCard';
import AdRow from '@/components/AdRow'; // Import the new component
import { getCategoryIcon } from '@/lib/data';
import { notFound, useSearchParams, useParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PackageSearch, Grid, List } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useMarket } from '@/context/MarketContext';
import React, { useEffect, useState, Fragment } from 'react';
import type { Category, Ad } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AdPlaceholder } from '../Adsense';

const translations = {
    ar: {
        browse: "تصفح",
        adsInCategory: "إعلان في فئة",
        noAds: "لا توجد إعلانات",
        noAdsDescription: "لا توجد إعلانات في هذه الفئة حتى الآن. كن أول من يضيف واحدًا!",
        loading: "جارٍ التحميل...",
        gridView: "عرض الشبكة",
        listView: "عرض القائمة",
    },
    en: {
        browse: "Browse",
        adsInCategory: "ads in the category",
        noAds: "No Ads Found",
        noAdsDescription: "There are no ads in this category yet. Be the first to add one!",
        loading: "Loading...",
        gridView: "Grid View",
        listView: "List View",
    }
}

export default function CategoryPage() {
  const params = useParams();
  const pageId = params.id as string;
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parent');

  const { language } = useLanguage();
  const { market } = useMarket();
  const t = translations[language];
  const { categories, loading: authLoading, getAds } = useAuth();

  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [currentSubcategory, setCurrentSubcategory] = useState<any | null>(null);
  const [isSubcategory, setIsSubcategory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adsInCategory, setAdsInCategory] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    if (!authLoading) {
      let foundCategory;
      let foundSubcategory;
      let subcategoryFlag = false;
      let categoriesForAdFetch: string[] = [];

      if (parentId) {
        const parentCategory = categories.find((cat) => cat.id === parentId);
        if (parentCategory) {
          foundSubcategory = parentCategory.subcategories?.find((sub) => sub.id === pageId);
          foundCategory = parentCategory;
          if (foundSubcategory) {
            categoriesForAdFetch = [foundSubcategory.id];
          }
        }
        subcategoryFlag = !!foundSubcategory;
      } else {
        foundCategory = categories.find((cat) => cat.id === pageId);
        if (foundCategory) {
           categoriesForAdFetch.push(foundCategory.id);
           if (foundCategory.subcategories && foundCategory.subcategories.length > 0) {
               categoriesForAdFetch.push(...foundCategory.subcategories.map(sub => sub.id));
           }
        }
      }

      setCurrentCategory(foundCategory || null);
      setCurrentSubcategory(foundSubcategory || null);
      setIsSubcategory(subcategoryFlag);
      setIsLoading(false);

      if (!foundCategory && !foundSubcategory) {
        notFound();
      }

      // Fetch ads
      if (categoriesForAdFetch.length > 0) {
        setAdsLoading(true);
        const unsubscribe = getAds({ market: market.id, status: 'active', categories: categoriesForAdFetch }, (fetchedAds) => {
          setAdsInCategory(fetchedAds);
          setAdsLoading(false);
        });
        return () => unsubscribe();
      } else {
          setAdsInCategory([]);
          setAdsLoading(false);
      }
    }
  }, [pageId, parentId, categories, authLoading, getAds, market.id]);

  // Exclude services page from generic category rendering
  if (pageId === 'services') {
    notFound();
  }

  const getIcon = () => {
    if (isSubcategory && currentSubcategory) return getCategoryIcon(currentSubcategory.icon);
    if (currentCategory) return getCategoryIcon(currentCategory.icon);
    return PackageSearch; // Fallback
  };

  const getName = () => {
    if (isSubcategory && currentSubcategory) return currentSubcategory.name[language];
    if (currentCategory) return currentCategory.name[language];
    return '';
  };
  
  const CategoryIcon = getIcon();
  const categoryName = getName();

  const renderAdGrid = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {adsInCategory.map(ad => <AdCard key={ad.id} ad={ad} />)}
        </div>
    );
  };
  
   const renderAdList = () => {
    return (
      <div className="space-y-4">
        {adsInCategory.map(ad => (
          <AdRow key={ad.id} ad={ad} />
        ))}
      </div>
    );
  };

  if (isLoading || authLoading) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-background">
                <section className="bg-secondary/50 py-8">
                    <div className="container mx-auto px-4 text-center">
                        <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                        <Skeleton className="h-12 w-1/3 mx-auto mb-2" />
                        <Skeleton className="h-6 w-1/4 mx-auto" />
                    </div>
                </section>
                <section className="py-8 md:py-12">
                    <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background">
        <section className="bg-secondary/50 py-8">
            <div className="container mx-auto px-4 text-center">
                <CategoryIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold font-headline capitalize">
                    {categoryName}
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                    {t.browse} {adsInCategory.length} {t.adsInCategory} {categoryName}.
                </p>
            </div>
        </section>
        
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Button
                        variant={view === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setView('grid')}
                        aria-label={t.gridView}
                    >
                        <Grid className="h-5 w-5" />
                    </Button>
                    <Button
                        variant={view === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setView('list')}
                        aria-label={t.listView}
                    >
                        <List className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {adsLoading ? (
                <div className={cn(
                  "grid gap-6",
                  view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
                )}>
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className={view === 'grid' ? 'h-80 w-full' : 'h-36 w-full'} />)}
                </div>
            ) : adsInCategory.length > 0 ? (
              view === 'grid' ? renderAdGrid() : renderAdList()
            ) : (
                <div className="flex justify-center">
                    <Alert className="max-w-lg text-center">
                        <PackageSearch className="h-6 w-6 mx-auto mb-2" />
                        <AlertTitle>{t.noAds}</AlertTitle>
                        <AlertDescription>
                            {t.noAdsDescription}
                        </AlertDescription>
                    </Alert>
                </div>
            )}
          </div>
        </section>

        <section className="py-8 bg-background">
            <div className="container mx-auto px-4">
                <AdPlaceholder />
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
