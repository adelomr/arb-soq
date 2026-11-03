
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
import { matchAdToCategory, matchAdToSubcategory, normalizeKey, getParentCategoryId } from '@/lib/category-utils';
import { useToast } from '@/hooks/use-toast';

interface RelatedAdsSidebarProps {
  category?: string;
  categoryId?: string;
  categoryName?: string;
  subcategory?: string;
  brand?: string;
  city?: string;
  currentAdId?: string;
  currentAdTitle?: string;
}

export default function RelatedAdsSidebar({
  category,
  categoryId,
  categoryName,
  subcategory,
  brand,
  city,
  currentAdId,
  currentAdTitle,
}: RelatedAdsSidebarProps) {
  const { getAds, categories } = useAuth();
  const { market } = useMarket();
  const { toast } = useToast();
  const [relatedAds, setRelatedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getAds(
      { status: 'active', market: market.id, limit: 60 },
      (fetchedAds) => {
        // Filter out current ad and ads without valid images
        const filtered = fetchedAds.filter(
          (ad) => ad.id !== currentAdId && ad.imageUrls && ad.imageUrls.length > 0 && ad.imageUrls[0]
        );

        const hasCategoryFilter = Boolean(category || categoryId || subcategory || brand);

        if (!hasCategoryFilter) {
          // General sidebar mode (e.g. Home page)
          setRelatedAds(filtered.slice(0, 8));
          setLoading(false);
          return;
        }

        // Strict category verification: ONLY ads that belong to the same category
        const isAdInSameCategory = (ad: Ad): boolean => {
          // 1. Direct match with matchAdToCategory
          if (category && matchAdToCategory(ad, category, categories)) return true;
          if (categoryId && matchAdToCategory(ad, categoryId, categories)) return true;

          // 2. Direct string equality checks
          const adCat = normalizeKey(ad.category);
          const adCatId = normalizeKey((ad as any).categoryId);
          const targetCat = normalizeKey(category);
          const targetCatId = normalizeKey(categoryId);

          if (targetCat && (adCat === targetCat || adCatId === targetCat)) return true;
          if (targetCatId && (adCat === targetCatId || adCatId === targetCatId)) return true;

          // 3. Parent category comparison
          const adParent = getParentCategoryId(adCatId || adCat || ad.subcategory || '', categories);
          const targetParent = getParentCategoryId(targetCatId || targetCat || subcategory || '', categories);
          if (adParent && targetParent && adParent === targetParent) return true;

          // 4. Vehicles / Automotive category match
          const isTargetVehicle = isVehicleCategory(category) || isVehicleCategory(categoryId) || Boolean(brand);
          if (isTargetVehicle) {
            const isAdVehicle = isVehicleCategory(ad.category) || isVehicleCategory((ad as any).categoryId) || Boolean(ad.brand);
            if (isAdVehicle) return true;
          }

          // 5. Subcategory match
          if (subcategory && matchAdToSubcategory(ad, subcategory)) return true;

          return false;
        };

        // Filter strictly to the same category
        const sameCategoryAds = filtered.filter((ad) => isAdInSameCategory(ad));

        // Prioritize within the same category:
        // 1. Same Brand (highest match, e.g. same car brand or tech brand)
        const sameBrand = brand
          ? sameCategoryAds.filter((ad) => ad.brand && normalizeKey(ad.brand) === normalizeKey(brand))
          : [];

        // 2. Same Subcategory
        const sameSub = subcategory
          ? sameCategoryAds.filter(
              (ad) =>
                !sameBrand.some((b) => b.id === ad.id) &&
                (matchAdToSubcategory(ad, subcategory) ||
                  (ad.subcategory && normalizeKey(ad.subcategory) === normalizeKey(subcategory)))
            )
          : [];

        // 3. Same Category (remaining ads strictly from this category)
        const sameCat = sameCategoryAds.filter(
          (ad) => !sameBrand.some((b) => b.id === ad.id) && !sameSub.some((s) => s.id === ad.id)
        );

        // Optional city sorting: same city ads come first
        const sortedSameCat = city
          ? [...sameCat].sort((a, b) => {
              const aCity = a.city === city ? -1 : 0;
              const bCity = b.city === city ? -1 : 0;
              return aCity - bCity;
            })
          : sameCat;

        // Combined ads strictly within the same category - NO unrelated ads!
        const combined = [...sameBrand, ...sameSub, ...sortedSameCat];
        setRelatedAds(combined.slice(0, 8));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [getAds, categories, market.id, category, categoryId, subcategory, brand, city, currentAdId, currentAdTitle]);

  const handleFollowOffers = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: !isFollowing ? '🔔 تم تفعيل التنبيهات!' : 'تم إلغاء المتابعة',
      description: !isFollowing
        ? 'ستصلك إشعارات فورية بأحدث العروض المشابهة فور نزولها.'
        : 'تم إلغاء متابعة العروض المشابهة.',
    });
  };

  const displayCatName =
    categoryName ||
    categories.find((c) => c.id === category || c.id === categoryId)?.name?.ar ||
    category;

  const categoryHint = [brand || subcategory || displayCatName, city ? `في ${city}` : '']
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
