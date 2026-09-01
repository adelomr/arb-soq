'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import type { Ad } from '@/lib/types';
import Footer from '@/components/Footer';
import AdRow from '@/components/AdRow';
import AdCard from '@/components/AdCard';
import { useView } from '@/context/ViewContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PackageSearch, Search, Sparkles, Grid, List } from 'lucide-react';
import dynamic from 'next/dynamic';
import SearchForm from '@/components/SearchForm';
import AdSlot from '@/components/AdSlot';
import { matchArabicQuery, isAdInMarket } from '@/lib/utils';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
  title: 'نتائج البحث عن',
  noResults: 'لا توجد نتائج',
  noResultsDesc: 'لم نتمكن من العثور على أي إعلانات تطابق بحثك. حاول استخدام كلمات مختلفة.',
  aiResults: 'نتائج ذكية بواسطة الذكاء الاصطناعي',
  localResults: 'نتائج مطابقة',
};

// ─── smart Arabic filter helper (scoped by country/market) ────────────────────
function filterByQuery(ads: Ad[], q: string, targetMarketId?: string): Ad[] {
  if (!q.trim()) return [];
  const isBoostActive = (ad: any) => (ad.isFeatured || ad.isPromoted) && (!ad.featuredUntil || new Date(ad.featuredUntil) > new Date());
  const matches = ads.filter((ad) =>
    isAdInMarket(ad, targetMarketId) &&
    matchArabicQuery(
      [
        ad.title,
        ad.description,
        ad.category,
        ad.subcategory,
        ad.location,
        ad.province,
        ad.governorate,
        ad.city,
        ad.village,
        ad.country,
        ad.productCode,
        ad.phoneNumber,
        ad.user?.name,
        ad.user?.fullName,
        ad.user?.profession,
        ad.user?.specialization,
      ],
      q,
    ),
  );

  return matches.sort((a: any, b: any) => {
    const aBoost = isBoostActive(a);
    const bBoost = isBoostActive(b);
    if (aBoost && !bBoost) return -1;
    if (!aBoost && bBoost) return 1;
    if (aBoost && bBoost) {
      if (a.featuredTier === 'gold' && b.featuredTier !== 'gold') return -1;
      if (a.featuredTier !== 'gold' && b.featuredTier === 'gold') return 1;
    }
    return new Date(b.postedAt || b.createdAt || 0).getTime() - new Date(a.postedAt || a.createdAt || 0).getTime();
  });
}

function SearchResults() {
  const searchParams = useSearchParams();
  const { getAds } = useAuth();
  const { market } = useMarket();
  const { view, setView } = useView();
  const query = searchParams.get('q') ?? '';
  const adIdsParam = searchParams.get('ids');

  const [results, setResults] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRunning, setAiRunning] = useState(false);
  const [isAiResults, setIsAiResults] = useState(false);

  const runAiSearch = useCallback(
    async (q: string, allAds: Ad[]) => {
      setAiRunning(true);
      try {
        const { findRelevantAds } = await import('@/ai/flows/semantic-search');
        const adsForAi = allAds.slice(0, 150).map((ad) => ({
          id: ad.id,
          title: ad.title,
          description: ad.description ?? '',
        }));
        const result = await findRelevantAds({ query: q, ads: adsForAi });
        if (result?.relevantAdIds?.length) {
          const matched = (result.relevantAdIds as string[])
            .map((id) => allAds.find((a) => a.id === id))
            .filter(Boolean) as Ad[];
          if (matched.length > 0) {
            setResults(matched);
            setIsAiResults(true);
          }
        }
      } catch (error) {
        console.error('Semantic search failed, falling back to local:', error);
      } finally {
        setAiRunning(false);
      }
    },
    [],
  );

  useEffect(() => {
    setLoading(true);

    const isBoostActive = (ad: any) => (ad.isFeatured || ad.isPromoted) && (!ad.featuredUntil || new Date(ad.featuredUntil) > new Date());
    const sortAds = (ads: Ad[]): Ad[] => {
      return [...ads].sort((a: any, b: any) => {
        const aBoost = isBoostActive(a);
        const bBoost = isBoostActive(b);
        if (aBoost && !bBoost) return -1;
        if (!aBoost && bBoost) return 1;
        if (aBoost && bBoost) {
          if (a.featuredTier === 'gold' && b.featuredTier !== 'gold') return -1;
          if (a.featuredTier !== 'gold' && b.featuredTier === 'gold') return 1;
        }
        return new Date(b.postedAt || b.createdAt || 0).getTime() - new Date(a.postedAt || a.createdAt || 0).getTime();
      });
    };

    const unsubscribe = getAds({ market: market.id, status: 'active' }, (allAds) => {
      if (adIdsParam) {
        const ids = adIdsParam.split(',');
        const matched = allAds.filter((ad) => ids.includes(ad.id));
        setResults(sortAds(matched));
        setLoading(false);
        return;
      }

      if (query.trim()) {
        const localMatches = filterByQuery(allAds, query, market.id);
        setResults(localMatches);
        setLoading(false);
        runAiSearch(query, allAds);
      } else {
        setResults(sortAds(allAds.filter((ad) => isAdInMarket(ad, market.id))));
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [adIdsParam, query, getAds, market.id, runAiSearch]);

  const renderContent = () => {
    if (loading) {
      if (view === 'grid') {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        );
      }
      return (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
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
      <div className="space-y-6">
        {/* Results badge & View Mode Switch */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2" dir="rtl">
          <div className="flex items-center gap-2">
            {isAiResults ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                <Sparkles className="h-3.5 w-3.5" />
                {t.aiResults} — {results.length} نتيجة
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary border border-border px-3 py-1 rounded-full">
                <Search className="h-3.5 w-3.5" />
                {t.localResults} — {results.length} نتيجة
              </span>
            )}
            {aiRunning && (
              <span className="text-xs text-muted-foreground animate-pulse flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-primary rounded-full animate-bounce" />
                تحسين النتائج بالذكاء الاصطناعي...
              </span>
            )}
          </div>

          {/* Grid / List Switch */}
          <div className="flex items-center gap-1 bg-secondary/50 border border-border p-1 rounded-xl">
            <Button
              type="button"
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('grid')}
              className="h-8 w-8 rounded-lg"
              aria-label="عرض الشبكة"
              title="عرض الشبكة"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('list')}
              className="h-8 w-8 rounded-lg"
              aria-label="عرض القائمة"
              title="عرض القائمة"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((ad, index) => (
              <div key={ad.id} className="space-y-4">
                <AdRow ad={ad} />
                {(index + 1) % 6 === 0 && index !== results.length - 1 && (
                  <AdSlot slotKey="category_in_feed_ad" type="in-feed" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background py-10">
        <div className="container mx-auto px-4">
          {/* Search bar at top of results */}
          <div className="max-w-2xl mx-auto mb-6">
            <SearchForm />
          </div>

          {/* Category / Search Header Banner */}
          <div className="max-w-5xl mx-auto mb-6">
            <AdSlot slotKey="category_header_banner" />
          </div>

          <div className="flex justify-between items-center mb-6" dir="rtl">
            <h1 className="text-2xl font-bold font-headline flex items-center gap-3">
              <Search className="h-6 w-6 text-primary" />
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
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-2xl px-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}

