'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Loader2, X, Sparkles, ArrowLeft, Briefcase, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import type { Ad } from '@/lib/types';
import Image from 'next/image';
import { cn, matchArabicQuery, normalizeArabicText, isAdInMarket } from '@/lib/utils';
import { findMatchingCrafts, CraftTaxonomy } from '@/lib/search-taxonomy';

const DEBOUNCE_MS = 250;

// ─── HighlightText ────────────────────────────────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const normText = normalizeArabicText(text);
  const normQ = normalizeArabicText(query);
  const idx = normText.indexOf(normQ);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary rounded-sm px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Price Formatter ──────────────────────────────────────────────────────────
function formatPrice(price?: number, currency?: string): string | null {
  if (!price) return null;
  return `${price.toLocaleString('ar-SA')} ${currency ?? ''}`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SearchForm Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function SearchForm() {
  const router = useRouter();
  const { getAds, categories } = useAuth();
  const { market } = useMarket();

  // ── State ──────────────────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Ad[]>([]);
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [adsLoaded, setAdsLoaded] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Pre-fetch active ads ───────────────────────────────────────────────────
  useEffect(() => {
    if (adsLoaded) return;
    const unsub = getAds({ status: 'active', limit: 300 }, (ads) => {
      setAllAds(ads);
      setAdsLoaded(true);
    });
    return () => unsub();
  }, [getAds, adsLoaded]);

  // ── Click outside to close ─────────────────────────────────────────────────
  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOut);
    return () => document.removeEventListener('mousedown', onClickOut);
  }, []);

  // ── Local smart Arabic filter (scoped by country/market) ────────────────────
  const localSuggestions = useMemo<Ad[]>(() => {
    const q = query.trim();
    if (!q || q.length < 1) return [];
    return allAds
      .filter((ad) =>
        isAdInMarket(ad, market.id) &&
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
            ad.country,
            ad.user?.name,
            ad.user?.fullName,
            ad.user?.profession,
            ad.user?.specialization,
          ],
          q,
        ),
      )
      .slice(0, 6);
  }, [query, allAds, market.id]);

  // ── Matched professions & dynamic categories taxonomy ────────────────────
  const matchedCrafts = useMemo<CraftTaxonomy[]>(() => {
    const fromTaxonomy = findMatchingCrafts(query);
    const q = query.trim();
    if (!q || q.length < 1) return fromTaxonomy;
    const normQ = normalizeArabicText(q);

    // Also match live dynamic categories & subcategories from DB
    const dynamicMatches: CraftTaxonomy[] = [];
    (categories || []).forEach((cat) => {
      const catName = cat.name?.ar || cat.id;
      const normCatName = normalizeArabicText(catName);
      if (normCatName.includes(normQ) || normQ.includes(normCatName)) {
        if (!fromTaxonomy.some((t) => normalizeArabicText(t.title) === normCatName)) {
          dynamicMatches.push({
            id: cat.id,
            title: catName,
            category: 'فئة رئيسية',
            iconName: cat.icon || 'Shapes',
            keywords: [catName],
          });
        }
      }
      cat.subcategories?.forEach((sub) => {
        const subName = sub.name?.ar || sub.id;
        const normSubName = normalizeArabicText(subName);
        if (normSubName.includes(normQ) || normQ.includes(normSubName)) {
          if (!fromTaxonomy.some((t) => normalizeArabicText(t.title) === normSubName)) {
            dynamicMatches.push({
              id: sub.id,
              title: subName,
              category: catName,
              iconName: sub.icon || 'Shapes',
              keywords: [subName],
            });
          }
        }
      });
    });

    return [...dynamicMatches, ...fromTaxonomy];
  }, [query, categories]);

  // ── Predictive Autocomplete Text (Google-Style) ───────────────────────────
  const prediction = useMemo<string>(() => {
    const q = query.trim();
    if (!q || q.length < 1) return '';

    const normQ = normalizeArabicText(q);

    // 1. Check crafts & taxonomy keywords first
    for (const craft of matchedCrafts) {
      const normTitle = normalizeArabicText(craft.title);
      if (normTitle.startsWith(normQ)) return craft.title;

      for (const kw of craft.keywords) {
        const normKw = normalizeArabicText(kw);
        if (normKw.startsWith(normQ)) return kw;
      }
    }

    // 2. Check local ad titles
    for (const ad of localSuggestions) {
      const normTitle = normalizeArabicText(ad.title);
      if (normTitle.startsWith(normQ)) return ad.title;
    }

    return '';
  }, [query, matchedCrafts, localSuggestions]);

  // ── Debounced AI semantic search ───────────────────────────────────────────
  const runAiSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 3) {
        setSuggestions(localSuggestions);
        return;
      }
      setAiLoading(true);
      try {
        const { findRelevantAds } = await import('@/ai/flows/semantic-search');
        const adsForAi = allAds.slice(0, 100).map((ad) => ({
          id: ad.id,
          title: ad.title,
          description: ad.description ?? '',
        }));
        const result = await findRelevantAds({ query: q, ads: adsForAi });
        if (result?.relevantAdIds?.length) {
          const matched = (result.relevantAdIds as string[])
            .map((id) => allAds.find((a) => a.id === id))
            .filter(Boolean) as Ad[];
          setSuggestions(matched.length ? matched.slice(0, 6) : localSuggestions);
        } else {
          setSuggestions(localSuggestions);
        }
      } catch {
        setSuggestions(localSuggestions);
      } finally {
        setAiLoading(false);
      }
    },
    [allAds, localSuggestions],
  );

  // ── Handle input change ────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    setSuggestions(localSuggestions);
    debounceRef.current = setTimeout(() => runAiSearch(val), DEBOUNCE_MS);
  };

  // ── Submit Search ──────────────────────────────────────────────────────────
  const submitSearch = (term: string) => {
    const q = term.trim();
    if (!q) return;
    setOpen(false);
    setQuery('');
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  // ── Keydown handling (Tab or Arrow Right to accept prediction) ────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') &&
      prediction &&
      prediction.length > query.trim().length
    ) {
      e.preventDefault();
      setQuery(prediction);
      return;
    }
    if (e.key === 'Enter') {
      submitSearch(query);
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const showDropdown = open && query.trim().length >= 1;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative w-full" dir="rtl">
      {/* ── Input Wrapper ───────────────────────────────────────────────────── */}
      <div
        className={cn(
          'relative flex items-center rounded-2xl border transition-all duration-300',
          'bg-background/80 backdrop-blur-sm shadow-sm',
          open
            ? 'border-primary/60 shadow-lg shadow-primary/10 ring-2 ring-primary/20'
            : 'border-border hover:border-primary/40 hover:shadow-md',
        )}
      >
        {/* Search Icon */}
        <div className="absolute right-4 flex items-center pointer-events-none z-10">
          {aiLoading ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Predictive Inline Ghost Text (Google-Style Overlay) */}
        {prediction && prediction.length > query.trim().length && (
          <div
            className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5 text-sm sm:text-base font-medium overflow-hidden max-w-[calc(100%-120px)] z-0"
            dir="rtl"
          >
            <span className="invisible whitespace-pre">{query}</span>
            <span className="text-muted-foreground/45 font-medium select-none">
              {prediction.slice(query.trim().length)}
            </span>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-md border border-primary/20 hidden md:inline-flex items-center gap-1 animate-pulse mr-2">
              <Wand2 className="w-3 h-3" />
              Tab ↹
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          id="main-search-input"
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="ابحث عن سيارات، أثاث، مهن كالمبلط والسباك..."
          className="w-full bg-transparent text-sm sm:text-base font-medium pr-12 pl-28 py-3.5 outline-none placeholder:text-muted-foreground/60 text-foreground rounded-2xl relative z-10"
          autoComplete="off"
          spellCheck={false}
          aria-label="بحث"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute left-20 text-muted-foreground hover:text-foreground transition-colors z-20"
            aria-label="مسح"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Search Submit Button */}
        <button
          type="button"
          onClick={() => submitSearch(query)}
          className="absolute left-2 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-sm z-20"
        >
          <span className="hidden sm:inline">بحث</span>
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Dropdown Suggestions ────────────────────────────────────────────── */}
      {showDropdown && (
        <div className="absolute top-full mt-2 w-full z-50 overflow-hidden bg-background/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-2xl shadow-black/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                نتائج التنبؤ المباشر
              </span>
              {aiLoading && (
                <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  البحث الذكي...
                </span>
              )}
            </div>

            {/* ── Matched Categories & Crafts Taxonomy ───────────────────────────── */}
            {matchedCrafts.length > 0 && (
              <div className="p-3 bg-primary/5 border-b border-border/40">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  فئات ومهن مطابقة
                </span>
                <div className="flex flex-wrap gap-2">
                  {matchedCrafts.map((craft) => (
                    <button
                      key={craft.id}
                      type="button"
                      onClick={() => submitSearch(craft.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-primary/20 hover:border-primary text-xs font-bold text-foreground hover:text-primary transition-all shadow-sm active:scale-95"
                    >
                      <span>{craft.title}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">({craft.category})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Suggestions List ────────────────────────────────────────────── */}
            {suggestions.length > 0 ? (
              <ul className="py-1">
                {suggestions.map((ad) => (
                  <li
                    key={ad.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 cursor-pointer transition-colors group"
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                      router.push(`/search?q=${encodeURIComponent(query)}`);
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/40">
                      {ad.imageUrls?.[0] ? (
                        <Image
                          src={ad.imageUrls[0]}
                          alt={ad.title}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Search className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        <HighlightText text={ad.title} query={query} />
                      </p>
                      {ad.price && (
                        <p className="text-xs text-primary font-semibold mt-0.5">
                          {formatPrice(ad.price, ad.currency)}
                        </p>
                      )}
                    </div>

                    <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0 rtl:rotate-180" />
                  </li>
                ))}
              </ul>
            ) : (
              !aiLoading && (
                <div className="px-4 py-5 text-center">
                  <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة</p>
                  <button
                    type="button"
                    onClick={() => submitSearch(query)}
                    className="mt-2 text-xs text-primary hover:underline font-medium"
                  >
                    البحث عن "{query}" في سوق العرب
                  </button>
                </div>
              )
            )}

            {/* Full Search CTA */}
            {suggestions.length > 0 && (
              <div className="border-t border-border/40 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => submitSearch(query)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1"
                >
                  <Search className="h-3.5 w-3.5" />
                  عرض جميع نتائج "{query}"
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}