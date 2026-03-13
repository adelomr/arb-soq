'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Ad } from '@/lib/types';
import Footer from '@/components/Footer';
import AdRow from '@/components/AdRow';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PackageSearch, Search } from 'lucide-react';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
  title: 'نتائج البحث عن',
  noResults: 'لا توجد نتائج',
  noResultsDesc: 'لم نتمكن من العثور على أي إعلانات تطابق بحثك. حاول استخدام كلمات مختلفة.',
  searching: 'جارٍ البحث...',
};

function SearchResults() {
  const searchParams = useSearchParams();
  const { getAds } = useAuth();
  const query = searchParams.get('q');
  const adIdsParam = searchParams.get('ids');

  const [results, setResults] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adIdsParam) {
      const adIds = adIdsParam.split(',');
      if (adIds.length > 0) {
        // This is a simplified approach. In a real app, you'd fetch multiple docs by ID.
        // For now, we fetch all ads and filter, which is inefficient but works with the current `getAds`.
        setLoading(true);
        const unsubscribe = getAds({ status: 'active' }, (allAds) => {
          const foundAds = allAds.filter(ad => adIds.includes(ad.id));
          // Preserve the order from the AI
          const orderedAds = adIds.map(id => foundAds.find(ad => ad.id === id)).filter(Boolean) as Ad[];
          setResults(orderedAds);
          setLoading(false);
        });
        return () => unsubscribe();
      }
    } else {
        setLoading(false);
        setResults([]);
    }
  }, [adIdsParam, getAds]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="flex justify-center">
          <Alert className="max-w-lg text-center">
            <PackageSearch className="h-6 w-6 mx-auto mb-2" />
            <AlertTitle>{t.noResults}</AlertTitle>
            <AlertDescription>{t.noResultsDesc}</AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {results.map(ad => <AdRow key={ad.id} ad={ad} />)}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
              <Search className="h-8 w-8 text-primary"/>
              {t.title} "{query}"
            </h1>
          </div>
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchResults />
        </Suspense>
    )
}
