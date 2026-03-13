
'use client';

import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import { useMarket } from '@/context/MarketContext';
import { AdPlaceholder } from '@/components/Adsense';
import { ShoppingBag, Loader2 } from 'lucide-react';
import ServiceSearch from '@/components/ServiceSearch';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Ad } from '@/lib/types';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
    title: "سوق الخدمات",
    subtitle: "اعثر على أفضل المحترفين المستقلين لتنفيذ مشاريعك.",
    servicesAvailable: "خدمة متاحة في سوقك",
    loading: "جارٍ تحميل الخدمات...",
};

export default function ServicesPage() {
  const { market } = useMarket();
  const { getAds } = useAuth();

  const [allServices, setAllServices] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'sell-service' | 'request-service'>('all');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getAds(
      { market: market.id, categories: ['services'] },
      (fetchedAds) => {
        const validAds = fetchedAds.filter(ad => ad.imageUrls && ad.imageUrls.length > 0);
        setAllServices(validAds);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [getAds, market.id]);

  const filteredServices = allServices.filter(service => {
    const matchesQuery = service.title.toLowerCase().includes(searchQuery.toLowerCase()) || service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || service.adType === filter;
    return matchesQuery && matchesFilter;
  });

  const itemsWithAds = filteredServices.reduce((acc: JSX.Element[], service, index) => {
    acc.push(<ServiceCard key={service.id} service={service} />);
    if ((index + 1) % 5 === 0 && (index + 1) < filteredServices.length) {
        acc.push(
            <div key={`ad-space-${index}`} className="sm:col-span-2 md:col-span-3 lg:col-span-4 h-full flex items-center justify-center">
                <AdPlaceholder />
            </div>
        );
    }
    return acc;
  }, []);


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background">
        <section className="bg-secondary/50 py-12">
            <div className="container mx-auto px-4 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold font-headline">
                    {t.title}
                </h1>
                <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                    {t.subtitle}
                </p>
            </div>
        </section>

        <section className="py-8 sticky top-20 z-30 bg-background/95 backdrop-blur-sm shadow-sm">
            <div className="container mx-auto px-4">
                <ServiceSearch 
                  onSearch={setSearchQuery}
                  onFilterChange={setFilter}
                  currentFilter={filter}
                />
            </div>
        </section>
        
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">{t.loading}</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {itemsWithAds}
                </div>
            )}
          </div>
        </section>
        
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
