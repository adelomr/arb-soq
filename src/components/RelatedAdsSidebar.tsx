
'use client';

import { useEffect, useState, Fragment } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import type { Ad } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { Tag, Sparkles, Bell, Layers } from 'lucide-react';
import { isVehicleCategory } from '@/lib/car-brands';
import { useToast } from '@/hooks/use-toast';

interface RelatedAdsSidebarProps {
  category?: string;
  subcategory?: string;
  brand?: string;
  city?: string;
  currentAdId?: string;
  currentAdTitle?: string;
}

export default function RelatedAdsSidebar({
  category,
  subcategory,
  brand,
  city,
  currentAdId,
  currentAdTitle,
}: RelatedAdsSidebarProps) {
  const { getAds } = useAuth();
  const { market } = useMarket();
  const { toast } = useToast();
  const [relatedAds, setRelatedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getAds(
      { status: 'active', market: market.id, limit: 30 },
      (fetchedAds) => {
        // Filter out current ad and ads without valid images
        let filtered = fetchedAds.filter(
          (ad) => ad.id !== currentAdId && ad.imageUrls && ad.imageUrls.length > 0 && ad.imageUrls[0]
        );

        // Sorting & Matching hierarchy:
        // 1. Same Brand (highest match)
        // 2. Same Subcategory
        // 3. Same Category
        // 4. Other ads in same market
        const sameBrand = brand ? filtered.filter((ad) => ad.brand === brand) : [];
        const sameSub = subcategory
          ? filtered.filter((ad) => ad.subcategory === subcategory && ad.brand !== brand)
          : [];
        const sameCat = category
          ? filtered.filter(
              (ad) =>
                ad.category === category &&
                ad.brand !== brand &&
                ad.subcategory !== subcategory
            )
          : [];
        const others = filtered.filter(
          (ad) =>
            ad.category !== category &&
            ad.brand !== brand &&
            ad.subcategory !== subcategory
        );

        const combined = [...sameBrand, ...sameSub, ...sameCat, ...others];
        setRelatedAds(combined.slice(0, 9));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [getAds, market.id, category, subcategory, brand, currentAdId, currentAdTitle]);

  const handleFollowOffers = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: !isFollowing ? '🔔 تم تفعيل التنبيهات!' : 'تم إلغاء المتابعة',
      description: !isFollowing
        ? 'ستصلك إشعارات فورية بأحدث العروض المشابهة فور نزولها.'
        : 'تم إلغاء متابعة العروض المشابهة.',
    });
  };

  const currencyFormatter = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: market?.currency || 'SAR',
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  });

  const categoryHint = [brand || subcategory || category, city ? `في ${city}` : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="w-full space-y-3">
      {/* زر متابعة العروض المشابهة العريض على غرار تطبيق حراج */}
      <button
        type="button"
        onClick={handleFollowOffers}
        className="w-full py-2.5 px-4 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
      >
        <Bell className={`h-4 w-4 ${isFollowing ? 'fill-primary text-primary' : ''}`} />
        <span>{isFollowing ? 'أنت تتابع العروض المشابهة' : 'متابعة العروض المشابهة'}</span>
      </button>

      {/* بطاقة العروض المشابهة */}
      <Card className="border border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/50">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>عروض مشابهة</span>
            </CardTitle>

            {categoryHint && (
              <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md truncate max-w-[160px]">
                {categoryHint}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2 p-2 border border-border/60 rounded-2xl">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-2/3 mx-auto" />
                </div>
              ))}
            </div>
          ) : relatedAds.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">لا توجد عروض مشابهة حالياً</p>
          ) : (
            /* شبكة العمودين (2 Columns) لمساحة أكبر ووضوح كامل للصور والنصوص */
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {relatedAds.map((ad) => {
                const img = ad.imageUrls?.[0] || 'https://www.arb-soq.com/og-image.png';
                return (
                  <Link
                    key={ad.id}
                    href={`/ad/${ad.userId || 'seller'}/${ad.id}`}
                    className="group flex flex-col justify-between bg-card hover:bg-muted/30 border border-border/90 hover:border-primary/80 rounded-2xl p-2 sm:p-3 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
                  >
                    {/* صورة المربع داخل التحديد */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted border border-border/50 shadow-xs">
                      <Image
                        src={img}
                        alt={ad.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* عنوان الإعلان داخل نفس التحديد والمربع */}
                    <div className="mt-2.5 min-h-[44px] sm:min-h-[48px] flex items-center justify-center px-1">
                      <p className="text-xs sm:text-sm font-bold text-foreground text-center line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {ad.title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
