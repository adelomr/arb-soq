'use client';

// =====================================================================
// HomeClient.tsx — الجزء التفاعلي من الصفحة الرئيسية (Client Component)
// يحتوي على: قائمة الإعلانات، الفلترة، الموقع، المدونة، المشاركة
// =====================================================================

import Image from 'next/image';
import Link from 'next/link';
import { appIconUrl } from '@/lib/data';
import AdRow from '@/components/AdRow';
import Header from '@/components/Header';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMarket } from '@/context/MarketContext';
import type { Ad } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { isAdInMarket } from '@/lib/category-utils';
import { Skeleton } from '@/components/ui/skeleton';
import SearchForm from '@/components/SearchForm';
import dynamic from 'next/dynamic';
import { AdPlaceholder } from '@/components/Adsense';
import AdSlot from '@/components/AdSlot';
import { Button } from '@/components/ui/button';
import { Grid, List, BookOpen, User, Calendar, ChevronLeft, Share2, Facebook, Twitter, Eye } from 'lucide-react';
import AdCard from '@/components/AdCard';
import { cn } from '@/lib/utils';
import { getRecentBlogs, BlogPost } from '@/lib/blog-service';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useView } from '@/context/ViewContext';

const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });
const QuickOptions = dynamic(() => import('@/components/QuickOptions'), {
  ssr: false,
  loading: () => <div className="h-14 w-full" aria-hidden="true" />,
});
const RelatedAdsSidebar = dynamic(() => import('@/components/RelatedAdsSidebar'), {
  ssr: false,
  loading: () => <div className="w-full h-80 bg-muted/20 animate-pulse rounded-xl" aria-hidden="true" />,
});
const StoreSidebarSection = dynamic(() => import('@/components/StoreSidebarSection'), {
  ssr: false,
  loading: () => <div className="w-full h-60 bg-muted/20 animate-pulse rounded-xl" aria-hidden="true" />,
});
const CategoriesGridHero = dynamic(() => import('@/components/CategoriesGridHero'), {
  ssr: false,
  loading: () => <div className="w-full h-16 bg-background" aria-hidden="true" />,
});
const FeaturedStoresSection = dynamic(() => import('@/components/FeaturedStoresSection'), {
  ssr: false,
  loading: () => <div className="w-full h-72 bg-muted/20 animate-pulse rounded-2xl my-6" aria-hidden="true" />,
});

const WhatsappIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5">
      <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12c0 2.136.558 4.136 1.532 5.875L0 24l6.285-1.511A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.963 0-3.792-.535-5.356-1.467l-.385-.228-3.977.955.985-3.878-.249-.4A9.81 9.81 0 012.182 12c0-5.414 4.404-9.818 9.818-9.818 5.414 0 9.818 4.404 9.818 9.818 0 5.414-4.404 9.818-9.818 9.818z"/>
    </svg>
);

const t = {
    title: "أكبر سوق عربي للبيع والشراء",
    subtitle: "أفضل سوق لاكتشاف صفقات مذهلة أو نشر إعلاناتك الخاصة مجانًا.",
    promotedAds: "إعلانات مميزة",
    latestAds: "أحدث الإعلانات",
    usedMarket: "سوق المستعمل",
    cars: "سيارات",
    properties: "عقارات",
    gridView: "عرض الشبكة",
    listView: "عرض القائمة",
    recentTopicsTitle: "أحدث الموضوعات والمقالات",
    viewAllTopics: "عرض جميع المقالات",
};

// Haversine formula to calculate distance between two points
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function HomeClient() {
  const { market, userLocation } = useMarket();
  const { getAds, incrementSiteVisit } = useAuth();
  const { toast } = useToast();
  
  const [promotedAds, setPromotedAds] = useState<Ad[]>([]);
  const [latestAds, setLatestAds] = useState<Ad[]>([]);
  const [usedAds, setUsedAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const { view } = useView();
  
  const [recentTopics, setRecentTopics] = useState<BlogPost[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  // Fetch blogs for topics section
  useEffect(() => {
    let isMounted = true;
    const fetchBlogs = async () => {
      try {
        const blogs = await getRecentBlogs(4);
        if (isMounted) {
          setRecentTopics(blogs);
        }
      } catch (e) {
        console.error("Error fetching blogs on home:", e);
      } finally {
        setTopicsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const sortAndSetAds = useCallback((allAds: Ad[], location: { latitude: number, longitude: number } | null, currentMarket: { id: string; name: { ar: string } }) => {
    const validAds = allAds.filter(ad => isAdInMarket(ad, currentMarket.id, currentMarket.name.ar));

    const isBoostActive = (ad: any) => (ad.isFeatured || ad.isPromoted) && (!ad.featuredUntil || new Date(ad.featuredUntil) > new Date());

    if (location) {
        validAds.sort((a, b) => {
            if (a.latitude && a.longitude && b.latitude && b.longitude) {
                const distA = getDistance(location.latitude, location.longitude, a.latitude, a.longitude);
                const distB = getDistance(location.latitude, location.longitude, b.latitude, b.longitude);
                return distA - distB;
            }
            if (a.latitude && a.longitude) return -1;
            if (b.latitude && b.longitude) return 1;
            return 0;
        });
    }

    const promoted = validAds.filter(ad => isBoostActive(ad));
    promoted.sort((a: any, b: any) => {
      if (a.featuredTier === 'gold' && b.featuredTier !== 'gold') return -1;
      if (a.featuredTier !== 'gold' && b.featuredTier === 'gold') return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    const used = validAds.filter(ad => ad.condition === 'used' && !isBoostActive(ad));
    const regular = validAds.filter(ad => !isBoostActive(ad) && ad.condition !== 'used');
    
    setPromotedAds(promoted);
    setUsedAds(used);
    setLatestAds(regular);
    setAdsLoading(false);
  }, []);

  useEffect(() => {
    if (!market.id) return;

    setAdsLoading(true);
    const currentMarket = market;
    const unsubscribe = getAds({ market: market.id, status: 'active' }, (allAds) => {
        sortAndSetAds(allAds, userLocation, currentMarket);
    });

    return () => unsubscribe();
  }, [market, getAds, userLocation, sortAndSetAds]);

    const renderAdView = useCallback((ads: Ad[]) => {
      if (adsLoading) {
        if (view === 'grid') {
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
            </div>
          )
        }
        return (
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
            </div>
        )
      }

      if (view === 'grid') {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ads.map((ad, idx) => <AdCard key={ad.id} ad={ad} priority={idx < 2} />)}
          </div>
        )
      }

      return (
          <div className="space-y-4">
              {ads.map((ad, idx) => <AdRow key={ad.id} ad={ad} priority={idx < 2} />)}
          </div>
      )
    }, [adsLoading, view])
    
  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
      <Header />
      <QuickOptions />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <CategoriesGridHero />
        
        <div className="container mx-auto px-4 py-6 md:py-8 xl:pt-4">
            {/* البنر الرئيسي للموقع قبل أحدث الإعلانات */}
            <AdSlot slotKey="home_top_main_banner" className="mb-6" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                <div className={cn("transition-all duration-300", view === 'grid' ? "lg:col-span-12" : "lg:col-span-8")}>
                    
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                       <h2 className="text-xl sm:text-2xl font-bold font-headline">{promotedAds.length > 0 ? t.promotedAds : t.latestAds}</h2>
                    </div>
                    
                    {adsLoading ? (
                      <section>
                        {renderAdView([])}
                      </section>
                    ) : (
                      <>
                        {promotedAds.length > 0 && (
                          <section className="mb-10">
                            {renderAdView(promotedAds)}
                          </section>
                        )}

                        <section>
                          {promotedAds.length > 0 && (
                            <div className="flex justify-between items-center mb-4 sm:mb-6">
                               <h2 className="text-xl sm:text-2xl font-bold font-headline">{t.latestAds}</h2>
                            </div>
                          )}
                          {renderAdView(latestAds)}
                        </section>
                        
                        {usedAds.length > 0 && (
                          <section className="mt-10 content-auto">
                             <div className="flex justify-between items-center mb-4 sm:mb-6">
                               <h2 className="text-xl sm:text-2xl font-bold font-headline">{t.usedMarket}</h2>
                            </div>
                            {renderAdView(usedAds)}
                          </section>
                        )}
                      </>
                    )}
                </div>

                <aside className={cn("lg:col-span-4 lg:sticky top-28 h-fit space-y-8 transition-all duration-300", view === 'grid' ? "hidden" : "block")}>
                    <RelatedAdsSidebar />
                    <StoreSidebarSection />
                </aside>
            </div>
            <div className="container mx-auto px-4 mt-8">
              <AdSlot slotKey="home_between_sections" />
            </div>
        </div>

        {/* Featured Stores Section - متاجر سوق العرب المميزة */}
        <FeaturedStoresSection />

        {/* Topics Section */}
        {(topicsLoading || recentTopics.length > 0) && (
          <section className="bg-secondary/30 border-t border-b py-12 my-8 content-auto min-h-[400px]">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-8 text-right font-headline" dir="rtl">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5 text-foreground">
                    <BookOpen className="h-6 w-6 text-primary" />
                    {t.recentTopicsTitle}
                  </h2>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1">تصفح آخر الأخبار والتدوينات والموضوعات في مجالات متنوعة.</p>
                </div>
                <Link href="/blog" className="hidden sm:flex items-center gap-1.5 text-primary hover:text-accent font-medium transition-colors text-sm">
                  {t.viewAllTopics}
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </div>

              {topicsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card border border-border/80 rounded-2xl overflow-hidden flex flex-col h-[380px]">
                      <Skeleton className="w-full h-44 rounded-none" />
                      <div className="p-4 flex flex-col flex-grow justify-between gap-4">
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-1/4" />
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-6 w-3/4" />
                        </div>
                        <div className="pt-3 border-t border-border/40 flex justify-between">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentTopics.map((topic) => (
                  <Link 
                    href={`/blog/${topic.slug}`} 
                    key={topic.id} 
                    className="group bg-card hover:bg-card/90 border border-border/80 hover:border-primary/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col text-right h-full"
                    dir="rtl"
                  >
                    <div className="relative w-full h-44 bg-muted overflow-hidden flex-shrink-0">
                      {topic.imageUrl ? (
                        <Image 
                          src={topic.imageUrl} 
                          alt={topic.title}
                          fill
                          loading="lazy"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-secondary/30">
                          <BookOpen className="h-8 w-8 opacity-30 text-primary" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 flex flex-col flex-grow justify-between">
                      <div className="space-y-2">
                        <div className="flex gap-2 flex-wrap">
                          {topic.tags?.slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {topic.title}
                        </h3>
                        <div 
                          className="text-xs text-muted-foreground line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: topic.content?.replace(/<[^>]+>/g, '').substring(0, 100) }}
                        />
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/40 space-y-2 text-[11px] text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-primary" />
                            {topic.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {topic.createdAt?.seconds 
                              ? format(new Date(topic.createdAt.seconds * 1000), 'd MMMM, yyyy', { locale: ar })
                              : "حديثاً"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/20">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5 text-primary/70" />
                            <span>{(topic.views || 0).toLocaleString('en-US')} مشاهدة</span>
                          </span>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6 px-2 text-[10px] gap-1.5 rounded-full text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground border border-primary/25 shadow-xs transition-all group/share hover:scale-105 active:scale-95"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-primary/20 group-hover/share:bg-white/20 flex items-center justify-center transition-colors">
                                  <Share2 className="w-2.5 h-2.5 text-primary group-hover/share:text-white transition-colors" />
                                </span>
                                <span>مشاركة</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end" 
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                              className="text-right text-xs min-w-[120px]"
                            >
                              <DropdownMenuItem asChild>
                                <a 
                                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.arb-soq.com/blog/${topic.slug}`)}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="flex items-center gap-2 cursor-pointer p-2 justify-end w-full"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>فيسبوك</span>
                                  <Facebook className="h-3.5 w-3.5" />
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a 
                                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://www.arb-soq.com/blog/${topic.slug}`)}&text=${encodeURIComponent(topic.title)}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="flex items-center gap-2 cursor-pointer p-2 justify-end w-full"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>تويتر</span>
                                  <Twitter className="h-3.5 w-3.5" />
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a 
                                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(topic.title)}%20${encodeURIComponent(`https://www.arb-soq.com/blog/${topic.slug}`)}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="flex items-center gap-2 cursor-pointer p-2 justify-end w-full"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>واتساب</span>
                                  <WhatsappIcon />
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2 cursor-pointer p-2 justify-end w-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const url = `https://www.arb-soq.com/blog/${topic.slug}`;
                                  navigator.clipboard.writeText(url);
                                  toast({
                                    title: "تم نسخ الرابط!",
                                    description: "تم نسخ رابط المقال إلى الحافظة بنجاح.",
                                  });
                                }}
                              >
                                <span>نسخ الرابط</span>
                                <Share2 className="h-3.5 w-3.5 text-primary" />
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              )}

              <div className="mt-8 text-center sm:hidden">
                <Link href="/blog">
                  <Button variant="outline" className="w-full">
                    {t.viewAllTopics}
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

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
