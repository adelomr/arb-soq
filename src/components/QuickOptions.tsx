'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { HardHat, Store, ChevronDown, LayoutGrid, X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
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
  const router = useRouter();
  const pathname = usePathname();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string>('all');

  const { getUsersWithStores, categories: authCategories, getPageUrlForCategory } = useAuth();
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

  // Use actual dynamic categories from Firebase/AuthContext
  const activeCategories: Category[] = (authCategories || []).filter(
    (c) => c.id !== 'stores' && c.id !== 'store-product'
  );

  const [isInteracting, setIsInteracting] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    setIsInteracting(true);
  };

  const handleTouchEnd = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 350);
  };

  const closeAllMenus = () => {
    setActiveMenuId(null);
  };

  const toggleMenu = (menuId: string) => {
    setActiveMenuId(prev => (prev === menuId ? null : menuId));
  };

  if (!isClient) {
    return <div className="bg-card border-b shadow-sm sticky top-20 z-30 h-14"></div>;
  }

  // All category items unified
  const allItems = [
    {
      id: 'all',
      name: t.all,
      icon: LayoutGrid,
      isAll: true,
      hasSubs: false,
      href: '/',
    },
    ...activeCategories.map((cat) => ({
      id: cat.id,
      name: cat.name?.ar || cat.id,
      icon: getCategoryIcon(cat.icon, cat.id),
      isAll: false,
      hasSubs: !!(cat.subcategories && cat.subcategories.length > 0),
      href: getPageUrlForCategory ? getPageUrlForCategory(cat.id, undefined, cat.name?.ar || cat.id) : `/search?q=${encodeURIComponent(cat.name?.ar || cat.id)}`,
      category: cat,
    })),
    {
      id: 'stores',
      name: t.stores,
      icon: Store,
      isStores: true,
      hasSubs: true,
      href: '/shops',
    },
  ];

  const pinnedItem = allItems.find(item => item.id === pinnedId) || allItems[0];
  const movingItems = allItems.filter(item => item.id !== pinnedId);

  const handleCategorySelect = (item: typeof allItems[0]) => {
    setPinnedId(item.id);

    if (item.id === 'all') {
      closeAllMenus();
      if (pathname !== '/') {
        router.push('/');
      }
    } else if (item.hasSubs || item.id === 'stores') {
      toggleMenu(item.id);
    } else {
      closeAllMenus();
      if (item.href) {
        router.push(item.href);
      }
    }
  };

  const handlePinnedClick = () => {
    if (pinnedId === 'all') {
      closeAllMenus();
      if (pathname !== '/') {
        router.push('/');
      }
    } else if (pinnedItem.hasSubs || pinnedId === 'stores') {
      toggleMenu(pinnedId);
    } else if (pinnedItem.href) {
      router.push(pinnedItem.href);
    }
  };

  const activeCategoryForMenu = activeCategories.find(c => c.id === activeMenuId);

  // Render moving items in the ticker
  const renderMovingItems = (prefix: string, isAriaHidden = false) => (
    <>
      {movingItems.map((item) => {
        const ItemIcon = item.icon;

        return (
          <Button
            key={`${prefix}-${item.id}`}
            variant="ghost"
            size="sm"
            tabIndex={isAriaHidden ? -1 : undefined}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 h-8.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
              "bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border/40 active:scale-95",
              item.isAll && "border-primary/50 text-primary font-bold bg-primary/10"
            )}
            onClick={() => handleCategorySelect(item)}
          >
            <ItemIcon className={cn("h-3.5 w-3.5 shrink-0", item.isAll && "text-primary")} />
            <span>{item.name}</span>
            {item.hasSubs && (
              <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
            )}
          </Button>
        );
      })}
    </>
  );

  return (
    <div className="bg-card border-b shadow-sm sticky top-20 z-30 w-full max-w-full overflow-hidden">
      <Collapsible open={!!activeMenuId}>
        {/* Mobile View: Professional Pinned Category Slot + Continuous Background Ticker */}
        <div className="md:hidden flex items-center relative w-full overflow-hidden py-2 bg-card select-none">
          
          {/* 1. Pinned Active Category Button (ثابتة في جانب الشاشة الأيمن بشكل موحد وواضح) */}
          <div className="relative z-20 shrink-0 pr-3 pl-1.5 flex items-center bg-card">
            <Button
              variant="default"
              size="sm"
              className={cn(
                "flex items-center gap-1.5 font-bold px-3 py-1.5 h-9 rounded-xl shadow-sm transition-all duration-200",
                "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 cursor-pointer"
              )}
              onClick={handlePinnedClick}
            >
              {React.createElement(pinnedItem.icon, { className: "h-4 w-4 shrink-0" })}
              <span className="text-xs font-bold whitespace-nowrap">{pinnedItem.name}</span>

              {/* Subcategories Chevron Indicator */}
              {(pinnedItem.hasSubs || pinnedItem.id === 'stores') && (
                <ChevronDown 
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200 shrink-0", 
                    activeMenuId === pinnedItem.id && "rotate-180"
                  )} 
                />
              )}

              {/* Quick Reset to 'All' if another category is pinned */}
              {pinnedId !== 'all' && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="الرجوع إلى الكل"
                  title="الرجوع إلى الكل"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPinnedId('all');
                    closeAllMenus();
                  }}
                  className="mr-0.5 p-0.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </Button>
          </div>

          {/* 2. Flowing Categories Ticker (الفئات تمر بسلاسة من خلف الفئة الثابتة) */}
          <div 
            className="relative flex-1 overflow-hidden group/ticker"
            dir="ltr"
            style={{ direction: 'ltr' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsInteracting(true)}
            onMouseLeave={() => setIsInteracting(false)}
          >
            {/* Right Edge Fade Overlay (تدرج خفيف عند خروج العناصر من خلف الزر الثابت دون لمس الزر) */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-card to-transparent z-10" />

            {/* Left Edge Fade Overlay */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent z-10" />

            {/* Continuous Marquee Track */}
            <div className="flex w-max items-center gap-2" dir="ltr" style={{ direction: 'ltr' }}>
              <div 
                className={cn(
                  "flex shrink-0 items-center gap-2 animate-marquee-ticker",
                  isInteracting && "[animation-play-state:paused]"
                )}
              >
                {renderMovingItems('mob-1')}
              </div>
              <div 
                className={cn(
                  "flex shrink-0 items-center gap-2 animate-marquee-ticker",
                  isInteracting && "[animation-play-state:paused]"
                )}
                aria-hidden="true"
              >
                {renderMovingItems('mob-2', true)}
              </div>
              <div 
                className={cn(
                  "flex shrink-0 items-center gap-2 animate-marquee-ticker",
                  isInteracting && "[animation-play-state:paused]"
                )}
                aria-hidden="true"
              >
                {renderMovingItems('mob-3', true)}
              </div>
              <div 
                className={cn(
                  "flex shrink-0 items-center gap-2 animate-marquee-ticker",
                  isInteracting && "[animation-play-state:paused]"
                )}
                aria-hidden="true"
              >
                {renderMovingItems('mob-4', true)}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop View: Standard scrollable navigation */}
        <div className="hidden md:block container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-2 scroll-smooth w-full flex-nowrap">
            {allItems.map((item) => {
              const ItemIcon = item.icon;
              const isPinned = pinnedId === item.id;
              const isOpen = activeMenuId === item.id;

              if (item.isAll) {
                return (
                  <Button 
                    key={`desktop-${item.id}`}
                    variant="ghost" 
                    className={cn(
                      "flex-shrink-0 flex items-center gap-2 font-bold px-4 py-2 rounded-lg transition-all",
                      isPinned && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
                    )}
                    onClick={() => handleCategorySelect(item)}
                  >
                    <ItemIcon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                );
              }

              if (item.hasSubs || item.id === 'stores') {
                return (
                  <Button
                    key={`desktop-${item.id}`}
                    variant="ghost"
                    className={cn(
                      "flex-shrink-0 flex items-center gap-2 font-semibold",
                      (isPinned || isOpen) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                    onClick={() => handleCategorySelect(item)}
                  >
                    <ItemIcon className="h-4 w-4" />
                    <span>{item.name}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
                  </Button>
                );
              }

              return (
                <Button
                  key={`desktop-${item.id}`}
                  variant="ghost"
                  className={cn(
                    "flex-shrink-0 flex items-center gap-2 font-semibold",
                    isPinned && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  )}
                  onClick={() => handleCategorySelect(item)}
                >
                  <ItemIcon className="h-4 w-4" />
                  <span>{item.name}</span>
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
              {activeCategoryForMenu && (
                <>
                  {/* Direct link to main category page */}
                  {(() => {
                    const mainCatName = activeCategoryForMenu.name?.ar || activeCategoryForMenu.id;
                    const mainCatHref = getPageUrlForCategory ? getPageUrlForCategory(activeCategoryForMenu.id, undefined, mainCatName) : `/search?q=${encodeURIComponent(mainCatName)}`;

                    return (
                      <Link href={mainCatHref} className="flex-shrink-0" onClick={closeAllMenus}>
                        <div className="px-4 py-2 h-9 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center whitespace-nowrap">
                          <span>عرض الكل</span>
                        </div>
                      </Link>
                    );
                  })()}

                  {activeCategoryForMenu.subcategories && activeCategoryForMenu.subcategories.map((sub, index) => {
                    const subName = typeof sub.name === 'string' ? sub.name : sub.name?.ar || sub.id;
                    const subHref = getPageUrlForCategory ? getPageUrlForCategory(activeCategoryForMenu.id, sub.id, subName) : `/search?q=${encodeURIComponent(subName)}`;

                    return (
                      <Link key={index} href={subHref} className="flex-shrink-0" onClick={closeAllMenus}>
                        <div className="px-4 py-2 h-9 rounded-xl bg-card border border-border/80 hover:border-primary hover:bg-primary/5 hover:text-primary font-semibold text-xs sm:text-sm transition-all shadow-2xs flex items-center justify-center whitespace-nowrap">
                          <span>{subName}</span>
                        </div>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
