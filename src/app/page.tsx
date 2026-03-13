

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
import { Grid, List } from 'lucide-react';
import AdCard from '@/components/AdCard';
import { cn } from '@/lib/utils';

const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });
const QuickOptions = dynamic(() => import('@/components/QuickOptions'), { ssr: false });
const RelatedAdsSidebar = dynamic(() => import('@/components/RelatedAdsSidebar'), { ssr: false });
const StoreSidebarSection = dynamic(() => import('@/components/StoreSidebarSection'), { ssr: false });


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
  
  const [promotedAds, setPromotedAds] = useState<Ad[]>([]);
  const [latestAds, setLatestAds] = useState<Ad[]>([]);
  const [usedAds, setUsedAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    incrementSiteVisit();
  }, [incrementSiteVisit]);

  const sortAndSetAds = useCallback((allAds: Ad[], location: { latitude: number, longitude: number } | null) => {
    const validAds = allAds.filter(ad => ad.imageUrls && ad.imageUrls.length > 0 && ad.imageUrls[0]);

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
        <section className="relative w-full bg-gradient-to-b from-background via-secondary/50 to-background text-foreground">
          <div className="container mx-auto flex flex-col justify-center items-center p-4 py-8 md:py-12">
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
        </section>
        
        <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                <div className={cn("transition-all duration-300", view === 'grid' ? "lg:col-span-12" : "lg:col-span-8")}>
                    
                    <div className="flex justify-between items-center mb-8">
                       <h2 className="text-3xl font-bold font-headline">{promotedAds.length > 0 ? t.promotedAds : t.latestAds}</h2>
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
