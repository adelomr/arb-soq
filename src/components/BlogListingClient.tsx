'use client';

import React, { useState, useMemo, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { BlogPost, AuthorSettings, getAllBlogs } from '@/lib/blog-service';
import BlogSidebar from './BlogSidebar';
import AdvertiseBanner from '@/components/AdvertiseBanner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  BookOpen, 
  User, 
  Calendar, 
  ArrowLeft, 
  Eye, 
  Tag, 
  Filter, 
  X,
  Layers,
  Search,
  HelpCircle,
  RotateCcw,
  Globe
} from 'lucide-react';
import { 
  normalizeArabicText, 
  matchArabicQuery, 
  stripArabicPrefixes, 
  getArabicWordStems 
} from '@/lib/utils';

interface BlogListingClientProps {
  initialBlogs: BlogPost[];
  authorSettings?: AuthorSettings | null;
  initialCategory?: string;
  initialQuery?: string;
}


/**
 * Remove HTML tags from string to allow clean content matching
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract clean, stem-normalized tokens for category matching
 */
function cleanCategoryTokens(text: string): string[] {
  return normalizeArabicText(text)
    .replace(/^قسم\s+/, '')
    .split(/[\s,()_\-–\/\\]+/)
    .filter(Boolean)
    .map(w => {
      let t = stripArabicPrefixes(w);
      if (t.endsWith('ات') && t.length > 4) t = t.slice(0, -2);
      if (t.endsWith('ه') && t.length > 3) t = t.slice(0, -1);
      return t;
    })
    .filter(t => t.length >= 2);
}

/**
 * Robust category matching that handles Arabic normalization,
 * prefixes like 'قسم ', and tags, and checks titles when category is unset.
 */
function matchesCategoryFilter(blog: BlogPost, targetCategory: string): boolean {
  if (!targetCategory) return true;

  const rawTarget = targetCategory.trim();
  if (blog.category && blog.category.trim() === rawTarget) return true;

  const targetTokens = cleanCategoryTokens(rawTarget);
  if (targetTokens.length === 0) return true;

  const candidates: string[] = [blog.category, ...(blog.tags || [])].filter(Boolean) as string[];
  
  // If blog category is empty or missing, allow matching against title keywords
  if (!blog.category && blog.title) {
    candidates.push(blog.title);
  }

  return candidates.some(cand => {
    const candTokens = cleanCategoryTokens(cand);
    return targetTokens.every(tt => candTokens.some(ct => ct.includes(tt) || tt.includes(ct)));
  });
}

/**
 * Smart Arabic search query matcher on candidate fields
 */
function matchesSearchFilter(blog: BlogPost, query: string, authorName?: string): boolean {
  if (!query.trim()) return true;

  const cleanContent = blog.content ? stripHtml(blog.content) : '';
  const candidateFields = [
    blog.title,
    blog.category,
    ...(blog.tags || []),
    authorName || blog.author,
    cleanContent,
  ];

  return matchArabicQuery(candidateFields, query);
}

/**
 * Calculates a relevance score for search results
 */
function getSearchRelevanceScore(blog: BlogPost, query: string, authorName?: string): number {
  const normQuery = normalizeArabicText(query);
  if (!normQuery) return 0;

  let score = 0;
  const normTitle = normalizeArabicText(blog.title);
  const normCategory = normalizeArabicText(blog.category);
  const normTags = (blog.tags || []).map((t) => normalizeArabicText(t));
  const normAuthor = normalizeArabicText(authorName || blog.author);

  const queryStems = getArabicWordStems(query);

  // Exact title match
  if (normTitle === normQuery) score += 200;
  // Title starts with query
  else if (normTitle.startsWith(normQuery)) score += 120;
  // Title contains query as full phrase
  else if (normTitle.includes(normQuery)) score += 80;
  // Title contains any query stem
  else if (queryStems.some(s => normTitle.includes(s))) score += 75;

  // Tags match
  if (normTags.some((t) => t === normQuery || queryStems.some(s => t.includes(s)))) score += 60;

  // Category match
  if (normCategory === normQuery || queryStems.some(s => normCategory.includes(s))) score += 50;

  // Author match
  if (normAuthor.includes(normQuery)) score += 30;

  // Small tiebreaker for popularity
  if (blog.views) score += Math.min(blog.views / 100, 15);

  return score;
}

/**
 * Sort blogs by relevance score descending
 */
function sortBlogsByRelevance(list: BlogPost[], query: string, authorName?: string): BlogPost[] {
  return [...list].sort((a, b) => {
    const scoreB = getSearchRelevanceScore(b, query, authorName);
    const scoreA = getSearchRelevanceScore(a, query, authorName);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const timeB = b.createdAt?.seconds || 0;
    const timeA = a.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

export default function BlogListingClient({
  initialBlogs,
  authorSettings,
  initialCategory,
  initialQuery,
}: BlogListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);

  // Read URL query parameters
  const paramCategory = searchParams.get('category');
  const paramQuery = searchParams.get('q') || searchParams.get('search');

  // Local filter states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategory || paramCategory || null
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    initialQuery || paramQuery || ''
  );

  // Synchronize state when URL searchParams change
  useEffect(() => {
    const currentUrlCategory = searchParams.get('category');
    if (currentUrlCategory !== null && currentUrlCategory !== undefined) {
      setSelectedCategory(currentUrlCategory);
    } else if (!searchParams.has('category') && selectedCategory !== null) {
      setSelectedCategory(null);
    }
  }, [searchParams]);

  useEffect(() => {
    const currentUrlQuery = searchParams.get('q') || searchParams.get('search');
    if (currentUrlQuery !== null && currentUrlQuery !== undefined) {
      setSearchQuery(currentUrlQuery);
    } else if (!searchParams.has('q') && !searchParams.has('search') && searchQuery !== '') {
      setSearchQuery('');
    }
  }, [searchParams]);

  // Keep blogs in sync with props
  useEffect(() => {
    setBlogs(initialBlogs);
  }, [initialBlogs]);

  // Client-side live sync
  useEffect(() => {
    getAllBlogs()
      .then((fresh) => {
        if (Array.isArray(fresh) && fresh.length > 0) {
          setBlogs(fresh);
        }
      })
      .catch(() => {});
  }, []);

  // Update browser URL query params smoothly without full reload
  const syncUrlParams = useCallback((newCategory: string | null, newQuery: string) => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);

      if (newCategory) {
        url.searchParams.set('category', newCategory);
      } else {
        url.searchParams.delete('category');
      }

      const trimmedQ = newQuery.trim();
      if (trimmedQ) {
        url.searchParams.set('q', trimmedQ);
        url.searchParams.delete('search');
      } else {
        url.searchParams.delete('q');
        url.searchParams.delete('search');
      }

      window.history.replaceState(null, '', url.pathname + url.search);
    } catch (e) {
      console.error('Failed to sync URL:', e);
    }
  }, []);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    syncUrlParams(category, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    syncUrlParams(selectedCategory, query);
  };

  const handleResetAll = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    syncUrlParams(null, '');
  };

  // 1. Most viewed blogs (sorted by views desc)
  const mostViewedBlogs = useMemo(() => {
    return [...blogs]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, [blogs]);

  // 2. Recent blogs (latest topics: ordered by newest first)
  const recentBlogs = useMemo(() => {
    return blogs.slice(0, 5);
  }, [blogs]);

  // 3. Compute category counts
  const categoriesWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    blogs.forEach((blog) => {
      const cat = blog.category?.trim();
      if (cat) {
        map.set(cat, (map.get(cat) || 0) + 1);
      } else if (blog.tags && blog.tags.length > 0 && blog.tags[0].trim()) {
        const fallbackCat = blog.tags[0].trim();
        map.set(fallbackCat, (map.get(fallbackCat) || 0) + 1);
      }
    });

    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [blogs]);

  // 4. Smart filtered blogs:
  // If user searches while a category is selected, and that category yields 0 matches,
  // we intelligently fall back to searching ALL blogs across the site so they never get 0 results for valid keywords!
  const { filteredBlogs, isSearchGlobalFallback } = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const hasSearch = Boolean(trimmedQuery);
    const hasCategory = Boolean(selectedCategory);

    // If neither search nor category: return all blogs (latest first)
    if (!hasSearch && !hasCategory) {
      return { filteredBlogs: blogs, isSearchGlobalFallback: false };
    }

    // If ONLY category
    if (hasCategory && !hasSearch) {
      const catResults = blogs.filter((b) => matchesCategoryFilter(b, selectedCategory!));
      return { filteredBlogs: catResults, isSearchGlobalFallback: false };
    }

    // If ONLY search (no category): search all blogs and sort by relevance
    if (hasSearch && !hasCategory) {
      const searchResults = blogs.filter((b) => matchesSearchFilter(b, trimmedQuery, authorSettings?.name));
      const sorted = sortBlogsByRelevance(searchResults, trimmedQuery, authorSettings?.name);
      return { filteredBlogs: sorted, isSearchGlobalFallback: false };
    }

    // If BOTH search and category are active:
    // First: see if results exist in this category
    const catMatches = blogs.filter((b) => 
      matchesCategoryFilter(b, selectedCategory!) && 
      matchesSearchFilter(b, trimmedQuery, authorSettings?.name)
    );

    if (catMatches.length > 0) {
      const sorted = sortBlogsByRelevance(catMatches, trimmedQuery, authorSettings?.name);
      return { filteredBlogs: sorted, isSearchGlobalFallback: false };
    }

    // Fallback: If 0 results in this category, search across ALL blogs so the user never gets 0 results for valid queries
    const allMatches = blogs.filter((b) => matchesSearchFilter(b, trimmedQuery, authorSettings?.name));
    const sorted = sortBlogsByRelevance(allMatches, trimmedQuery, authorSettings?.name);
    return { filteredBlogs: sorted, isSearchGlobalFallback: allMatches.length > 0 };
  }, [blogs, selectedCategory, searchQuery, authorSettings]);

  return (
    <div>
      {/* Blog Top Header Bar: Centered title with full-width ad banner below it */}
      <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border-b border-border/50 py-6 md:py-8 px-4">
        <div className="max-w-7xl mx-auto" dir="rtl">
          {/* Header Row: Centered Title with Compact Search Bar on the side */}
          <div className="relative flex flex-col md:flex-row items-center justify-center mb-6">
            {/* Centered Main Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight text-center">
              مدونة سوق العرب
            </h1>

            {/* Small & Comfortable Side Search Bar */}
            <div className="mt-3 md:mt-0 md:absolute md:left-0 w-60 sm:w-68 md:w-72 max-w-[300px] shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  syncUrlParams(selectedCategory, searchQuery);
                }}
                className="relative flex items-center w-full"
              >
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="ابحث في المدونة..."
                  className="w-full h-11 pr-10 pl-9 bg-card border border-border/80 rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-right shadow-2xs"
                  dir="rtl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    title="مسح البحث"
                    aria-label="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Ad Banner Directly Below Title */}
          <div className="w-full">
            <AdvertiseBanner size="large" className="shadow-lg" />
          </div>
        </div>
      </div>

      {/* Main Listing Body */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12" dir="rtl">
        {/* Category Quick Filter Pills Bar */}
        {categoriesWithCounts.length > 0 && (
          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground ml-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span>الأقسام:</span>
            </div>

            <button
              type="button"
              onClick={() => handleCategorySelect(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === null
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              الكل ({blogs.length})
            </button>

            {categoriesWithCounts.map((cat, idx) => {
              const isSelected = Boolean(
                selectedCategory &&
                (selectedCategory === cat.name ||
                  cleanCategoryTokens(selectedCategory).join(' ') === cleanCategoryTokens(cat.name).join(' '))
              );

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCategorySelect(isSelected ? null : cat.name)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs ring-2 ring-primary/30'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Global Fallback Notice when searching */}
        {isSearchGlobalFallback && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs md:text-sm text-foreground flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                لم يتم العثور على نتائج داخل قسم <strong>&quot;{selectedCategory}&quot;</strong>، ولكن تم العثور على <strong>({filteredBlogs.length})</strong> نتيجة في كافة أقسام المدونة.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCategorySelect(null)}
              className="px-3 py-1 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer text-xs"
            >
              إلغاء تصفية القسم والبحث في الكل
            </button>
          </div>
        )}

        {/* Active Filter Notification Bar */}
        {(selectedCategory || searchQuery) && (
          <div className="mb-6 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 text-xs text-foreground flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-primary flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>نتائج التصفية:</span>
              </span>

              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-lg">
                  <Tag className="w-3 h-3" />
                  <span>القسم: {selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(null)}
                    className="hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                    title="إزالة القسم"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 bg-card border border-border px-2.5 py-1 rounded-lg">
                  <Search className="w-3 h-3 text-muted-foreground" />
                  <span>البحث: &quot;{searchQuery}&quot;</span>
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                    title="مسح عبارة البحث"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <span className="text-muted-foreground font-semibold">
                ({filteredBlogs.length} {filteredBlogs.length === 1 ? 'موضوع' : 'مواضيع'})
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetAll}
              className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إلغاء جميع الفلاتر</span>
            </button>
          </div>
        )}

        {/* 2-Column Responsive Layout: Main Content (8 cols) + Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span>
                  {searchQuery
                    ? `نتائج البحث عن: "${searchQuery}"`
                    : selectedCategory
                    ? `مواضيع قسم: ${selectedCategory}`
                    : 'أحدث مواضيع المدونة'}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  ({filteredBlogs.length} موضوع)
                </span>
              </h2>
            </div>

            {filteredBlogs.length === 0 ? (
              <div className="text-center py-16 px-6 bg-card rounded-2xl border border-dashed border-border shadow-xs">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">لا توجد مواضيع مطابقة</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
                  {searchQuery
                    ? `لم نتمكن من العثور على أي مقالات تطابق بحثك عن "${searchQuery}". تأكد من كتابة الكلمات بشكل صحيح أو جرب كلمات مفتاحية أخرى.`
                    : 'لم يتم العثور على أي مقالات في هذا القسم حالياً.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="w-full sm:w-auto px-5 py-2.5 bg-primary text-primary-foreground text-xs md:text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
                  >
                    عرض كل المواضيع والمقالات
                  </button>
                </div>

                {/* Helpful tips */}
                <div className="mt-8 pt-6 border-t border-border/50 max-w-sm mx-auto text-right">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
                    <HelpCircle className="w-3.5 h-3.5 text-primary" />
                    <span>نصائح للبحث الأفضل:</span>
                  </div>
                  <ul className="text-2xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>ابحث بكلمات مختصرة (مثل: &quot;قنوات&quot; أو &quot;فلاشة&quot;).</li>
                    <li>لا تشترط الهمزات أو التشكيل أو الجمع/المفرد، فالبحث يتعرف عليها تلقائياً.</li>
                    <li>تصفح الأقسام المتاحة بالأعلى لاكتشاف جميع المحتويات.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBlogs.map((blog, index) => (
                  <Link
                    href={`/blog/${blog.slug}`}
                    key={blog.id || blog.slug || index}
                    className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 border border-border hover:border-primary/40"
                  >
                    {/* Image */}
                    <div className="relative w-full h-48 bg-muted overflow-hidden">
                      {blog.imageUrl ? (
                        <Image
                          src={blog.imageUrl}
                          alt={blog.title}
                          fill
                          priority={index < 2}
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <BookOpen className="w-12 h-12 text-primary/30" />
                        </div>
                      )}

                      {/* Category Overlay Badge */}
                      {(blog.category || (blog.tags && blog.tags.length > 0)) && (
                        <div className="absolute top-3 right-3">
                          <span className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-md backdrop-blur-xs">
                            {blog.category || blog.tags?.[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-base md:text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        {blog.title}
                      </h3>

                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {stripHtml(blog.content || '').substring(0, 140)}...
                      </p>

                      {/* Metadata Footer */}
                      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                        <div className="flex items-center gap-1.5 truncate max-w-[40%]">
                          <User className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-medium truncate">
                            {authorSettings?.name || blog.author || 'سوق العرب'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-amber-500" />
                            <span>{blog.views || 0}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <span>
                              {blog.createdAt?.seconds
                                ? format(new Date(blog.createdAt.seconds * 1000), 'd MMM yyyy', {
                                    locale: ar,
                                  })
                                : 'حديثاً'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Read More Link */}
                      <div className="mt-3 flex items-center gap-1 text-primary text-xs md:text-sm font-semibold group-hover:gap-2 transition-all">
                        <span>اقرأ التفاصيل</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Area (4 cols, sticky on desktop) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <BlogSidebar
              recentBlogs={recentBlogs}
              mostViewedBlogs={mostViewedBlogs}
              categories={categoriesWithCounts}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
