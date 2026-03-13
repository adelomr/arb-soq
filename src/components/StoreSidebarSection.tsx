
'use client';

import { useEffect, useState, Fragment } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import type { Ad } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Tag } from 'lucide-react';
import { AdPlaceholder } from './Adsense';

const t = {
    featuredStores: 'متاجر مميزة',
    loading: 'جارٍ التحميل...',
};

export default function StoreSidebarSection() {
  const { getAds } = useAuth();
  const { market } = useMarket();
  const [storeProducts, setStoreProducts] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getAds(
      { status: 'active', market: market.id, categories: ['store-product'], limit: 10 },
      (fetchedAds) => {
        const validAds = fetchedAds.filter(ad => ad.imageUrls && ad.imageUrls.length > 0);
        setStoreProducts(validAds.slice(0, 10)); // Ensure we only take 10
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

  const renderProductPair = (index: number) => {
    const product1 = storeProducts[index];
    const product2 = storeProducts[index + 1];

    return (
        <div key={`pair-${index}`} className="grid grid-cols-2 gap-4">
            {product1 && renderProduct(product1)}
            {product2 && renderProduct(product2)}
        </div>
    )
  }

  const renderProduct = (ad: Ad) => (
    <Link key={ad.id} href={`/ad/${ad.userId}/${ad.id}`} className="block group">
        <div className="space-y-2">
            <div className="relative w-full aspect-square">
                <Image
                    src={ad.imageUrls[0]}
                    alt={ad.title}
                    fill
                    className="rounded-md object-cover"
                />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold truncate group-hover:text-primary">{ad.title}</p>
                <div className="flex items-center gap-1 text-primary text-xs font-bold mt-1">
                    <Tag className="h-3 w-3" />
                    <span>{ad.price ? currencyFormatter.format(ad.price) : 'عند الطلب'}</span>
                </div>
            </div>
        </div>
    </Link>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            {t.featuredStores}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-24 w-full rounded-md" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
            Array.from({ length: Math.ceil(storeProducts.length / 2) }).map((_, i) => {
                const pairIndex = i * 2;
                return (
                    <Fragment key={`fragment-${i}`}>
                        {renderProductPair(pairIndex)}
                    </Fragment>
                )
            })
        )}
      </CardContent>
    </Card>
  );
}
