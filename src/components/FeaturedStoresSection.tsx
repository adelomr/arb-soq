'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile } from '@/lib/types';
import { DEMO_GULF_STORE } from '@/lib/demo-gulf-store';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, MapPin, Star, BadgeCheck, ChevronLeft, ArrowLeft, Sparkles } from 'lucide-react';

export default function FeaturedStoresSection() {
  const { getUsersWithStores } = useAuth();
  const [stores, setStores] = useState<(UserProfile & { id: string })[]>([DEMO_GULF_STORE]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadStores() {
      try {
        let list: (UserProfile & { id: string })[] = [];
        if (getUsersWithStores) {
          list = await getUsersWithStores();
        }
        if (!list.some((s) => s.id === DEMO_GULF_STORE.id)) {
          list = [DEMO_GULF_STORE, ...list];
        }
        setStores(list.slice(0, 4)); // Show up to 4 featured stores on home
      } catch (error) {
        console.error('Failed to load featured stores:', error);
        setStores([DEMO_GULF_STORE]);
      }
    }
    loadStores();
  }, [getUsersWithStores]);

  if (!loading && stores.length === 0) return null;

  return (
    <section className="py-8 my-6 bg-gradient-to-b from-background via-muted/30 to-background border-y border-border/50" dir="rtl">
      <div className="container mx-auto px-4">
        {/* ترويسة القسم */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Store className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-headline text-foreground flex items-center gap-2">
                <span>متاجر سوق العرب المميزة</span>
                <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>موثقة</span>
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              تسوقي وتسوق مباشرة من أفضل المتاجر والماركات الموثوقة مع شحن وتوصيل مباشر.
            </p>
          </div>

          <Link href="/shops" className="shrink-0">
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-bold text-xs gap-1.5 group">
              <span>عرض جميع المتاجر</span>
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </Button>
          </Link>
        </div>

        {/* كروت المتاجر */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {stores.map((userWithStore) => {
              const store = userWithStore.store;
              if (!store) return null;

              return (
                <Link
                  key={userWithStore.id}
                  href={`/store/${userWithStore.id}`}
                  className="group block"
                >
                  <Card className="overflow-hidden rounded-2xl border-border/80 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col bg-card">
                    {/* صورة غلاف المتجر */}
                    <div className="relative w-full h-36 bg-muted overflow-hidden">
                      <Image
                        src={store.coverImageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800'}
                        alt={store.storeName}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      
                      <Badge className="absolute top-2.5 right-2.5 bg-blue-600/90 backdrop-blur-sm text-white font-bold text-[10px] gap-1 px-2 py-0.5 border-none shadow-sm">
                        <BadgeCheck className="w-3 h-3" />
                        <span>متجر موثق</span>
                      </Badge>
                    </div>

                    {/* محتوى وتفاصيل المتجر */}
                    <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3 relative">
                      {/* شعار المتجر العائم */}
                      <div className="-mt-10 mb-1 flex items-end justify-between">
                        <Avatar className="h-14 w-14 rounded-2xl border-2 border-background shadow-lg bg-card shrink-0">
                          <AvatarImage src={userWithStore.avatarUrl} alt={store.storeName} />
                          <AvatarFallback className="text-base font-bold bg-primary text-primary-foreground">
                            {store.storeName[0]}
                          </AvatarFallback>
                        </Avatar>

                        {userWithStore.rating && (
                          <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold text-xs px-2 py-1 rounded-lg">
                            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                            <span>{userWithStore.rating.toFixed(1)}</span>
                            {userWithStore.reviewCount && (
                              <span className="text-[10px] text-muted-foreground">({userWithStore.reviewCount})</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {store.storeName}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {store.storeDescription}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span className="truncate max-w-[120px]">
                            {[userWithStore.province || userWithStore.governorate, userWithStore.city].filter(Boolean).join('، ') || userWithStore.city || userWithStore.province || userWithStore.governorate || userWithStore.country || 'الرياض'}
                          </span>
                        </div>

                        <span className="font-bold text-primary text-xs flex items-center gap-1 group-hover:underline">
                          <span>زيارة المتجر</span>
                          <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
