'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot, limit, collectionGroup, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Ad, UserProfile } from '@/lib/types';
import VideoCard from './VideoCard';
import VideoGrid from './VideoGrid';
import { Loader2, Film, ChevronLeft, ChevronRight, MapPin, Globe, Building, Home, User, PlusCircle, LayoutGrid, X, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import CategoryTicker from './CategoryTicker';
import { cn, safeParseDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RegularVideoPlayer from './RegularVideoPlayer';

const isShortVideo = (url: string | undefined): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('shorts') || lowerUrl.includes('tiktok.com') || lowerUrl.includes('reels') || lowerUrl.includes('/reel');
};

// Helper to get emoji for categories (replicated from CategoryTicker)
const getEmoji = (category: any) => {
  const emojiMap: Record<string, string> = {
    'عقارات': '🏠', 'سيارات': '🚗', 'وظائف': '💼', 'خدمات': '🔧',
    'معدات': '🏗️', 'تكنولوجيا': '📱', 'موبايلات': '📱', 'لابتوب': '💻',
    'اثاث': '🛋️', 'أثاث': '🛋️', 'منزل': '🏠', 'ديكور': '🖼️',
    'ملابس': '👕', 'موضة': '🛍️', 'اكسسوارات': '⌚', 'أكسسوارات': '⌚',
    'مطاعم': '🍴', 'اكل': '🍕', 'أكل': '🍕',
    'حيوانات': '🐕', 'اطفال': '👶', 'أطفال': '👶',
    'رياضة': '⚽', 'صحة': '🏥', 'سفر': '✈️', 'تعليم': '🎓',
    'زراعة': '🚜', 'صناعة': '🏭', 'ادوات': '🔧', 'أدوات': '🔧',
    'تجميل': '💄', 'كتب': '📚', 'موسيقى': '🎵', 'فن': '🎨',
    'تصوير': '📷', 'العاب': '🎮', 'ألعاب': '🎮',
    'نباتات': '🌿', 'حدائق': '🌿',
    'ترفيه': '🎭', 'ترفيهية': '🎭', 'ترفيهي': '🎭',
    'fishing': '🎣', 'صيد': '🎣', 'ادوات صيد': '🎣', 'أدوات صيد': '🎣',
    'فعاليات': '🎪', 'مناسبات': '🎉',
    'سينما': '🎬', 'افلام': '🎬', 'أفلام': '🎬',
    'مسرح': '🎭',
    'Car': '🚗', 'Home': '🏠', 'Building': '🏢', 'Briefcase': '💼', 'Wrench': '🔧', 'ShoppingBag': '🛍️', 'Utensils': '🍴', 'Tv': '📺'
  };
  
  const name = typeof category.name === 'string' ? category.name : (category.name?.ar || category.id || '');
  for (const [key, value] of Object.entries(emojiMap)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return category.icon || '📁';
};

interface VideoFeedProps {
  initialAdId?: string | null;
  initialViewMode?: 'grid' | 'shorts' | 'regular';
  initialCategory?: string;
  onClose?: () => void;
  exitToHome?: boolean;
}

export default function VideoFeed({ 
  initialAdId = null, 
  initialViewMode = 'grid', 
  initialCategory = 'all',
  onClose,
  exitToHome = false
}: VideoFeedProps = {}) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [initialLoading, setInitialLoading] = useState(true); // Only true on first mount
  const [isFiltering, setIsFiltering] = useState(false); // True when reloading due to filter change
  const [activeId, setActiveId] = useState<string | null>(initialAdId);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [locationScope, setLocationScope] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false); // Enable sound by default as user clicks into the feed
  const [viewMode, setViewMode] = useState<'grid' | 'shorts' | 'regular'>(initialViewMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [isFeedReady, setIsFeedReady] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const hasMounted = useRef(false); // Tracks if URL params have been read on mount
  const { userProfile, categories } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  // Stable ref for userProfile — the object reference changes on every auth re-render
  // but we only want to re-subscribe Firestore when uid actually changes.
  const userProfileRef = useRef(userProfile);
  useEffect(() => { userProfileRef.current = userProfile; }, [userProfile]);

  // 1. Initial State from URL — runs ONCE on mount only
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      const urlId = searchParams.get('id');
      const urlView = searchParams.get('view') as any;
      const urlCat = searchParams.get('cat');

      if (urlId) setActiveId(urlId);
      else if (initialAdId) setActiveId(initialAdId);

      if (urlView && ['grid', 'shorts', 'regular'].includes(urlView)) setViewMode(urlView);
      else if (initialViewMode) setViewMode(initialViewMode);

      if (urlCat) setSelectedCategory(urlCat);
      else if (initialCategory) setSelectedCategory(initialCategory);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps: intentionally only on mount

  // 2. Sync State to URL
  // KEY FIX: Use window.history.replaceState instead of router.replace().
  // router.replace() in Next.js App Router re-renders the entire component tree,
  // which re-fires the IntersectionObserver and creates an infinite update loop.
  // window.history.replaceState() silently updates the URL with NO re-render.
  useEffect(() => {
    if (!isFirstLoad.current) {
      const params = new URLSearchParams();
      
      if (activeId && viewMode !== 'grid') {
        const urlId = searchParams.get('id');
        // Prevent writing to URL if we are still waiting for the initial ID to settle
        if (isFirstLoad.current && urlId && activeId !== urlId) {
            // Keep waiting
        } else {
            params.set('id', activeId);
            params.set('view', viewMode);
        }
      }

      if (selectedCategory && selectedCategory !== 'all') {
        params.set('cat', selectedCategory);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      
      // Silently update URL without causing a Next.js re-render
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', newUrl);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, viewMode, selectedCategory, pathname]);
 
   // Calculate selected category data for the center indicator
   const selectedCategoryData = useMemo(() => {
     if (selectedCategory === 'all') return null;
     const cat = categories.find(c => c.id === selectedCategory);
     return cat ? { name: cat.name, emoji: getEmoji(cat) } : null;
   }, [selectedCategory, categories]);

  useEffect(() => {
    // Don't show full-screen loader on filter changes, only on first mount
    if (isFirstLoad.current) {
      setInitialLoading(true);
    } else {
      setIsFiltering(true);
    }
    
    // The Ultimate Index-Free Query: Fetch broadly and filter complex logic client-side
    const q = query(
      collectionGroup(firestore, 'ads'),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      
      // 1. Multi-Platform Media Filter
      adsData = adsData.filter(ad => 
        ad.adType === 'video' || 
        ad.adType === ('فيديو' as any) ||
        ad.adType === 'image' || 
        ad.adType === ('صوري' as any) ||
        (ad as any).videoUrl
      );

      // 2. Multi-Platform Active Status Filter
      adsData = adsData.filter(ad => 
        ad.status === 'active' || 
        ad.isActive === true ||
        (!ad.status && ad.isActive === undefined)
      );

      // 3. Multi-Platform Sorting
      adsData.sort((a, b) => {
        const timeA = a.timestamp || safeParseDate(a.postedAt).getTime();
        const timeB = b.timestamp || safeParseDate(b.postedAt).getTime();
        return (timeB as number) - (timeA as number);
      });

      // 4. Handle Category Logic
      const currentCategory = selectedCategory;
      if (currentCategory !== 'all') {
        if (viewMode === 'shorts') {
          // Prioritize selected category instead of filtering it out
          adsData.sort((a, b) => {
            const aMatch = a.category === currentCategory || a.categoryId === currentCategory;
            const bMatch = b.category === currentCategory || b.categoryId === currentCategory;
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });
        } else {
          // In grid view, we strictly filter as per standard UX
          adsData = adsData.filter(ad => ad.category === currentCategory || ad.categoryId === currentCategory);
        }
      }

      // 5. Filter by Hierarchical Location
      // Use ref to get stable userProfile snapshot (not the reactive state)
      const profile = userProfileRef.current;
      if (locationScope !== 'all' && profile) {
        adsData = adsData.filter(ad => {
          if (ad.village && ad.village !== '') {
            return profile.village === ad.village && locationScope === 'village';
          }
          if (ad.city && ad.city !== '') {
            return profile.city === ad.city && (locationScope === 'city' || locationScope === 'village');
          }
           if (ad.governorate && ad.governorate !== '') {
            return (profile.province === ad.governorate || profile.governorate === ad.governorate) && 
                   (locationScope === 'governorate' || locationScope === 'city' || locationScope === 'village');
          }
          return true;
        });
      }
      
      // 6. Filter by Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        adsData = adsData.filter(ad => 
          ad.title?.toLowerCase().includes(query) || 
          ad.description?.toLowerCase().includes(query)
        );
      }

      const processAds = async () => {
        const enrichedAds = await Promise.all(adsData.map(async (ad) => {
          if (ad.userId && !ad.user) {
            try {
              const userRef = doc(firestore, 'users', ad.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                // Map common phone fields to phoneNumber for consistency in VideoCard
                const resolvedPhone = userData.phoneNumber || userData.phone || userData.userPhone || '';
                return { 
                    ...ad, 
                    user: { id: userSnap.id, ...userData, phoneNumber: resolvedPhone } as UserProfile 
                };
              }
            } catch (e) {
              console.error("Error fetching user for ad:", ad.id, e);
            }
          }
          return ad;
        }));

        setAds(enrichedAds);


        if (enrichedAds.length > 0) {
          setActiveId(currentId => {
            // Priority 1: URL parameter (highest source of truth for direct links)
            const urlId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null;
            if (urlId) {
              const urlAdExists = enrichedAds.some(a => a.id === urlId);
              // IF the ad exists in current data, we MUST return it.
              // IF it doesn't exist YET, we return it anyway to keep the state stable 
              // and prevent jumping to enrichedAds[0].
              return urlId;
            }

            // Priority 2: Component Prop 
            if (initialAdId) return initialAdId;

            // Priority 3: Current valid selection (from user scroll/interaction)
            const currentAdExists = enrichedAds.some(a => a.id === currentId);
            if (currentId && currentAdExists) return currentId;

            // Final Priority: Default to first ad ONLY if no target was ever specified
            if (isFirstLoad.current && !urlId && !initialAdId) {
              return enrichedAds[0].id;
            }
            return currentId;
          });
        }
        isFirstLoad.current = false;
        setInitialLoading(false);
        setIsFiltering(false);
        setIsTransitioning(false); // Stop any pending transitions
      };

      processAds();
    }, (error) => {
      console.error("Firestore Error:", error);
      setInitialLoading(false);
      setIsFiltering(false);
    });

    return () => unsubscribe();
  // userProfile replaced with userProfile?.id — the object reference changes every render
  // but the id string only changes on actual login/logout. This prevents infinite re-subscription.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, locationScope, userProfile?.id, searchQuery]);

  // Robust Intersection Observer for shorts view
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Ref callback: called every time the scroll container mounts OR unmounts.
  // This is the KEY fix — a static useRef does not trigger effects when
  // the element appears after being absent (e.g., switching from empty → non-empty).
  const setupObserver = (container: HTMLDivElement | null) => {
    // Store the element
    (feedRef as any).current = container;

    // Tear down any old observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!container || viewMode !== 'shorts') return;

    // Build a fresh observer rooted on this container
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isTransitioning) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-ad-id');
            if (id) setActiveId(id);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    container.querySelectorAll('.video-snap-item').forEach((el) =>
      observerRef.current?.observe(el)
    );

    // Scroll to the active ad and then reveal
    if (activeId) {
      // Use a recursive search for the target to ensure we wait for it to be in the DOM
      const findAndScroll = (attempts = 0) => {
        const target = container.querySelector(`[data-ad-id="${activeId}"]`);
        if (target) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
          setTimeout(() => {
            setIsTransitioning(false);
            setIsFeedReady(true);
          }, 400); // Wait for browser to finish scroll
        } else if (attempts < 10) {
          setTimeout(() => findAndScroll(attempts + 1), 50);
        } else {
          setIsTransitioning(false);
          setIsFeedReady(true);
        }
      };
      findAndScroll();
    } else {
      setIsTransitioning(false);
      setIsFeedReady(true);
    }
  };

  // Keep observer in sync when ads list or activeId changes but the 
  // container is already mounted (normal scrolling between existing ads).
  useEffect(() => {
    if (viewMode !== 'shorts') {
      if (observerRef.current) observerRef.current.disconnect();
      return;
    }
    const container = feedRef.current;
    if (!container) return;

    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isTransitioning) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-ad-id');
            if (id) setActiveId(id);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    container.querySelectorAll('.video-snap-item').forEach((el) =>
      observerRef.current?.observe(el)
    );

    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [ads, viewMode, isTransitioning]);


  const handleCategorySelect = (category: string) => {
    // Allow re-selecting 'all' even if already selected (no-op guard removed for 'all')
    if (category === selectedCategory && category !== 'all') return;
    
    setSelectedCategory(category);
    
    // Only trigger a visual transition if there are currently videos being shown.
    // If the list is empty, there is no feedRef scroller, so we must NOT set
    // isTransitioning=true or the screen will freeze in opacity-0 permanently.
    if (viewMode === 'shorts' && ads.length > 0) {
        setIsTransitioning(true);
    }
  };

  const { shortsAds, regularAds } = useMemo(() => {
    const shorts: Ad[] = [];
    const regular: Ad[] = [];
    
    // Sort ads: premium first, then by timestamp (newest first, already done by Firestore but we ensure premium overrides)
    const sortedAds = [...ads].sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        return 0; // Keep existing order for the rest
    });

    sortedAds.forEach(ad => {
      if (isShortVideo(ad.videoUrl)) {
        shorts.push(ad);
      } else {
        regular.push(ad);
      }
    });
    return { shortsAds: shorts, regularAds: regular };
  }, [ads]);

  const handleVideoClick = (id: string) => {
    setActiveId(id);
    const clickedAd = ads.find(a => a.id === id);
    if (clickedAd && isShortVideo(clickedAd.videoUrl)) {
        setViewMode('shorts');
    } else {
        setViewMode('regular');
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (exitToHome) {
      router.push('/');
    } else {
      setViewMode('grid');
    }
  };

  const clearTransition = () => {
    setIsTransitioning(false);
    handleClose();
  };

  // Only show full-screen loader on FIRST mount
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] bg-background text-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium animate-pulse">جاري تحميل سوق بلدنا...</p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-64px)] min-h-[500px] bg-background flex flex-col w-full text-foreground overflow-hidden">
      {/* Universal Top Navigation & Filtering Bar */}
      <div 
          onMouseEnter={() => viewMode === 'shorts' && setShowNav(true)}
          onMouseLeave={() => viewMode === 'shorts' && setShowNav(false)}
          className={cn(
          "transition-all duration-500 shrink-0",
          viewMode === 'shorts' 
            ? "fixed top-0 left-0 right-0 z-[110] bg-black/90 md:bg-black/40 backdrop-blur-xl pt-4 pb-2 border-b border-white/10" 
            : "relative z-50 bg-background border-b border-border shadow-xl pt-3 pb-2"
      )}>
        <div className="max-w-[1600px] mx-auto px-4 space-y-4">
            {/* Horizontal Navigation Bar (Location Right | Category Center | Search Left) */}
            {viewMode === 'grid' && (
                <div id="video-feed-nav" className="flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    
                    {/* A. Far Right: Location Scope Selector */}
                    <div className="flex-1 flex justify-end order-1 md:order-3">
                        <div className="flex bg-secondary/30 backdrop-blur-xl rounded-full p-1 border border-border shadow-md transition-transform hover:scale-[1.02]">
                            {[
                                { id: 'all', label: 'الكل', icon: Globe },
                                { id: 'governorate', label: userProfile?.province || userProfile?.governorate || 'المحافظة', icon: MapPin },
                                { id: 'city', label: userProfile?.city || 'المدينة', icon: Building },
                                { id: 'village', label: userProfile?.village || 'القرية', icon: Home },
                            ].map((scope) => {
                                const Icon = scope.icon;
                                const isSelected = locationScope === scope.id;
                                return (
                                    <button
                                        key={scope.id}
                                        onClick={() => setLocationScope(scope.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 whitespace-nowrap",
                                            isSelected 
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                                                : "hover:bg-secondary text-muted-foreground/70 hover:text-foreground"
                                        )}
                                    >
                                        <Icon className={cn("w-3 h-3", isSelected ? "animate-pulse" : "text-primary")} />
                                        <span className={isSelected ? "block" : "hidden lg:block"}>{scope.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* B. Center: Selected Category Indicator */}
                    <div className="flex-1 flex justify-center order-2">
                        {selectedCategoryData ? (
                            <div className="flex items-center gap-3 px-5 py-2 rounded-2xl bg-primary/10 border border-primary/30 text-primary animate-in zoom-in-90 duration-300 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]">
                                <span className="text-xl select-none leading-none">{selectedCategoryData.emoji}</span>
                                <span className="text-sm font-black tracking-wide whitespace-nowrap">{selectedCategoryData.name?.ar || selectedCategory}</span>
                                <button
                                    className="p-1 hover:bg-secondary rounded-full transition-colors"
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-primary/20 border border-primary/40 text-primary animate-in zoom-in-90 duration-300 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]">
                                <span className="text-xl select-none leading-none">📁</span>
                                <span className="text-sm font-black tracking-wide whitespace-nowrap">عرض الكل</span>
                            </div>
                        )}
                    </div>

                    {/* C. Far Left: Professional Search Bar */}
                    <div className="flex-1 flex justify-start order-3 md:order-1">
                        <div className="relative group/search w-full max-w-[280px]">
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-primary group-focus-within/search:text-foreground transition-colors animate-in zoom-in duration-500" />
                            </div>
                            <input
                                type="search"
                                placeholder="بحث ذكي..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-secondary/30 border border-border text-foreground rounded-2xl py-2.5 pr-11 pl-4 text-xs focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none placeholder:text-foreground/40 transition-all backdrop-blur-3xl group-hover/search:bg-secondary/50"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Category Ticker - Hidden in grid view as per user request */}
            {viewMode !== 'grid' && (
                <CategoryTicker 
                    selectedCategory={selectedCategory} 
                    onSelect={handleCategorySelect} 
                />
            )}
        </div>
      </div>

      {/* VIEW 1: YOUTUBE STYLE GRID */}
      {viewMode === 'grid' && (
        <div className="flex-1 relative w-full h-full overflow-hidden">
            <div className="w-full h-full overflow-y-auto custom-scrollbar pb-20 pt-4 px-2 md:px-0">
                <div className="max-w-[1800px] mx-auto">
                    <div className="px-6 md:px-8 mb-4">
                          <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-breath shadow-lg shadow-primary/20">
                                 <Film className="w-5 h-5 text-primary-foreground" />
                             </div>
                             سوق بلدنا
                          </h1>
                    </div>
                    {/* Inline filter loader — doesn't unmount the ticker */}
                    {isFiltering ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="mr-3 text-muted-foreground">جاري التصفية...</span>
                        </div>
                    ) : ads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                                <Film className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">لا توجد إعلانات في هذه الفئة</h2>
                            <p className="text-muted-foreground text-sm">جرّب فئة أخرى أو تحقق لاحقاً</p>
                        </div>
                    ) : (
                         <>
                             <VideoGrid shortsAds={shortsAds} regularAds={regularAds} onVideoClick={handleVideoClick} />
                         </>
                     )}
                </div>
            </div>
        </div>
      )}

      {/* VIEW 2: SHORTS / TIKTOK STYLE FEED - Changed to fixed for better stability */}
      {viewMode === 'shorts' && (
        <div className={cn(
            "fixed inset-0 z-[100] bg-black flex justify-center overflow-x-visible transition-opacity duration-300 w-full h-full",
            isTransitioning ? "opacity-0" : "opacity-100"
        )}>
            {/* Top Navigation Overlay Elements - Positioned below the fixed bar */}
            <div className="absolute top-40 left-6 right-6 flex justify-between items-center z-[60]">
                {/* Close/Back Button (Right Side) */}
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleClose}
                    className="order-2 w-12 h-12 shadow-2xl rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all hover:rotate-90 active:scale-95"
                >
                    <X className="w-6 h-6" />
                </Button>

                {/* Left Side Spacer or Secondary Context */}
                <div className="order-1 flex items-center gap-2">
                    <Film className="w-5 h-5 text-white/40" />
                    <span className="text-white/60 text-xs font-black tracking-widest uppercase">سوق بلدنا</span>
                </div>
            </div>


            {/* Invisible Top Sensor Zone (Triggers Nav Reveal) */}
            <div 
                className="absolute top-0 left-0 right-0 h-24 z-[105]" 
                onMouseEnter={() => setShowNav(true)}
            />

            {/* Main Shorts Content/Scroller */}
            {shortsAds.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full h-full text-center px-10 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                        <Film className="w-10 h-10 text-white/20" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">لا توجد إعلانات حالياً</h3>
                    <p className="text-white/40 text-sm mb-10 max-w-[250px] leading-relaxed">
                        عذراً، هذه الفئة لا تحتوي على أي فيديوهات قصيرة في الوقت الحالي. يمكنك تصفح الفيديوهات العادية.
                    </p>
                    <Button 
                        variant="secondary" 
                        onClick={handleClose}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 h-12 rounded-2xl backdrop-blur-md"
                    >
                        العودة للرئيسية
                    </Button>
                </div>
            ) : (
                <div 
                    ref={setupObserver}
                    className="w-full max-w-[700px] h-full overflow-y-scroll overflow-x-visible snap-y snap-mandatory hide-scrollbar relative flex flex-col items-center md:bg-transparent bg-neutral-900"
                    style={{ height: '100%', scrollSnapType: 'y mandatory' }}
                >
                    {shortsAds.map((ad) => (
                        <div 
                            key={ad.id} 
                            data-ad-id={ad.id}
                            className="video-snap-item w-[450px] md:w-[500px] max-w-full h-full snap-start snap-always relative overflow-visible flex shrink-0"
                            style={{ height: '100%', flex: '0 0 100%' }}
                        >
                            <VideoCard 
                                ad={ad} 
                                isActive={viewMode === 'shorts' && activeId === ad.id && isFeedReady} 
                                isMuted={isMuted}
                                onToggleMute={() => setIsMuted(!isMuted)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* VIEW 3: REGULAR YOUTUBE-STYLE PLAYER */}
      {viewMode === 'regular' && activeId && (
        <RegularVideoPlayer 
           ad={ads.find(a => a.id === activeId)!} 
           onClose={clearTransition} 
           relatedAds={ads.filter(a => a.id !== activeId).slice(0, 12)}
           onAdSelect={handleVideoClick}
           selectedCategory={selectedCategory}
           onCategorySelect={handleCategorySelect}
        />
      )}

      <style>{`
        .animate-breath {
            animation: breath 1.2s ease-in-out infinite alternate;
        }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.4);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
