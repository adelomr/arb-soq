
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

export default function RelatedAdsSidebar() {
  const { getAds } = useAuth();
  const { market } = useMarket();
  const [mostViewedAds, setMostViewedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getAds(
      { status: 'active', market: market.id, limit: 10 },
      (fetchedAds) => {
        const validAds = fetchedAds.filter(ad => ad.imageUrls && ad.imageUrls.length > 0);
        const sortedByViews = [...validAds].sort((a, b) => (b.views || 0) - (a.views || 0));
        setMostViewedAds(sortedByViews.slice(0, 5));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [getAds, market.id]);

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
      <CardContent className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : (
          mostViewedAds.map((ad, index) => (
            <Fragment key={ad.id}>
                <Link href={`/ad/${ad.userId}/${ad.id}`} className="block group">
                  <div className="flex items-start gap-4 p-2 rounded-lg hover:bg-secondary">
                    <div className="relative w-20 h-20 shrink-0">
                        <Image
                            src={ad.imageUrls[0]}
                            alt={ad.title}
                            fill
                            className="rounded-md object-contain"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary">{ad.title}</p>
                      <div className="flex items-center gap-1 text-primary text-xs font-bold mt-1">
                          <Tag className="h-3 w-3" />
                          <span>{ad.price ? currencyFormatter.format(ad.price) : 'عند الطلب'}</span>
                      </div>
                       <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
                          <Eye className="h-3 w-3" />
                          <span>{ad.views || 0}</span>
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
