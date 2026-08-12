'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { HardHat, Store, ChevronDown, LayoutGrid } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { markets } from '@/lib/markets';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile, Category } from '@/lib/types';
import { getCategoryIcon } from '@/lib/data';
import { DEFAULT_ORGANIZED_CATEGORIES } from '@/lib/default-categories';
import { getCategorySlug } from '@/lib/category-utils';

const translations = {
  ar: {
    all: "الكل",
    stores: "المتاجر",
    laborMarket: "سوق العمال",
    allStores: "جميع المتاجر",
  },
  en: {
    all: "All",
    stores: "Stores",
    laborMarket: "Labor Market",
    allStores: "All Stores",
  },
};

const FlagIcon = ({ code }: { code: string }) => (
  <Image 
    src={`https://flagcdn.com/w160/${code.toLowerCase()}.png`} 
    alt={`${code} flag`}
    width={48}
    height={36}
    className="w-12 h-auto rounded-md border border-border/50"
  />
);

export default function QuickOptions() {
  const [isClient, setIsClient] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const { getUsersWithStores, categories: authCategories } = useAuth();
  const [stores, setStores] = useState<(UserProfile & { id: string })[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      const usersWithStores = await getUsersWithStores();
      setStores(usersWithStores);
    };
    fetchStores();
  }, [getUsersWithStores]);

  // Use actual dynamic categories from Firebase/AuthContext if loaded, fallback to default organized categories dataset
  const activeCategories: Category[] = (authCategories && authCategories.length > 0)
    ? authCategories.filter(c => c.id !== 'stores' && c.id !== 'store-product')
    : DEFAULT_ORGANIZED_CATEGORIES;

  const closeAllMenus = () => {
    setActiveMenuId(null);
  };

  const toggleMenu = (menuId: string) => {
    setActiveMenuId(prev => (prev === menuId ? null : menuId));
  };

  if (!isClient) {
    return <div className="bg-card border-b shadow-sm sticky top-20 z-30 h-14"></div>;
  }

  const activeCategoryForMenu = activeCategories.find(c => c.id === activeMenuId);

  return (
    <div className="bg-card border-b shadow-sm sticky top-20 z-30">
      <Collapsible open={!!activeMenuId}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-2 scroll-smooth w-full flex-nowrap">

            {/* 1. "الكل" (All) - Homepage */}
            <Button 
              variant="ghost" 
              asChild
              className={cn(
                "flex-shrink-0 flex items-center gap-2 font-bold px-4 py-2 rounded-lg transition-all",
                !activeMenuId && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
              )}
            >
              <Link 
                href="/" 
                onClick={closeAllMenus}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>{t.all}</span>
              </Link>
            </Button>

            {/* 2. "المتاجر" (Stores) */}
            <Button 
              variant="ghost" 
              className={cn(
                "flex-shrink-0 flex items-center gap-2 font-bold",
                activeMenuId === 'stores' && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              )}
              onClick={() => toggleMenu('stores')}
            >
              <Store className="h-4 w-4" />
              <span>{t.stores}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", activeMenuId === 'stores' && "rotate-180")} />
            </Button>



            {/* 4. Actual Dynamic Categories */}
            {activeCategories.map((cat) => {
              const CategoryIcon = getCategoryIcon(cat.icon, cat.id);
              const catName = cat.name?.ar || cat.id;
              const hasSubs = cat.subcategories && cat.subcategories.length > 0;
              const isOpen = activeMenuId === cat.id;

              if (hasSubs) {
                return (
                  <Button
                    key={cat.id}
                    variant="ghost"
                    className={cn(
                      "flex-shrink-0 flex items-center gap-2 font-semibold",
                      isOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                    onClick={() => toggleMenu(cat.id)}
                  >
                    <CategoryIcon className="h-4 w-4" />
                    <span>{catName}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
                  </Button>
                );
              }

              return (
                <Button
                  key={cat.id}
                  variant="ghost"
                  asChild
                  className="flex-shrink-0 flex items-center gap-2 font-semibold"
                >
                  <Link href={`/p/${getCategorySlug(cat.id)}`} onClick={closeAllMenus}>
                    <CategoryIcon className="h-4 w-4" />
                    <span>{catName}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Subcategories Dropdown Area */}
        <CollapsibleContent className="py-4 animate-in slide-in-from-top-4 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">

              {/* Stores Submenu */}
              {activeMenuId === 'stores' && (
                <>
                  <Link href="/shops" className="flex-shrink-0" onClick={closeAllMenus}>
                    <Card className="flex flex-col items-center justify-center p-2 h-24 w-24 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                      <div className="p-2 rounded-full bg-primary/10 mb-1">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-xs font-semibold text-center w-full truncate">{t.allStores}</p>
                    </Card>
                  </Link>

                  {stores.map((storeProfile, index) => {
                    if (!storeProfile.store) return null;
                    return (
                      <Link key={index} href={`/store/${storeProfile.id}`} className="flex-shrink-0" onClick={closeAllMenus}>
                        <Card className="w-24 h-24 overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-1">
                          <Image
                            src={storeProfile.store.coverImageUrl || '/placeholder.png'}
                            alt={storeProfile.store.storeName}
                            layout="fill"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-end p-2">
                            <p className="text-xs font-bold text-white truncate w-full">{storeProfile.store.storeName}</p>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </>
              )}



              {/* Category Submenu */}
              {activeCategoryForMenu && activeCategoryForMenu.subcategories && (
                activeCategoryForMenu.subcategories.map((sub, index) => {
                  const SubIcon = getCategoryIcon(sub.icon, sub.id);
                  const subName = typeof sub.name === 'string' ? sub.name : sub.name?.ar || sub.id;
                  const catSlug = getCategorySlug(activeCategoryForMenu.id);
                  const subHref = `/p/${catSlug}?sub=${sub.id}&q=${encodeURIComponent(subName)}`;

                  return (
                    <Link key={index} href={subHref} className="flex-shrink-0" onClick={closeAllMenus}>
                      <Card className="flex flex-col items-center justify-center p-2 h-24 w-24 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                        <div className="p-2 rounded-full bg-secondary mb-1">
                          <SubIcon className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-xs font-semibold text-center w-full truncate">{subName}</p>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
