'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdCard from '@/components/AdCard';
import AdRow from '@/components/AdRow';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import { useView } from '@/context/ViewContext';
import type { Ad } from '@/lib/types';
import { isAdInMarket } from '@/lib/category-utils';
import { loadSavedLocation, getBestLocationName, BALADNA_STORAGE_KEY } from '@/lib/locationEngine';
import BaladnaLocationModal from '@/components/BaladnaLocationModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Grid, List, MapPin, Sparkles, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

// Haversine formula to calculate distance between two coordinates
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function SooqBaladnaClient() {
  const { getAds, userProfile } = useAuth();
  const { market, userLocation } = useMarket();
  const { view, setView } = useView();

  const [promotedAds, setPromotedAds] = useState<Ad[]>([]);
  const [latestAds, setLatestAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [savedLocationName, setSavedLocationName] = useState<string>('');
  const [savedScope, setSavedScope] = useState<string>('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    const updateLocation = () => {
      const saved = loadSavedLocation();
      if (saved) {
        const name = getBestLocationName(saved);
        if (name && name !== 'تحديد الموقع' && name !== 'غير محدد') {
          setSavedLocationName(name);
          setSavedScope(saved.scope || '');
          return;
        }
      }
      const legacy = localStorage.getItem(BALADNA_STORAGE_KEY) || '';
      if (legacy && legacy !== 'غير محدد') {
        setSavedLocationName(legacy);
        setSavedScope('');
        return;
      }
      if (userProfile) {
        const name = userProfile.village || userProfile.city || userProfile.governorate || '';
        if (name) {
          setSavedLocationName(name);
          setSavedScope(userProfile.village ? 'village' : userProfile.city ? 'city' : 'governorate');
          return;
        }
      }
      setSavedLocationName('');
      setSavedScope('');
    };

    updateLocation();
    window.addEventListener('arb-soq-location-updated', updateLocation);
    window.addEventListener('baladna-location-changed', updateLocation);
    return () => {
      window.removeEventListener('arb-soq-location-updated', updateLocation);
      window.removeEventListener('baladna-location-changed', updateLocation);
    };
  }, [userProfile]);

  const sortAndSetAds = useCallback(
    (
      allAds: Ad[],
      location: { latitude: number; longitude: number } | null,
      currentMarket: { id: string; name: { ar: string } },
      targetName: string
    ) => {
      const validAds = (allAds || []).filter((ad) =>
        isAdInMarket(ad, currentMarket.id, currentMarket.name.ar)
      );

      const isBoostActive = (ad: any) =>
        (ad.isFeatured || ad.isPromoted) &&
        (!ad.featuredUntil || new Date(ad.featuredUntil) > new Date());

      const target = (targetName || '').trim().toLowerCase();

      const getLocationMatchScore = (ad: Ad) => {
        if (!target) return 0;
        let score = 0;
        const v = (ad.village || '').toLowerCase();
        const c = (ad.city || '').toLowerCase();
        const g = (ad.governorate || ad.province || '').toLowerCase();
        const l = (ad.location || '').toLowerCase();
        const country = (ad.country || '').toLowerCase();

        if (v && (v === target || target.includes(v) || v.includes(target))) score += 50;
        if (c && (c === target || target.includes(c) || c.includes(target))) score += 40;
        if (g && (g === target || target.includes(g) || g.includes(target))) score += 30;
        if (country && (country === target || target.includes(country))) score += 20;
        if (l && l.includes(target)) score += 15;
        return score;
      };

      validAds.sort((a, b) => {
        const scoreA = getLocationMatchScore(a);
        const scoreB = getLocationMatchScore(b);
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        if (location && a.latitude && a.longitude && b.latitude && b.longitude) {
          const distA = getDistance(
            location.latitude,
            location.longitude,
            a.latitude,
            a.longitude
          );
          const distB = getDistance(
            location.latitude,
            location.longitude,
            b.latitude,
            b.longitude
          );
          return distA - distB;
        }

        if (location) {
          if (a.latitude && a.longitude) return -1;
          if (b.latitude && b.longitude) return 1;
        }

        return 0;
      });

      const promoted = validAds.filter((ad) => isBoostActive(ad));
      promoted.sort((a: any, b: any) => {
        if (a.featuredTier === 'gold' && b.featuredTier !== 'gold') return -1;
        if (a.featuredTier !== 'gold' && b.featuredTier === 'gold') return 1;
        return (
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      });

      const regular = validAds.filter((ad) => !isBoostActive(ad));

      setPromotedAds(promoted);
      setLatestAds(regular);
      setAdsLoading(false);
    },
    []
  );

  useEffect(() => {
    if (!market?.id) return;

    setAdsLoading(true);
    const currentMarket = market;
    const unsubscribe = getAds(
      { market: market.id, status: 'active' },
      (allAds) => {
        sortAndSetAds(allAds, userLocation, currentMarket, savedLocationName);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [market, getAds, userLocation, savedLocationName, sortAndSetAds]);

  const renderAdView = useCallback(
    (ads: Ad[]) => {
      if (adsLoading) {
        if (view === 'grid') {
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-2xl" />
              ))}
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        );
      }

      if (view === 'grid') {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ads.map((ad, idx) => (
              <AdCard key={ad.id} ad={ad} priority={idx < 4} />
            ))}
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {ads.map((ad) => (
            <AdRow key={ad.id} ad={ad} />
          ))}
        </div>
      );
    },
    [adsLoading, view]
  );

  const getScopeLabelAr = (scope: string) => {
    switch (scope) {
      case 'village': return 'القرية / الحي';
      case 'city': return 'المدينة / المركز';
      case 'governorate': return 'المحافظة';
      case 'country': return 'الدولة';
      default: return '';
    }
  };

  const totalAdsCount = promotedAds.length + latestAds.length;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground" dir="rtl">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        {/* عنوان الصفحة وشريط التحكم بطريقة العرض والموقع */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-headline text-foreground">
                  إعلانات سوق بلدنا {savedLocationName ? `في: ${savedLocationName}` : market?.name?.ar ? `(${market.name.ar})` : ''}
                </h1>
                {savedScope && (
                  <span className="text-[11px] font-bold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full border border-primary/20">
                    نطاق {getScopeLabelAr(savedScope)}
                  </span>
                )}
              </div>
              {!adsLoading && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  عرض {totalAdsCount} إعلان متاح {savedLocationName ? `في ${savedLocationName}` : 'في منطقتك'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* زر تغيير موقع سوق بلدنا / اختيار المربع */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLocationModal(true)}
              className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10 transition-colors shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>تغيير موقع بلدنا</span>
            </Button>

            {/* أزرار طريقة العرض (شبكي / قائمة) */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  view === 'grid'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="عرض شبكي"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  view === 'list'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="عرض قائمة"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* عرض الإعلانات */}
        {adsLoading ? (
          <section>{renderAdView([])}</section>
        ) : totalAdsCount === 0 ? (
          <div className="text-center p-12 rounded-3xl bg-card border border-border max-w-lg mx-auto my-12 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <MapPin className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-headline text-foreground">
                لا توجد إعلانات منشورة في ({savedLocationName || market?.name?.ar || 'منطقتك'}) حالياً
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                يمكنك تغيير نطاق البحث واختيار مربع المدينة أو المحافظة، أو كن أول من ينشر إعلاناً في منطقتك مجاناً!
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="bg-primary text-primary-foreground font-bold rounded-xl text-xs h-10 px-4"
              >
                تغيير موقع أو نطاق سوق بلدنا
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {promotedAds.length > 0 && (
              <section>
                <h2 className="text-lg font-bold font-headline mb-4 text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  إعلانات مميزة في {savedLocationName || 'منطقتك'}
                </h2>
                {renderAdView(promotedAds)}
              </section>
            )}

            {latestAds.length > 0 && (
              <section>
                {promotedAds.length > 0 && (
                  <h2 className="text-lg font-bold font-headline mb-4 text-foreground">
                    أحدث الإعلانات
                  </h2>
                )}
                {renderAdView(latestAds)}
              </section>
            )}
          </div>
        )}
      </main>

      {/* نافذة تحديد واختيار مربع سوق بلدنا */}
      <BaladnaLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSaved={(name) => {
          setSavedLocationName(name);
        }}
      />

      <Footer />
    </div>
  );
}
