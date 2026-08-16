'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdCard from '@/components/AdCard';
import AdRow from '@/components/AdRow';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import { useView } from '@/context/ViewContext';
import type { Ad } from '@/lib/types';
import { isAdInMarket } from '@/lib/category-utils';
import BaladnaLocationModal, { BALADNA_STORAGE_KEY, BALADNA_COORDS_KEY } from '@/components/BaladnaLocationModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  SlidersHorizontal,
  PlusCircle,
  Search,
  Grid,
  List,
  Sparkles,
  MapPinned,
  Building2,
  Navigation,
  Compass,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function SooqBaladnaClient() {
  const { getAds, categories } = useAuth();
  const { market } = useMarket();
  const { view, setView } = useView();

  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBalad, setCurrentBalad] = useState<string>('');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // قراءة الموقع المحفوظ
  const loadSavedLocation = useCallback(() => {
    const saved = localStorage.getItem(BALADNA_STORAGE_KEY) || '';
    const coordsStr = localStorage.getItem(BALADNA_COORDS_KEY);
    setCurrentBalad(saved);
    if (coordsStr) {
      try {
        setCurrentCoords(JSON.parse(coordsStr));
      } catch {
        setCurrentCoords(null);
      }
    }

    // إذا لم يكن هناك موقع محفوظ بعد، نفتح النافذة تلقائياً لتسهيل التجربة
    if (!saved) {
      setIsLocationModalOpen(true);
    }
  }, []);

  useEffect(() => {
    loadSavedLocation();
    window.addEventListener('baladna-location-changed', loadSavedLocation);
    return () => window.removeEventListener('baladna-location-changed', loadSavedLocation);
  }, [loadSavedLocation]);

  // جلب الإعلانات
  useEffect(() => {
    setLoading(true);
    const unsubscribe = getAds({ status: 'active' }, (ads) => {
      setAllAds(ads || []);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [getAds]);

  // حساب المسافة الجغرافية (Haversine)
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  // فلترة وتصنيف الإعلانات
  const { matchedAds, otherLocalAds, hasExactMatches } = useMemo(() => {
    const marketFiltered = allAds.filter((ad) => isAdInMarket(ad, market.id, market.name.ar));

    // فلترة الفئة والبحث النصي أولاً
    let filtered = marketFiltered;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((ad) => ad.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (ad) =>
          ad.title?.toLowerCase().includes(q) ||
          ad.description?.toLowerCase().includes(q) ||
          ad.location?.toLowerCase().includes(q)
      );
    }

    if (!currentBalad.trim()) {
      return {
        matchedAds: filtered,
        otherLocalAds: [],
        hasExactMatches: true,
      };
    }

    const baladKeywords = currentBalad
      .toLowerCase()
      .split(/[\s,،-]+/)
      .filter((w) => w.length >= 3);

    const exact: Ad[] = [];
    const others: Ad[] = [];

    filtered.forEach((ad) => {
      const adLocation = (ad.location || '').toLowerCase();
      const adProvince = (ad.province || '').toLowerCase();
      const adTitle = (ad.title || '').toLowerCase();
      const adDesc = (ad.description || '').toLowerCase();

      // هل الإعلان يحتوي على اسم البلد في العنوان أو الموقع أو المحافظة؟
      const isTextMatch =
        baladKeywords.length > 0 &&
        baladKeywords.some(
          (k) =>
            adLocation.includes(k) ||
            adProvince.includes(k) ||
            adTitle.includes(k) ||
            adDesc.includes(k)
        );

      // هل الإعلان قريب جغرافياً (أقل من 35 كم)؟
      let isGeoClose = false;
      if (currentCoords && ad.latitude && ad.longitude) {
        const dist = getDistanceKm(
          currentCoords.lat,
          currentCoords.lng,
          ad.latitude,
          ad.longitude
        );
        if (dist <= 35) {
          isGeoClose = true;
        }
      }

      if (isTextMatch || isGeoClose) {
        exact.push(ad);
      } else {
        others.push(ad);
      }
    });

    return {
      matchedAds: exact,
      otherLocalAds: others,
      hasExactMatches: exact.length > 0,
    };
  }, [allAds, market.id, selectedCategory, searchQuery, currentBalad, currentCoords]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground" dir="rtl">
      <Header />

      <main className="flex-1 pb-12">
        {/* شريط رأس الصفحة الاستهلالي لمنطقة بلدنا */}
        <section className="bg-gradient-to-b from-primary/15 via-primary/5 to-transparent border-b border-border/60 py-6 sm:py-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* تفاصيل الموقع المحدد والترحيب */}
              <div className="flex items-center gap-3.5 text-right w-full md:w-auto">
                <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 shrink-0">
                  <MapPinned className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      <Sparkles className="w-3 h-3" /> سوق بلدنا
                    </span>
                    <span className="text-xs text-muted-foreground">| إعلانات منطقتك الأقرب إليك</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-headline mt-1 text-foreground flex items-center gap-2">
                    {currentBalad ? (
                      <>
                        إعلانات بلدنا في: <span className="text-primary underline decoration-primary/40 underline-offset-4">{currentBalad}</span>
                      </>
                    ) : (
                      'إعلانات بلدنا'
                    )}
                  </h1>
                </div>
              </div>

              {/* أزرار الإجراءات: تغيير البلد + أضف إعلان */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                <Button
                  onClick={() => setIsLocationModalOpen(true)}
                  variant="outline"
                  className="h-11 px-4 rounded-xl border-primary/30 hover:border-primary hover:bg-primary/10 font-bold gap-2 text-foreground"
                >
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{currentBalad ? 'تغيير البلد / الموقع' : 'تحديد بلدي الآن'}</span>
                </Button>

                <Button asChild className="h-11 px-5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Link href="/submit">
                    <PlusCircle className="w-4 h-4" />
                    <span>أضف إعلان في بلدنا</span>
                  </Link>
                </Button>
              </div>

            </div>

            {/* شريط البحث وتصفية الفئات */}
            <div className="mt-6 space-y-3">
              <div className="relative max-w-xl">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`ابحث عن أي سلعة أو خدمة داخل ${currentBalad || 'منطقتك'}...`}
                  className="h-11 pr-10 text-sm bg-card border-border rounded-xl shadow-sm"
                />
                <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* تصنيفات سريعة */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                    selectedCategory === 'all'
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  كل الأقسام
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {cat.name.ar}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* عرض النتائج والإعلانات */}
        <section className="container mx-auto px-4 mt-6">
          {/* شريط التحكم بطريقة العرض والعدد */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {hasExactMatches
                  ? `إعلانات (${currentBalad || 'المنطقة'}) : ${matchedAds.length}`
                  : `أحدث الإعلانات في (${market.name})`}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  view === 'grid' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="عرض شبكي"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  view === 'list' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="عرض قائمة"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* حالة التحميل */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
              ))}
            </div>
          ) : hasExactMatches ? (
            /* الإعلانات المطابقة بدقة لبلد المستخدم */
            <div
              className={cn(
                view === 'grid'
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4"
                  : "flex flex-col gap-3 max-w-4xl mx-auto"
              )}
            >
              {matchedAds.map((ad) =>
                view === 'grid' ? (
                  <AdCard key={ad.id} ad={ad} />
                ) : (
                  <AdRow key={ad.id} ad={ad} />
                )
              )}
            </div>
          ) : (
            /* في حال عدم وجود إعلانات في تلك القرية بعد: عرض تنبيه تشجيعي + أقرب الإعلانات */
            <div className="space-y-8">
              <div className="text-center p-8 rounded-2xl bg-card border border-border shadow-sm max-w-xl mx-auto space-y-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <Compass className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold font-headline text-foreground">
                  لا توجد إعلانات منشورة في ({currentBalad || 'هذا الموقع'}) حالياً
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  كن أول من ينشر إعلاناً في منطقتك لتبدأ البيع أو تقديم خدماتك لجيرانك وأهل بلدتك مجاناً!
                </p>
                <Button asChild className="h-11 px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Link href="/submit">
                    <PlusCircle className="w-4 h-4" />
                    <span>انشر أول إعلان في {currentBalad || 'بلدنا'}</span>
                  </Link>
                </Button>
              </div>

              {/* عرض باقي إعلانات السوق */}
              {otherLocalAds.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>إعلانات أخرى مقترحة في بلدنا ({market.name.ar}):</span>
                  </h3>
                  <div
                    className={cn(
                      view === 'grid'
                        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4"
                        : "flex flex-col gap-3 max-w-4xl mx-auto"
                    )}
                  >
                    {otherLocalAds.slice(0, 15).map((ad) =>
                      view === 'grid' ? (
                        <AdCard key={ad.id} ad={ad} />
                      ) : (
                        <AdRow key={ad.id} ad={ad} />
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* نافذة تحديد بلدنا وتحديث الموقع */}
      <BaladnaLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSaved={(name) => {
          setCurrentBalad(name);
          loadSavedLocation();
        }}
      />
    </div>
  );
}
