'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import type { Ad } from '@/lib/types';
import Footer from '@/components/Footer';
import AdRow from '@/components/AdRow';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PackageSearch, Search, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import SearchForm from '@/components/SearchForm';
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
  return ads.filter((ad) =>
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
}

function SearchResults() {
  const searchParams = useSearchParams();
  const { getAds } = useAuth();
  const { market } = useMarket();
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
      } catch {
        // silently keep local results
      } finally {
        setAiRunning(false);
      }
    },
    [],
  );

  useEffect(() => {
    setLoading(true);
    setIsAiResults(false);

    // ── Case 1: explicit IDs from the dropdown click ──────────────────────────
    if (adIdsParam) {
      const adIds = adIdsParam.split(',').filter(Boolean);
      const unsubscribe = getAds({ status: 'active' }, (allAds) => {
        const foundAds = allAds.filter((ad) => adIds.includes(ad.id));
        const orderedAds = adIds
          .map((id) => foundAds.find((ad) => ad.id === id))
          .filter(Boolean) as Ad[];
        setResults(orderedAds);
        setLoading(false);
        // Also run AI to potentially improve results
        if (query && allAds.length > 0) {
          runAiSearch(query, allAds);
        }
      });
      return () => unsubscribe();
    }

    // ── Case 2: plain text query ──────────────────────────────────────────────
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const filters: Parameters<typeof getAds>[0] = { status: 'active' };

    const unsubscribe = getAds(filters, (allAds) => {
      // Immediate local fuzzy match (filtered by user country/market)
      const localMatches = filterByQuery(allAds, query, market.id);
      setResults(localMatches);
      setLoading(false);
      // Kick off AI semantic search for smarter ranking
      if (allAds.length > 0) {
        runAiSearch(query, allAds);
      }
    });

    return () => unsubscribe();
  }, [adIdsParam, query, getAds, market.id, runAiSearch]);

  const renderContent = () => {
    if (loading) {
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
      <div className="space-y-4">
        {/* Results badge */}
        <div className="flex items-center gap-2 mb-2" dir="rtl">
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

        {results.map((ad) => (
          <AdRow key={ad.id} ad={ad} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background py-10">
        <div className="container mx-auto px-4">
          {/* Search bar at top of results */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchForm />
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

