

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { appIconUrl } from '@/lib/data';
import AdRow from '@/components/AdRow';
import Header from '@/components/Header';
import { useState, useEffect, useCallback } from 'react';
import { useMarket } from '@/context/MarketContext';
import type { Ad } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import SearchForm from '@/components/SearchForm';
import dynamic from 'next/dynamic';
import { AdPlaceholder } from '@/components/Adsense';
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
const QuickOptions = dynamic(() => import('@/components/QuickOptions'), { ssr: false });
const RelatedAdsSidebar = dynamic(() => import('@/components/RelatedAdsSidebar'), { ssr: false });
const StoreSidebarSection = dynamic(() => import('@/components/StoreSidebarSection'), { ssr: false });
const NewsletterSidebar = dynamic(() => import('@/components/NewsletterSidebar'), { ssr: false });


const WhatsappIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5">
      <path fill="currentColor" d="M16.75 13.96c.25.13.43.2.5.28.08.08.13.18.15.25.03.08.03.15.03.18 0 .03-.03.05-.03.08-.02.02-.03.05-.05.07-.02.02-.05.05-.07.07-.02.02-.05.03-.07.05-.02.02-.05.05-.08.07-.03.02-.05.05-.08.07-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08l-.1.08c-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08l-.12.08c-.03.03-.07.05-.12.08-.05.03-.1.05-.15.07-.05.02-.1.05-.15.07-.05.02-.1.05-.15.07-.05.02-.1.03-.15.05-.05.02-.1.03-.15.05-.05.02-.1.03-.17.05-.07.02-.13.03-.2.05-.07.02-.15.03-.22.05-.07.02-.15.03-.22.05-.07.02-.15.03-.23.03-.08 0-.17-.02-.25-.03-.08-.02-.17-.03-.25-.05-.08-.02-.17-.03-.25-.05-.08-.02-.17-.05-.25-.07-.08-.02-.17-.05-.25-.08-.08-.03-.17-.05-.25-.08-.08-.03-.17-.07-.25-.1-.08-.03-.17-.07-.25-.1-.08-.03-.15-.07-.23-.1-.08-.03-.15-.07-.23-.1-.08-.03-.15-.07-.22-.1-.07-.03-.13-.07-.2-.1-.03-.02-.05-.03-.07-.05-.43-.2-1.03-.48-1.7-1.15-.65-.65-1.03-1.4-1.1-1.58-.02-.03-.03-.07-.05-.1-.02-.03-.03-.07-.05-.1v-.1c0-.02.02-.03.03-.05.02-.02.03-.03.05-.05.02-.02.05-.03.08-.05.03-.02.07-.03.1-.05.03-.02.07-.03.1-.05.03-.02.05-.03.08-.05.03-.02.05-.03.08-.05.03-.02.05-.03.07-.03.02 0 .05-.02.07-.02.02 0 .05-.02.07-.02.02 0 .05 0 .07.02.02 0 .05.02.07.03.02.02.05.03.07.05.02.02.05.05.07.07l.08.08c.03.03.05.05.07.08.02.03.03.07.05.1.02.03.03.07.05.1.02.03.03.05.05.08.02.03.03.05.05.08.02.03.03.05.05.08.03.05.05.08.07.12.02.03.03.07.05.1.02.03.03.07.05.1.02.03.03.07.05.1s.05.07.07.1c.02.03.05.07.07.1.02.03.05.07.07.1.02.03.05.07.07.1.07.12.18.23.32.33.13.1.28.18.43.25.15.07.3.12.45.15.15.03.3.05.45.05.15 0 .3-.02.45-.05.15-.03.3-.08.45-.15.15-.07.28-.15.42-.25.13-.1.25-.2.35-.33.05-.05.1-.12.13-.2.03-.08.05-.17.05-.25s-.02-.17-.05-.25c-.03-.08-.08-.15-.13-.2-.1-.1-.2-.18-.32-.25-.12-.08-.25-.13-.4-.18-.13-.05-.27-.08-.4-.08-.13 0-.27.03-.4.08s-.25.13-.38.2c-.12.08-.23.15-.35.23-.12.08-.23.17-.33.25-.1.08-.2.17-.28.25-.08.08-.15.17-.22.25-.07.08-.13.17-.18.25-.05.08-.1.17-.12.25-.02.08-.03.17-.03.25s.02.17.03.25c.02.08.05.15.08.22.03.07.08.13.12.18.05.05.1.1.15.15.05.05.1.1.15.15l.15.12c.05.03.1.07.15.1.05.03.1.07.15.1.05.03.1.07.15.1.1.07.2.13.3.18.1.05.2.1.3.15.1.05.2.1.3.15.2.1.2.18.2.25V12c0-2.1-1.2-3.96-3-4.9.15-.3.23-.62.23-.95 0-.75-.4-1.4-1.03-1.75.28-.43.43-.93.43-1.45 0-1.5-1.2-2.7-2.7-2.7-1.5 0-2.7 1.2-2.7 2.7 0 .52.15 1.02.43 1.45-.63.35-1.03 1-1.03 1.75 0 .33.08.65.23.95-1.8 1-3 2.8-3 4.9v.05c0 .07.02.13.05.18.1.05.2.1.3.15s.2.1.3.15c.1.05.2.1.3.15.1.05.2.08.3.13.1.05.2.1.3.15.1.05.2.1.3.15.08.05.15.1.22.15.07.05.13.1.2.15.07.05.13.1.2.15.07.05.13.1.2.15.07.05.13.1.2.15l.38.22c.07.03.13.07.2.1.07.03.13.07.2.1.07.03.13.07.2.1.07.03.13.05.2.08.07.03.13.05.2.08.07.03.13.05.2.08.13.05.27.08.4.1.13.03.27.03.4 0 .13-.02.27-.03.4-.02.13-.05.27-.08.4-.03.13-.08.25-.13.38-.05.12-.1.25-.18.38-.08.12-.17.23-.25.33-.08.1-.18.2-.28.28-.1.08-.2.17-.3.25-.1.08-.2.17-.3.25-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23l-.3.23c-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23-.1.07-.2.13-.3.2-.1.07-.2.13-.3.2-.1.07-.2.13-.3.2-.15.15-.28.3-.4.45-.12.15-.22.3-.3.45-.08.15-.13.3-.15.45-.02.15-.03.3-.03.45s.02.3.03.45c.02.15.07.3.15.45.08.15.18.3.3.45.12.15.25.3.4.45.15.15.3.28.45.42.15.13.3.25.45.35.15.1.32.18.5.23.18.05.37.08.55.08.18 0 .37-.03.55-.08.18-.05.35-.13.5-.23.15-.1.3-.22.45-.35.15-.13.28-.28.42-.42.13-.15.25-.3.35-.45.1-.15.18-.3.23-.45.05-.15.08-.3.08-.45s-.03-.3-.08-.45c-.05-.15-.13-.3-.23-.45-.1-.15-.22-.3-.35-.45s-.28-.28-.42-.42c-.15-.13-.3-.25-.45-.38-.15-.12-.3-.23-.45-.35-.15-.12-.3-.23-.45-.35l-.23-.17c-.15-.12-.3-.23-.45-.35-.15-.12-.3-.23-.45-.35-.15-.12-.3-.22-.45-.33l-.22-.18c-.15-.12-.3-.22-.45-.33-.15-.12-.3-.22-.45-.33l-.22-.18c-.15-.12-.3-.22-.45-.33l-.2-.17c-.15-.12-.28-.23-.4-.35-.12-.12-.23-.23-.33-.35-.1-.1-.2-.2-.28-.3-.08-.1-.17-.2-.25-.28-.08-.08-.17-.17-.25-.25-.08-.08-.17-.17-.25-.25l-.25-.25c-.08-.08-.17-.17-.25-.25-.08-.08-.17-.17-.25-.25-.08-.08-.15-.17-.23-.25-.08-.08-.15-.17-.23-.25-.08-.08-.15-.17-.23-.25l-.45-.5c-.08-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25l-.22-.25c-.07-.08-.15-.17-.22-.25L3.83 6.08l-.22-.25c-.07-.08-.15-.17-.22-.25C3.3 5.5 3.22 5.4 3.14 5.33c-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23l-.25-.25c-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23C1.6 3.9 1.5 3.82 1.43 3.73c-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25L0 2.7l-.22-.25c-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25C12.5.02 12.25 0 12 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.63 0 12-5.37 12-12v-.08c-.03-.08-.05-.15-.08-.22-.03-.07-.05-.13-.08-.2Z"/>
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
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function Home() {
  const { market, userLocation, setUserLocation } = useMarket();
  const { getAds, incrementSiteVisit } = useAuth();
  const { toast } = useToast();
  
  const [promotedAds, setPromotedAds] = useState<Ad[]>([]);
  const [latestAds, setLatestAds] = useState<Ad[]>([]);
  const [usedAds, setUsedAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const { view, setView } = useView();
  
  const [recentTopics, setRecentTopics] = useState<BlogPost[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  useEffect(() => {
    incrementSiteVisit();
  }, [incrementSiteVisit]);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await getRecentBlogs(4); // fetch latest 4 topics
        setRecentTopics(data);
      } catch (error) {
        console.error("Failed to fetch recent topics:", error);
      } finally {
        setTopicsLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const sortAndSetAds = useCallback((allAds: Ad[], location: { latitude: number, longitude: number } | null) => {
    const validAds = allAds; // Display all ads including video ads

    if (location) {
        validAds.sort((a, b) => {
            if (a.latitude && a.longitude && b.latitude && b.longitude) {
                const distA = getDistance(location.latitude, location.longitude, a.latitude, a.longitude);
                const distB = getDistance(location.latitude, location.longitude, b.latitude, b.longitude);
                return distA - distB;
            }
            if (a.latitude && a.longitude) return -1; // a has location, b does not
            if (b.latitude && b.longitude) return 1;  // b has location, a does not
            return 0;
        });
    }

    const promoted = validAds.filter(ad => ad.isPromoted);
    const used = validAds.filter(ad => ad.condition === 'used');
    const regular = validAds.filter(ad => !ad.isPromoted && ad.condition !== 'used');
    
    setPromotedAds(promoted);
    setUsedAds(used);
    setLatestAds(regular);
    setAdsLoading(false);
  }, []);

  useEffect(() => {
    if (!market.id) return;

    setAdsLoading(true);
    const unsubscribe = getAds({ market: market.id, status: 'active' }, (allAds) => {
        sortAndSetAds(allAds, userLocation);
    });

    return () => unsubscribe();
  }, [market.id, getAds, userLocation, sortAndSetAds]);

    const renderAdView = (ads: Ad[]) => {
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
              {ads.map(ad => <AdCard key={ad.id} ad={ad} />)}
          </div>
        )
      }

      return (
          <div className="space-y-4">
              {ads.map(ad => <AdRow key={ad.id} ad={ad} />)}
          </div>
      )
    }
    
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <QuickOptions />
      <main className="flex-1">
        <section className="relative w-full bg-gradient-to-b from-background via-secondary/50 to-background text-foreground py-8 md:py-12 xl:min-h-[560px]">
          {/* الحاوية الكاملة بتموضع نسبي لتمكين التموضع المطلق للنشرة */}
          <div className="container mx-auto px-4 relative" dir="rtl">

            {/* المحتوى الرئيسي: الشعار والعنوان والبحث — يبقى في المنتصف دائماً */}
            <div className="flex flex-col items-center text-center py-4 w-full max-w-2xl mx-auto">
              <Image
                  src={appIconUrl}
                  alt="شعار سوق العرب"
                  width={128}
                  height={128}
                  className="w-20 h-20 md:w-24 md:h-24 mb-4"
                  priority
                />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center font-headline mb-3 text-primary">
                {t.title}
              </h1>
              <p className="text-sm sm:text-base text-center mb-6 max-w-2xl text-muted-foreground px-2">
                {t.subtitle}
              </p>
              <div className="w-full max-w-lg px-4">
                <SearchForm />
              </div>
            </div>

            {/* النشرة البريدية: مطلقة في اليسار على xl، وتظهر بعد البحث على الشاشات الصغيرة */}
            <div className="xl:absolute xl:left-4 xl:top-4 xl:w-72 flex justify-center mt-6 xl:mt-0">
              <NewsletterSidebar />
            </div>

          </div>
        </section>
        
        <div className="container mx-auto px-4 py-12 md:py-16 xl:pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                <div className={cn("transition-all duration-300", view === 'grid' ? "lg:col-span-12" : "lg:col-span-8")}>
                    
                    <div className="flex justify-between items-center mb-8">
                       <h2 className="text-3xl font-bold font-headline">{promotedAds.length > 0 ? t.promotedAds : t.latestAds}</h2>
                    </div>
                    
                    {promotedAds.length > 0 && (
                      <section className="mb-12">
                        {renderAdView(promotedAds)}
                      </section>
                    )}

                    <section>
                      {promotedAds.length > 0 && (
                        <div className="flex justify-between items-center mb-8">
                           <h2 className="text-3xl font-bold font-headline">{t.latestAds}</h2>
                        </div>
                      )}
                      {renderAdView(latestAds)}
                    </section>
                    
                    {usedAds.length > 0 && (
                      <section className="mt-12">
                         <div className="flex justify-between items-center mb-8">
                           <h2 className="text-3xl font-bold font-headline">{t.usedMarket}</h2>
                        </div>
                        {renderAdView(usedAds)}
                      </section>
                    )}
                </div>

                <aside className={cn("lg:col-span-4 lg:sticky top-28 h-fit space-y-8 transition-all duration-300", view === 'grid' ? "hidden" : "block")}>
                    <RelatedAdsSidebar />
                    <StoreSidebarSection />
                </aside>
            </div>
        </div>

        {/* Topics Section */}
        {recentTopics.length > 0 && (
          <section className="bg-secondary/30 border-t border-b py-16 my-8">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-10 text-right font-headline" dir="rtl">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                    <BookOpen className="h-8 w-8 text-primary" />
                    {t.recentTopicsTitle}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">تصفح آخر الأخبار والتدوينات والموضوعات في مجالات متنوعة.</p>
                </div>
                <Link href="/blog" className="hidden sm:flex items-center gap-1.5 text-primary hover:text-accent font-medium transition-colors text-sm">
                  {t.viewAllTopics}
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </div>

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
                        {/* Snippet */}
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
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-[10px] gap-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              >
                                <Share2 className="w-3 h-3" />
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
                                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/blog/${topic.slug}` : '')}`} 
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
                                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/blog/${topic.slug}` : '')}&text=${encodeURIComponent(topic.title)}`} 
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
                                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(topic.title)}%20${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/blog/${topic.slug}` : '')}`} 
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
                                  const url = `${window.location.origin}/blog/${topic.slug}`;
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
