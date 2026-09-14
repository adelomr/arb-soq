'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Ad } from '@/lib/types';
import AdCard from '@/components/AdCard';
import { Crown, Sparkles, Clock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackageAdsSliderProps {
  ads: Ad[];
  tier: 'gold' | 'silver' | 'latest' | 'used';
  title?: string;
  intervalSeconds?: number;
  className?: string;
  isSearchActive?: boolean; // شرط إيقاف التمرير عند استخدام البحث
}

export default function PackageAdsSlider({
  ads,
  tier,
  title,
  intervalSeconds = 5,
  className = '',
  isSearchActive = false,
}: PackageAdsSliderProps) {
  // Local circular queue of ads
  const [items, setItems] = useState<Ad[]>(ads);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [isSearchDetected, setIsSearchDetected] = useState(false);

  // Measured dimensions for smooth pixel-perfect translation
  const [cardWidth, setCardWidth] = useState(290);
  const [cardHeight, setCardHeight] = useState(420);

  const desktopCardRef = useRef<HTMLDivElement | null>(null);
  const mobileCardRef = useRef<HTMLDivElement | null>(null);

  const total = items.length;
  const durationMs = intervalSeconds * 1000;
  const GAP = 24; // gap-6 is 24px in Tailwind

  // Keep items synced if prop changes
  useEffect(() => {
    setItems(ads);
  }, [ads]);

  // شرط إيقاف التمرير: التحقق التلقائي إذا كان المستخدم يستخدم مربع البحث (تركيز أو كتابة نص أو وجود نتائج بحث)
  useEffect(() => {
    const checkSearchState = () => {
      // 1. التحقق من وجود معاملات بحث في الرابط
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const q = urlParams.get('q');
        if (q && q.trim().length > 0) {
          setIsSearchDetected(true);
          return;
        }
      }

      // 2. التحقق من أي حقل بحث في الصفحة (إذا كان الزائر يكتب فيه أو يحتوي على نص)
      const inputs = document.querySelectorAll('input');
      let foundActiveSearch = false;
      inputs.forEach((input) => {
        const isSearchField =
          input.type === 'search' ||
          (input.placeholder && (input.placeholder.includes('ابحث') || input.placeholder.includes('بحث'))) ||
          input.name?.toLowerCase().includes('search') ||
          input.id?.toLowerCase().includes('search');

        if (isSearchField) {
          if (document.activeElement === input || input.value.trim().length > 0) {
            foundActiveSearch = true;
          }
        }
      });

      setIsSearchDetected(foundActiveSearch);
    };

    checkSearchState();

    const handleEvent = () => checkSearchState();

    document.addEventListener('focusin', handleEvent);
    document.addEventListener('focusout', handleEvent);
    document.addEventListener('input', handleEvent);

    return () => {
      document.removeEventListener('focusin', handleEvent);
      document.removeEventListener('focusout', handleEvent);
      document.removeEventListener('input', handleEvent);
    };
  }, []);

  const isUserSearching = isSearchActive || isSearchDetected;

  // Measure card dimensions on mount and resize
  const measureCards = useCallback(() => {
    if (desktopCardRef.current) {
      const w = desktopCardRef.current.offsetWidth;
      if (w > 50) setCardWidth(w);
    }
    if (mobileCardRef.current) {
      const h = mobileCardRef.current.offsetHeight;
      if (h > 50) setCardHeight(h);
    }
  }, []);

  useEffect(() => {
    measureCards();
    window.addEventListener('resize', measureCards);
    return () => window.removeEventListener('resize', measureCards);
  }, [measureCards, items]);

  // Execute 1 smooth slide step
  const handleSlideNext = useCallback(() => {
    if (total <= 1 || isSliding) return;
    setIsSliding(true);
  }, [total, isSliding]);

  // When CSS transition ends: rotate array & reset transform instantly
  const handleTransitionEnd = useCallback(() => {
    if (!isSliding) return;
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
    setIsSliding(false);
  }, [isSliding]);

  // شرط إيقاف التمرير: يتوقف التمرير فوراً ومطلقاً عند استخدام البحث أو التفاعل
  useEffect(() => {
    if (total <= 1 || isInteracting || isUserSearching) return;

    const timer = setInterval(() => {
      handleSlideNext();
    }, durationMs);

    return () => clearInterval(timer);
  }, [total, isInteracting, isUserSearching, durationMs, handleSlideNext]);

  if (!ads || ads.length === 0) return null;

  const getHeaderIcon = () => {
    switch (tier) {
      case 'gold':
        return <Crown className="h-5 w-5" />;
      case 'silver':
        return <Sparkles className="h-5 w-5" />;
      case 'used':
        return <RotateCcw className="h-5 w-5" />;
      case 'latest':
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getBadgeStyle = () => {
    switch (tier) {
      case 'gold':
        return "bg-amber-500/10 border-amber-500/20 text-amber-500";
      case 'silver':
        return "bg-slate-500/10 border-slate-500/20 text-slate-500 dark:text-slate-300";
      case 'used':
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400";
      case 'latest':
      default:
        return "bg-primary/10 border-primary/20 text-primary";
    }
  };

  const getTitleColor = () => {
    switch (tier) {
      case 'gold':
        return "text-amber-600 dark:text-amber-400";
      case 'silver':
        return "text-slate-700 dark:text-slate-200";
      case 'used':
        return "text-emerald-600 dark:text-emerald-400";
      case 'latest':
      default:
        return "text-foreground";
    }
  };

  return (
    <section 
      className={cn("mb-10 content-auto", className)}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setIsInteracting(false)}
      dir="rtl"
    >
      {/* 1. Header: Original clean section title without any controls */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className={cn(
          "text-xl sm:text-2xl font-bold font-headline flex items-center gap-2.5",
          getTitleColor()
        )}>
          <span className={cn(
            "p-1.5 rounded-xl border flex items-center justify-center shadow-xs",
            getBadgeStyle()
          )}>
            {getHeaderIcon()}
          </span>
          <span>{title}</span>
        </h2>
      </div>

      {/* 2. Mobile View: True Smooth Vertical Scroll (من أسفل إلى أعلى) */}
      <div 
        className="block sm:hidden overflow-hidden rounded-2xl relative"
        style={{ height: cardHeight > 0 ? `${cardHeight}px` : 'auto' }}
      >
        <div 
          className="flex flex-col gap-6 will-change-transform"
          style={{
            transform: isSliding ? `translateY(-${cardHeight + GAP}px)` : 'translateY(0px)',
            transition: isSliding ? 'transform 800ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {items.slice(0, 4).map((ad, idx) => (
            <div 
              key={`mobile-${ad.id}-${idx}`} 
              ref={idx === 0 ? mobileCardRef : undefined}
              className="w-full shrink-0"
            >
              <AdCard ad={ad} priority={idx === 0} />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Desktop / Tablet View: True Smooth Horizontal Glide (تمرير أفقي انسيابي) */}
      <div className="hidden sm:block overflow-hidden rounded-2xl relative w-full">
        <div 
          className="flex flex-row gap-6 will-change-transform"
          style={{
            transform: isSliding ? `translateX(${cardWidth + GAP}px)` : 'translateX(0px)',
            transition: isSliding ? 'transform 800ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {items.map((ad, idx) => (
            <div 
              key={`desktop-${ad.id}-${idx}`} 
              ref={idx === 0 ? desktopCardRef : undefined}
              className="shrink-0 w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] xl:w-[calc((100%-72px)/4)]"
            >
              <AdCard ad={ad} priority={idx < 2} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
