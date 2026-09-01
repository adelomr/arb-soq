'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMarket } from '@/context/MarketContext';
import { useAuth } from '@/context/AuthContext';
import { getCategoryIcon } from '@/lib/data';
import {
  ChevronLeft,
  ChevronDown,
  Grid,
  EyeOff,
  Search,
  X,
  Sparkles,
  FolderTree
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SearchCategoryItem {
  id: string;
  name: string;
  type: 'main' | 'sub';
  icon: string;
  href: string;
  parentName?: string;
  parentHref?: string;
  subCount?: number;
}

// Helper to normalize Arabic characters for fuzzy matching
const normalizeArabic = (text: string): string => {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel/diacritics
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
};

export default function CategoriesGridHero() {
  const router = useRouter();
  const { market } = useMarket();
  const { categories: authCategories, getPageUrlForCategory } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [subcatLimit, setSubcatLimit] = useState<number>(4);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  // Handle clicking outside of the search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use categories from Database (AuthContext)
  const activeCategories: Category[] = authCategories || [];

  // Build searchable index of main categories and subcategories
  const searchableCategories = useMemo<SearchCategoryItem[]>(() => {
    const items: SearchCategoryItem[] = [];
    activeCategories.forEach((cat) => {
      const catName = cat.name?.ar || cat.id;
      const catHref = getPageUrlForCategory ? getPageUrlForCategory(cat.id, undefined, catName) : `/search?q=${encodeURIComponent(catName)}`;
      const subitems = cat.subcategories || [];

      // Main category
      items.push({
        id: `main-${cat.id}`,
        name: catName,
        type: 'main',
        icon: cat.icon || 'Shapes',
        href: catHref,
        subCount: subitems.length,
      });

      // Subcategories
      subitems.forEach((sub) => {
        const subName = typeof sub.name === 'string' ? sub.name : sub.name?.ar || sub.id;
        const subHref = getPageUrlForCategory ? getPageUrlForCategory(cat.id, sub.id, subName) : `/search?q=${encodeURIComponent(subName)}`;
        items.push({
          id: `sub-${cat.id}-${sub.id}`,
          name: subName,
          type: 'sub',
          icon: cat.icon || 'Shapes',
          href: subHref,
          parentName: catName,
          parentHref: catHref,
        });
      });
    });
    return items;
  }, [activeCategories, getPageUrlForCategory]);

  // Filtered categories based on query
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return [];

    const normQuery = normalizeArabic(query);
    return searchableCategories
      .filter((item) => {
        const normName = normalizeArabic(item.name);
        const normParent = item.parentName ? normalizeArabic(item.parentName) : '';
        return normName.includes(normQuery) || normParent.includes(normQuery);
      })
      .sort((a, b) => {
        const normA = normalizeArabic(a.name);
        const normB = normalizeArabic(b.name);
        const aStarts = normA.startsWith(normQuery);
        const bStarts = normB.startsWith(normQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        if (a.type === 'main' && b.type === 'sub') return -1;
        if (a.type === 'sub' && b.type === 'main') return 1;
        return 0;
      })
      .slice(0, 8);
  }, [searchQuery, searchableCategories]);

  // Navigate to selected category
  const handleSelect = (href: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);
    router.push(href);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || filteredCategories.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim()) {
        e.preventDefault();
        handleSelect(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
      return;
    }

    const totalOptions = filteredCategories.length + 1; // +1 for the general search fallback item

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev <= 0 ? totalOptions - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredCategories.length) {
        handleSelect(filteredCategories[selectedIndex].href);
      } else if (selectedIndex === filteredCategories.length || selectedIndex === -1) {
        handleSelect(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  // Highlight search term in results
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const normQuery = normalizeArabic(query);
    const normText = normalizeArabic(text);
    const index = normText.indexOf(normQuery);
    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <>
        {before}
        <span className="font-extrabold text-primary underline decoration-primary/40 underline-offset-2 bg-primary/10 px-0.5 rounded">
          {match}
        </span>
        {after}
      </>
    );
  };

  if (mounted && activeCategories.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-full relative z-20 bg-background border-b py-4 md:py-6 overflow-visible" dir="rtl">
      <div className="container mx-auto px-4 overflow-visible">
        {/* Top bar with Title & Action Controls */}
        <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-foreground font-headline tracking-tight">
              استكشف أكبر سوق في <span className="text-primary">{market.name.ar}</span>
            </h1>
          </div>

          {/* Action Row: Professional Category Search Box & Toggle Categories Button */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Category Search Input with Autocomplete Suggestions */}
            <div ref={searchContainerRef} className="relative z-40 flex-1 md:w-72 lg:w-80">
              <div className="relative flex items-center">
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                    setSelectedIndex(-1);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) {
                      setIsSearchOpen(true);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="ابحث في الفئات والأقسام..."
                  className="h-10 pr-9 pl-8 text-xs sm:text-sm bg-muted/40 hover:bg-muted/60 focus:bg-background border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg transition-all duration-200"
                />
                
                {/* Search Icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Search className="h-4 w-4 text-primary/70" />
                </div>

                {/* Clear Button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                      setSelectedIndex(-1);
                      searchInputRef.current?.focus();
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80 transition-colors"
                    aria-label="مسح البحث"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {isSearchOpen && searchQuery.trim().length > 0 && (
                <div className="absolute top-full right-0 left-0 sm:left-auto sm:w-88 md:w-96 mt-1.5 z-[100] bg-white dark:bg-card border-2 border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 isolate">
                  {/* Dropdown Header */}
                  <div className="px-3.5 py-2.5 bg-muted border-b border-border flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>الفئات المقترحة</span>
                    </span>
                    {filteredCategories.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-none font-bold">
                        {filteredCategories.length} نتيجة
                      </Badge>
                    )}
                  </div>

                  {/* Results List */}
                  {filteredCategories.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-border/40 bg-white dark:bg-card">
                      {filteredCategories.map((item, idx) => {
                        const Icon = getCategoryIcon(item.icon, item.id);
                        const isSelected = selectedIndex === idx;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelect(item.href)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={cn(
                              "w-full text-right flex items-center justify-between p-2.5 sm:p-3 transition-colors group bg-white dark:bg-card",
                              isSelected ? "bg-primary/10 text-primary dark:bg-primary/20" : "hover:bg-muted/70 text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={cn(
                                  "p-1.5 rounded-lg flex items-center justify-center shrink-0 transition-all",
                                  item.type === 'main'
                                    ? "bg-primary/15 text-primary group-hover:scale-105"
                                    : "bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>

                              <div className="flex flex-col min-w-0 text-right">
                                <span className="text-xs sm:text-sm font-bold truncate leading-snug">
                                  {highlightMatch(item.name, searchQuery)}
                                </span>
                                {item.type === 'sub' && item.parentName && (
                                  <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                    <FolderTree className="h-3 w-3 text-muted-foreground/70" />
                                    <span>قسم:</span>
                                    <span className="font-medium text-foreground/80">{item.parentName}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 pr-2">
                              {item.type === 'main' ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary font-medium border-none">
                                  فئة رئيسية
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground font-normal">
                                  فرعية
                                </Badge>
                              )}
                              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:-translate-x-0.5 transition-transform" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center bg-white dark:bg-card">
                      <p className="text-xs text-muted-foreground mb-2">
                        لم يتم العثور على فئة مطابقة لـ &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  )}

                  {/* General Search Action Footer */}
                  <div className={cn(
                    "p-2 bg-muted/60 border-t border-border",
                    selectedIndex === filteredCategories.length && "bg-primary/15"
                  )}>
                    <button
                      type="button"
                      onClick={() => handleSelect(`/search?q=${encodeURIComponent(searchQuery.trim())}`)}
                      onMouseEnter={() => setSelectedIndex(filteredCategories.length)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>البحث العام عن &quot;{searchQuery}&quot; في جميع الإعلانات</span>
                      <ChevronLeft className="h-3 w-3 mr-auto" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Categories Button */}
            <Button
              onClick={() => setShowCategories(!showCategories)}
              variant="outline"
              className="shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg border-primary/40 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-xs h-10"
            >
              {showCategories ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span className="hidden xs:inline">إخفاء الفئات</span>
                  <span className="xs:hidden">إخفاء</span>
                </>
              ) : (
                <>
                  <Grid className="h-4 w-4" />
                  <span className="hidden xs:inline">أظهر جميع الفئات</span>
                  <span className="xs:hidden">الفئات</span>
                </>
              )}
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", showCategories && "rotate-180")} />
            </Button>
          </div>
        </div>

        {/* Dynamic Categories Grid - Only rendered when showCategories is true */}
        {showCategories && (
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-8 pt-4 animate-in fade-in-50 duration-300">
            {activeCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon || 'Shapes', cat.id);
              const catName = cat.name?.ar || cat.id;
              const catHref = getPageUrlForCategory ? getPageUrlForCategory(cat.id, undefined, catName) : `/search?q=${encodeURIComponent(catName)}`;

              const subitems = cat.subcategories || [];
              const visibleSubitems = subitems.slice(0, subcatLimit);

              return (
                <div key={cat.id} className="flex flex-col space-y-2.5">
                  {/* Category Header */}
                  <Link
                    href={catHref}
                    className="group flex items-center gap-2 text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors font-headline"
                  >
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-xs flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="leading-snug">{catName}</span>
                  </Link>

                  {/* Subcategories List */}
                  <ul className="flex flex-col space-y-1.5 pr-7">
                    {visibleSubitems.map((sub) => {
                      const subName = typeof sub.name === 'string' ? sub.name : sub.name?.ar || sub.id;
                      const subHref = getPageUrlForCategory ? getPageUrlForCategory(cat.id, sub.id, subName) : `/search?q=${encodeURIComponent(subName)}`;
                      return (
                        <li key={sub.id}>
                          <Link
                            href={subHref}
                            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
                          >
                            {subName}
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
                      <span>أظهر المزيد من {catName}</span>
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
