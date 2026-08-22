
'use client';

import { useEffect, useState, Fragment } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import type { Ad } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { Tag, Eye } from 'lucide-react';
import { AdPlaceholder } from './Adsense';

const t = {
    mostViewed: 'الأكثر مشاهدة',
    loading: 'جارٍ التحميل...',
};

interface RelatedAdsSidebarProps {
  category?: string;
  currentAdId?: string;
}

export default function RelatedAdsSidebar({ category, currentAdId }: RelatedAdsSidebarProps) {
  const { getAds } = useAuth();
  const { market } = useMarket();
  const [mostViewedAds, setMostViewedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getAds(
      { status: 'active', market: market.id, limit: 10 },
      (fetchedAds) => {
        let filtered = fetchedAds.filter(ad => ad.id !== currentAdId && ad.imageUrls && ad.imageUrls.length > 0 && ad.imageUrls[0]);
        
        // ترتيب الإعلانات بحيث تظهر إعلانات نفس القسم أولاً ثم الأقسام الأخرى، وكلاهما مرتب بالأكثر مشاهدة
        const sameCategory = filtered.filter(ad => ad.category === category);
        const otherCategories = filtered.filter(ad => ad.category !== category);
        
        sameCategory.sort((a, b) => (b.views || 0) - (a.views || 0));
        otherCategories.sort((a, b) => (b.views || 0) - (a.views || 0));
        
        const combined = [...sameCategory, ...otherCategories];
        setMostViewedAds(combined.slice(0, 5));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [getAds, market.id, category, currentAdId]);

  const currencyFormatter = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: market.currency,
    maximumFractionDigits: 0,
    numberingSystem: 'latn'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            {t.mostViewed}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-xl flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : (
          mostViewedAds.map((ad) => (
            <Fragment key={ad.id}>
                <Link href={`/ad/${ad.userId}/${ad.id}`} className="block group">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 p-2 rounded-xl hover:bg-secondary border border-border/40 sm:border-transparent transition-all duration-200">
                    {/* Image — full width on mobile, 112×112 on desktop */}
                    <div className="relative w-full h-48 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-muted shadow-sm">
                        <Image
                            src={ad.imageUrls[0]}
                            alt={ad.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 112px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Mobile views badge */}
                        <div className="absolute bottom-2 right-2 sm:hidden bg-black/70 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                          <Eye className="h-3 w-3 text-primary" />
                          <span>{ad.views || 0} مشاهدة</span>
                        </div>
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <p className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">{ad.title}</p>
                      <div className="flex items-center justify-between gap-2 text-primary text-xs font-bold mt-2">
                          {!!ad.price && Number(ad.price) > 0 && (
                              <div className="flex items-center gap-1">
                                  <Tag className="h-3.5 w-3.5" />
                                  <span>{currencyFormatter.format(Number(ad.price))}</span>
                              </div>
                          )}
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Eye className="h-3 w-3" />
                              <span>{ad.views || 0}</span>
                          </div>
                      </div>
                    </div>
                  </div>
                </Link>
            </Fragment>
          ))
        )}
      </CardContent>
    </Card>
  );
}
