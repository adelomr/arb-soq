'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdCard from '@/components/AdCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, 
  Loader2, 
  PackageSearch,
  Building2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  MapPin,
  Check,
  Layers,
  Search,
  AlertTriangle,
  PlusCircle,
  CarFront
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import RequireAuthModal from '@/components/RequireAuthModal';
import type { Ad, PageData, Category, AdpageStore, AdpageBrand, AdpageConditionFilter } from '@/lib/types';
import { matchAdToCategory, matchAdToSubcategory, isAdInMarket, getParentCategoryId } from '@/lib/category-utils';
import { matchAdToBrand, POPULAR_CAR_BRANDS, isVehicleCategory } from '@/lib/car-brands';

const PHYSICAL_GOODS_CATEGORIES = ['vehicles', 'mobiles', 'electronics', 'furniture', 'fashion', 'baby', 'hobbies', 'trade'];

const UNIVERSAL_GOVERNORATES = [
  { id: 'gov_cairo', name: 'القاهرة' },
  { id: 'gov_giza', name: 'الجيزة' },
  { id: 'gov_alex', name: 'الإسكندرية' },
  { id: 'gov_qalubia', name: 'القليوبية' },
  { id: 'gov_sharqia', name: 'الشرقية' },
  { id: 'gov_daqahlia', name: 'الدقهلية' },
  { id: 'gov_gharbia', name: 'الغربية' },
  { id: 'gov_monufia', name: 'المنوفية' },
];

interface AdPageClientProps {
  page: PageData;
}

export default function AdPageClient({ page }: AdPageClientProps) {
  const { getAds, getCategories, user } = useAuth();
  const { market } = useMarket();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subQuery = searchParams?.get('sub');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAddAdClick = () => {
    if (user) {
      router.push('/submit');
    } else {
      setShowAuthModal(true);
    }
  };

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSub, setSelectedSub] = useState<string>(subQuery || page.adpageSubcategoryId || '');
  const [selectedGov, setSelectedGov] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedConditionFilter, setSelectedConditionFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'price_low' | 'price_high' | 'top_rated'>('recent');
  const [isSubcategoriesOpen, setIsSubcategoriesOpen] = useState<boolean>(false);
  const [isLocationOpen, setIsLocationOpen] = useState<boolean>(false);

  useEffect(() => {
    if (subQuery) {
      setSelectedSub(subQuery);
    }
  }, [subQuery]);

  const storesScrollRef = useRef<HTMLDivElement>(null);
  const brandsScrollRef = useRef<HTMLDivElement>(null);

  const categoryId = page.adpageCategoryId;
  const query = page.adpageQuery;

  const stores: AdpageStore[] = page.adpageStores && page.adpageStores.length > 0 ? page.adpageStores : [];
  const conditionFilters: AdpageConditionFilter[] = page.adpageConditionFilters && page.adpageConditionFilters.length > 0 ? page.adpageConditionFilters : [];

  // Load real categories to display category name
  useEffect(() => {
    let isMounted = true;
    getCategories().then(cats => {
      if (isMounted && cats) {
        setCategories(cats);
      }
    }).catch(err => console.error(err));
    return () => { isMounted = false; };
  }, [getCategories]);

  // Find category with guaranteed fallback subcategories
  const currentCategory = useMemo(() => {
    const targetId = (categoryId || '').toLowerCase();
    const slug = (page.slug || '').toLowerCase();
    const title = (page.title || '').toLowerCase();
    const parentId = getParentCategoryId(targetId || slug, categories);

    const found = categories.find((c) => {
      const cId = c.id.toLowerCase();
      return (
        cId === targetId ||
        cId === parentId ||
        (cId.length > 2 && slug.includes(cId)) ||
        (targetId.length > 2 && cId.includes(targetId)) ||
        (slug.includes('furniture') && cId === 'furniture') ||
        title.includes(c.name.ar.toLowerCase())
      );
    });

    return found || null;
  }, [categories, categoryId, page.slug, page.title]);

  const categoryName = currentCategory?.name?.ar || page.title || categoryId || 'جميع الإعلانات';

  useEffect(() => {
    let isSubscribed = true;
    setLoading(true);

    const unsubscribe = getAds(
      {
        status: 'active',
      },
      (fetchedAds) => {
        if (!isSubscribed) return;
        setAds(fetchedAds);
        setLoading(false);
      }
    );

    return () => {
      isSubscribed = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [getAds]);

  // Canonical category IDs — maps page slug / title / categoryId to a canonical key
  const canonicalCategoryId = useMemo((): string => {
    const id = (categoryId || '').toLowerCase();
    const slug = (page.slug || '').toLowerCase();
    const title = (page.title || '').toLowerCase();

    if (id === 'vehicles' || id === 'cars' || slug.includes('cars-auto') || title.includes('سيار') || title.includes('عربيا')) return 'vehicles';
    if (id === 'mobiles' || id === 'phones' || slug.includes('mobiles') || title.includes('موبايل') || title.includes('هاتف')) return 'mobiles';
    if (id === 'realestate' || slug.includes('real-estate') || title.includes('عقار')) return 'realestate';
    if (id === 'jobs' || slug.includes('jobs') || title.includes('وظائف')) return 'jobs';
    if (id === 'furniture' || slug.includes('furniture') || slug.includes('home-office') || title.includes('أثاث')) return 'furniture';
    if (id === 'electronics' || id.includes('electronic') || id.includes('appliance') || id.includes('device') || id.includes('tech') || slug.includes('electronics') || slug.includes('appliances') || title.includes('إلكترون') || title.includes('الكترون') || title.includes('أجهزة') || title.includes('اجهزة') || title.includes('كهربائي')) return 'electronics';
    if (id === 'fashion' || slug.includes('fashion') || title.includes('موضة')) return 'fashion';
    if (id === 'pets' || slug.includes('pets') || title.includes('حيوان')) return 'pets';
    if (id === 'baby' || slug.includes('baby') || title.includes('أطفال')) return 'baby';
    if (id === 'hobbies' || slug.includes('hobbies') || title.includes('هوايات')) return 'hobbies';
    if (id === 'trade' || slug.includes('commercial') || title.includes('تجارة')) return 'trade';
    if (id === 'services' || slug.includes('professional-services') || title.includes('خدمات')) return 'services';
    if (id === 'crafts' || id === 'cat_1786316040524' || id === 'labor' || slug.includes('crafts') || title.includes('مهن') || title.includes('حرف')) return 'crafts';
    return id || 'unknown';
  }, [categoryId, page.slug, page.title]);

  // Canonical category aliases — all IDs / names that map to each canonical key
  const CATEGORY_ALIASES: Record<string, string[]> = {
    vehicles:    ['vehicles', 'cars', 'عربيات', 'سيارات', 'مركبات'],
    mobiles:     ['mobiles', 'phones', 'tablets', 'موبايلات', 'هواتف'],
    realestate:  ['realestate', 'real-estate', 'عقارات'],
    jobs:        ['jobs', 'وظائف'],
    furniture:   ['furniture', 'أثاث'],
    electronics: ['electronics', 'electronic', 'appliances', 'devices', 'tech', 'electric', 'إلكترونيات', 'الكترونيات', 'إلكترونية', 'الكترونية', 'أجهزة', 'اجهزة', 'أجهزة إلكترونية', 'اجهزة الكترونية', 'أجهزة كهربائية', 'اجهزة كهربائية', 'كمبيوتر', 'لابتوب', 'شاشات', 'تلفزيون'],
    fashion:     ['fashion', 'موضة'],
    pets:        ['pets', 'حيوانات'],
    baby:        ['baby', 'kids', 'أطفال'],
    hobbies:     ['hobbies', 'هوايات'],
    trade:       ['trade', 'commercial', 'تجارة'],
    services:    ['services', 'خدمات'],
    crafts:      ['crafts', 'labor', 'cat_1786316040524', 'مهن', 'حرف'],
  };

  const adMatchesCategory = (ad: Ad, canonical: string): boolean => {
    const adCatId = ((ad as any).categoryId || '').toLowerCase().trim();
    const adCat   = (ad.category || '').toLowerCase().trim();
    const aliases = CATEGORY_ALIASES[canonical] || [canonical];

    // Primary match: exact categoryId stored in the ad document
    for (const alias of aliases) {
      if (adCatId === alias || adCat === alias) return true;
    }
    // Secondary: partial match only if the alias is long enough to avoid false positives
    for (const alias of aliases) {
      if (alias.length > 3 && (adCatId.includes(alias) || adCat.includes(alias))) return true;
    }
    return false;
  };

  const isVehiclePage = canonicalCategoryId === 'vehicles' || isVehicleCategory(categoryId, page.title || categoryName);

  // Filter ads — strictly by DB category fields with hierarchical fallback & active market
  const categoryMatchedAds = useMemo(() => {
    return ads.filter((ad) => {
      // Market filter: check if ad matches active header market
      if (!isAdInMarket(ad, market.id, market.name.ar)) return false;

      if (isVehiclePage) {
        if (
          ad.category === 'vehicles' ||
          ad.categoryId === 'vehicles' ||
          ad.category === 'cars' ||
          Boolean(ad.brand) ||
          isVehicleCategory(ad.category, ad.title)
        ) {
          return true;
        }
      }

      if (currentCategory && matchAdToCategory(ad, currentCategory, categories)) return true;
      if (canonicalCategoryId && canonicalCategoryId !== 'unknown' && matchAdToCategory(ad, canonicalCategoryId, categories)) return true;
      if (categoryId && matchAdToCategory(ad, categoryId, categories)) return true;
      return false;
    });
  }, [ads, market.id, market.name.ar, isVehiclePage, currentCategory, canonicalCategoryId, categoryId, categories]);

  const brands: AdpageBrand[] = useMemo(() => {
    let list: AdpageBrand[] = [];
    if (page.adpageBrands && page.adpageBrands.length > 0) {
      list = [...page.adpageBrands];
    } else if (isVehiclePage) {
      list = POPULAR_CAR_BRANDS.map(b => ({
        id: b.id,
        name: b.name,
      }));
    }

    if (list.length > 0) {
      const nonAll = list.filter(b => (b.name || '').trim() !== 'الكل' && b.id !== 'b_all' && b.id !== 'all');
      return [{ id: 'b_all', name: 'الكل' }, ...nonAll];
    }
    return [];
  }, [page.adpageBrands, isVehiclePage]);

  // Sidebar Subcategories with live ad counts
  const sidebarSubcategories = useMemo(() => {
    let rawSubs: { id: string; name: string }[] = [];
    if (currentCategory?.subcategories && currentCategory.subcategories.length > 0) {
      rawSubs = currentCategory.subcategories.map(sub => ({
        id: sub.id,
        name: typeof sub.name === 'string' ? sub.name : sub.name?.ar || sub.id,
      }));
    }

    return rawSubs.map(sub => {
      const count = categoryMatchedAds.filter(a => matchAdToSubcategory(a, sub.id, sub.name)).length;
      return { ...sub, count };
    });
  }, [currentCategory, categoryMatchedAds]);

  // Active Market Cities / Governorates List
  const activeMarketCities = useMemo(() => {
    if (market?.majorCities && market.majorCities.length > 0) {
      return market.majorCities.map((cityName, idx) => ({
        id: `city_${market.id || 'def'}_${idx}`,
        name: cityName,
      }));
    }
    return UNIVERSAL_GOVERNORATES;
  }, [market]);

  // Governorates with counts
  const governoratesWithCounts = useMemo(() => {
    return activeMarketCities.map(gov => {
      const count = categoryMatchedAds.filter(a => (a.location || '').toLowerCase().includes(gov.name.toLowerCase())).length;
      return { ...gov, count };
    });
  }, [activeMarketCities, categoryMatchedAds]);

  // Reset selectedGov when selected market country changes
  useEffect(() => {
    setSelectedGov('');
  }, [market?.id]);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const displayedAds = useMemo(() => {
    let list = categoryMatchedAds.filter(ad => {
      // Market / Country filter using unified helper
      if (market?.id && !isAdInMarket(ad, market.id, market.name.ar)) {
        return false;
      }

      // Subcategory filter
      if (selectedSub) {
        const subObj = sidebarSubcategories.find(s => s.id === selectedSub);
        const subName = subObj?.name || '';
        if (!matchAdToSubcategory(ad, selectedSub, subName)) return false;
      }
      // Location / Governorate filter
      if (selectedGov && ad.location && !ad.location.includes(selectedGov)) {
        return false;
      }
      // Brand filter
      if (selectedBrand && selectedBrand !== 'b_all' && selectedBrand !== 'الكل') {
        if (!matchAdToBrand(ad, selectedBrand)) return false;
      }
      // Condition / Status / Category-specific filter
      if (selectedConditionFilter && selectedConditionFilter !== 'all' && selectedConditionFilter !== 'c_all') {
        const selectedCf = conditionFilters.find((cf, idx) => (cf.id || cf.value || `cf_${idx}`) === selectedConditionFilter || cf.value === selectedConditionFilter || cf.id === selectedConditionFilter || cf.name === selectedConditionFilter);
        const filterVal = selectedCf ? (selectedCf.value || '').toLowerCase() : selectedConditionFilter.toLowerCase();
        const filterName = selectedCf ? selectedCf.name.toLowerCase() : '';

        if (filterVal === 'new' || filterName.includes('جديد') || filterName.includes('ممتاز')) {
          if (ad.condition !== 'new') return false;
        } else if (filterVal === 'used' || filterName.includes('مستعمل')) {
          if (ad.condition !== 'used') return false;
        } else if (filterVal === 'sale' || filterName.includes('بيع') || filterName.includes('تمليك')) {
          const isSale = (ad.title || '').toLowerCase().includes('بيع') || (ad.description || '').toLowerCase().includes('بيع') || ad.adType === 'sell-item' || ad.adType === 'sell-service' || (ad.adType as string) === 'sell';
          if (!isSale) return false;
        } else if (filterVal === 'rent' || filterName.includes('إيجار') || filterName.includes('ايجار')) {
          const isRent = (ad.title || '').toLowerCase().includes('إيجار') || (ad.title || '').toLowerCase().includes('ايجار') || (ad.description || '').toLowerCase().includes('إيجار') || (ad.description || '').toLowerCase().includes('ايجار') || (ad.adType as string) === 'rent';
          if (!isRent) return false;
        } else if (filterVal === 'top_rated' || filterVal.includes('تقييم') || filterName.includes('تقييم') || filterName.includes('اعلا')) {
          const hasRatingOrVerified =
            (typeof (ad as any).rating === 'number' && (ad as any).rating > 0) ||
            (typeof (ad as any).stars === 'number' && (ad as any).stars > 0) ||
            (typeof (ad.user as any)?.rating === 'number' && (ad.user as any)?.rating > 0) ||
            (ad.user as any)?.role === 'verified' ||
            (ad.user as any)?.verified === true ||
            !!ad.isPromoted;
          if (!hasRatingOrVerified) return false;
        } else if (filterVal === 'popular' || filterVal.includes('رواج') || filterName.includes('اختيار')) {
          const isPopular = !!ad.isPromoted || ((ad.views || 0) > 5) || (ad.user as any)?.role === 'verified';
          if (!isPopular) return false;
        } else if (filterVal === 'verified' || filterVal.includes('موثق') || filterName.includes('موثق')) {
          const isVerified = (ad.user as any)?.role === 'verified' || (ad.user as any)?.verified === true;
          if (!isVerified) return false;
        } else if (filterVal === 'custom' || (selectedCf && selectedCf.value === 'custom')) {
          const nameLower = selectedCf ? selectedCf.name.toLowerCase() : '';
          const matches = (ad.title || '').toLowerCase().includes(nameLower) ||
                          (ad.description || '').toLowerCase().includes(nameLower) ||
                          (ad.subcategory || '').toLowerCase().includes(nameLower);
          if (!matches) return false;
        }
      }

      // Query filter
      if (query) {
        const qLower = query.toLowerCase();
        const matches = (ad.title || '').toLowerCase().includes(qLower) || (ad.description && ad.description.toLowerCase().includes(qLower));
        if (!matches) return false;
      }

      return true;
    });

    // Sorting
    if (sortOrder === 'price_low') {
      list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOrder === 'price_high') {
      list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortOrder === 'top_rated') {
      list = [...list].sort((a, b) => {
        const ratingA = (a as any).rating || (a.user as any)?.rating || (a.isPromoted ? 4 : 0);
        const ratingB = (b as any).rating || (b.user as any)?.rating || (b.isPromoted ? 4 : 0);
        return ratingB - ratingA;
      });
    }

    return list;
  }, [categoryMatchedAds, selectedSub, selectedGov, selectedBrand, selectedConditionFilter, sortOrder, query, sidebarSubcategories, conditionFilters]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-background text-right" dir="rtl">
      <Header />

      <main className="flex-1">
        {/* Custom Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-accent/5 to-background pt-8 pb-10 px-4 md:px-8 border-b border-border/40">
          {page.adpageCoverImage && (
            <div className="absolute inset-0 z-0 opacity-20">
              <Image 
                src={page.adpageCoverImage} 
                alt={page.title} 
                fill 
                className="object-cover filter blur-xs"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>
          )}

          <div className="max-w-5xl mx-auto relative z-10 text-center space-y-3">
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight font-headline">
              {page.title}
            </h1>
          </div>
        </section>

        {/* ── 2. MAIN CONTENT WITH SIDEBAR ON THE RIGHT ───────────────────── */}
        <div className="container mx-auto px-4 py-6 flex-1">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ── RIGHT SIDEBAR ───────────────────────────────────────────── */}
            <aside className="w-full lg:w-72 xl:w-80 space-y-5 flex-shrink-0">
              {/* Subcategories Filter Card */}
              {sidebarSubcategories.length > 0 && (
                <Card className="rounded-2xl border border-border shadow-xs overflow-hidden bg-background">
                  <div
                    onClick={() => setIsSubcategoriesOpen(prev => !prev)}
                    className="p-3.5 sm:p-4 bg-secondary/30 border-b flex flex-col gap-2 cursor-pointer md:cursor-default select-none hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between w-full">
                      <h3 className="font-bold text-sm sm:text-base font-headline text-foreground">
                        فئات {categoryName}
                      </h3>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 md:hidden flex-shrink-0 ${
                          isSubcategoriesOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    {selectedSub && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                        <div className="inline-flex items-center gap-1 text-2xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                          <span className="text-muted-foreground font-normal">الفئة:</span>
                          <span>{sidebarSubcategories.find(s => s.id === selectedSub)?.name || 'محدد'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSub('');
                            setIsSubcategoriesOpen(false);
                          }}
                          className="text-xs text-muted-foreground hover:text-primary font-medium hover:underline cursor-pointer flex items-center gap-1"
                        >
                          ✕ عرض الكل
                        </button>
                      </div>
                    )}
                  </div>
                  <CardContent className={`p-4 space-y-3 ${isSubcategoriesOpen ? 'block' : 'hidden md:block'}`}>
                    <div className="flex items-center gap-2 text-base font-bold text-foreground font-headline pb-2 border-b">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Layers className="h-4 w-4" />
                      </div>
                      <span>{categoryName}</span>
                    </div>

                    <ul className="space-y-1.5 pt-1 max-h-72 overflow-y-auto pr-1 text-right custom-scrollbar">
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSub('');
                            setIsSubcategoriesOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all text-right ${
                            !selectedSub
                              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <span>جميع إعلانات {categoryName}</span>
                          {!selectedSub && <Check className="h-4 w-4 text-primary-foreground" />}
                        </button>
                      </li>
                      {sidebarSubcategories.map((sub) => {
                        const isSelected = selectedSub === sub.id;
                        return (
                          <li key={sub.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSub(isSelected ? '' : sub.id);
                                setIsSubcategoriesOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all text-right ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                              }`}
                            >
                              <span className="truncate">{sub.name}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-muted-foreground/80'
                                }`}
                              >
                                ({sub.count})
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Location Filter Card */}
              <Card className="rounded-2xl border border-border shadow-xs overflow-hidden bg-background">
                <div
                  onClick={() => setIsLocationOpen(prev => !prev)}
                  className="p-3.5 sm:p-4 bg-secondary/30 border-b flex flex-col gap-2 cursor-pointer md:cursor-default select-none hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base font-headline text-foreground">الموقع</h3>
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                        <span>{market?.name?.ar || 'مصر'}</span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 md:hidden flex-shrink-0 ${
                        isLocationOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {selectedGov && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                      <div className="inline-flex items-center gap-1 text-2xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                        <span className="text-muted-foreground font-normal">المحافظة:</span>
                        <span>{selectedGov}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGov('');
                          setIsLocationOpen(false);
                        }}
                        className="text-xs text-muted-foreground hover:text-rose-600 font-medium hover:underline cursor-pointer flex items-center gap-1"
                      >
                        ✕ إلغاء التحديد
                      </button>
                    </div>
                  )}
                </div>
                <CardContent className={`p-3 space-y-1 ${isLocationOpen ? 'block' : 'hidden md:block'}`}>
                  <ul className="space-y-1 max-h-72 overflow-y-auto pr-1 text-right custom-scrollbar">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGov('');
                          setIsLocationOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all text-right ${
                          !selectedGov
                            ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                        }`}
                      >
                        <span>جميع المحافظات</span>
                        {!selectedGov && <Check className="h-4 w-4 text-primary-foreground" />}
                      </button>
                    </li>
                    {governoratesWithCounts.map((gov) => {
                      const isSelected = selectedGov === gov.name;
                      return (
                        <li key={gov.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGov(isSelected ? '' : gov.name);
                              setIsLocationOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all text-right ${
                              isSelected
                                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                            }`}
                          >
                            <span className="truncate">{gov.name}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-muted-foreground/80'
                              }`}
                            >
                              ({gov.count})
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </aside>

            {/* ── LEFT MAIN CONTENT COLUMN ───────────────────────────────── */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Featured Stores / Showrooms Section (Only if configured) */}
              {stores.length > 0 && (
                <section className="bg-background rounded-2xl p-4 border border-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm md:text-base font-headline text-foreground flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-amber-500" />
                      <span>الشركات والمعارض المميزة</span>
                    </h3>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full"
                        onClick={() => scrollContainer(storesScrollRef, 'right')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full"
                        onClick={() => scrollContainer(storesScrollRef, 'left')}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div
                    ref={storesScrollRef}
                    className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1 px-1 scroll-smooth touch-pan-x overscroll-x-contain"
                  >
                    {stores.map((store) => (
                      <div
                        key={store.id}
                        className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer min-w-[130px] h-20 ${
                          store.active
                            ? 'border-amber-500 bg-amber-500 text-white shadow-md scale-[1.02]'
                            : 'border-border/70 bg-card hover:border-primary/50 hover:shadow-xs'
                        }`}
                      >
                        <span className="text-xs font-black tracking-tight text-center font-headline line-clamp-1">
                          {store.logoText || store.name}
                        </span>
                        <span className="text-[10px] opacity-80 mt-1">{store.subText || 'شركة موثقة'}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Brands & Quick Filter Pills */}
              {brands.length > 0 && (
                <div className="bg-background rounded-2xl p-3 sm:p-4 border border-border shadow-xs space-y-2.5">
                  {/* ترويسة الماركات مع زر الكل الثابت دائماً بجوار النص */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CarFront className="h-4 w-4 text-primary flex-shrink-0" />
                      <h4 className="font-bold text-xs sm:text-sm font-headline text-foreground">
                        {isVehiclePage ? 'ماركات السيارات والفلاتر السريعة' : 'الماركات والتصنيفات'}
                      </h4>

                      {/* زر الكل الثابت بجوار النص — لا يختفي أبداً عند تمرير الماركات */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBrand('');
                          setSelectedSub('');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          (!selectedBrand || selectedBrand === 'الكل' || selectedBrand === 'b_all' || selectedBrand === 'all')
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs font-extrabold scale-[1.02]'
                            : 'bg-secondary/70 text-foreground hover:bg-secondary border-border/80'
                        }`}
                      >
                        الكل
                      </button>

                      {selectedBrand && selectedBrand !== 'b_all' && selectedBrand !== 'الكل' && (
                        <Badge className="bg-primary text-primary-foreground text-2xs font-bold px-2 py-0.5">
                          {selectedBrand}
                        </Badge>
                      )}
                    </div>

                    {selectedBrand && selectedBrand !== 'b_all' && selectedBrand !== 'الكل' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBrand('');
                          setSelectedSub('');
                        }}
                        className="text-xs text-muted-foreground hover:text-primary font-medium hover:underline cursor-pointer flex items-center gap-1"
                      >
                        ✕ إعادة ضبط
                      </button>
                    )}
                  </div>

                  {/* شريط الماركات القابل للتمرير */}
                  <div className="relative flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full flex-shrink-0"
                      onClick={() => scrollContainer(brandsScrollRef, 'right')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <div
                      ref={brandsScrollRef}
                      className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 flex-1 scroll-smooth touch-pan-x overscroll-x-contain"
                    >
                      {brands
                        .filter((b) => (b.name || '').trim() !== 'الكل' && b.id !== 'b_all' && b.id !== 'all')
                        .map((brand) => {
                          const isSelected =
                            Boolean(selectedBrand) &&
                            selectedBrand.trim().toLowerCase() === (brand.name || '').trim().toLowerCase();

                          return (
                            <button
                              key={brand.id}
                              type="button"
                              onClick={() => {
                                setSelectedBrand(isSelected ? '' : (brand.name || '').trim());
                              }}
                              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground border-primary shadow-xs scale-[1.02]'
                                  : 'bg-secondary/30 text-foreground border-border/70 hover:bg-secondary hover:border-primary/40'
                              }`}
                            >
                              {brand.name}
                            </button>
                          );
                        })}
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full flex-shrink-0"
                      onClick={() => scrollContainer(brandsScrollRef, 'left')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ===== شريط الفلاتر الموحد ===== */}
              {(() => {
                const isServiceCategory = ['crafts', 'crafts-professions', 'services', 'professional-services', 'jobs', 'jobs-careers', 'transport', 'transport-delivery', 'pets', 'ziraa', 'agriculture', 'cat_1786316040524'].includes(categoryId || '');
                
                // إذا تم تحديد أزرار فلترة مخصصة في صفحة الإنشاء، نعرضها هي تماماً!
                // وإذا لم يتم تحديد أزرار، نعرض الفلاتر الافتراضية المناسبة لنوع الفئة
                const activeButtons: { id?: string; name: string; value: string }[] = 
                  conditionFilters.length > 0 
                    ? conditionFilters 
                    : isServiceCategory
                      ? [
                          { id: 'cf_all', name: 'الكل', value: 'all' },
                          { id: 'cf_recent', name: 'الأحدث', value: 'recent' },
                          { id: 'cf_top', name: '⭐ الأعلى تقييماً', value: 'top_rated' },
                          { id: 'cf_ver', name: 'حسابات وصنايعية موثقة', value: 'verified' },
                        ]
                      : categoryId === 'realestate'
                        ? [
                            { id: 'cf_all', name: 'الكل', value: 'all' },
                            { id: 'cf_recent', name: 'الأحدث', value: 'recent' },
                            { id: 'cf_sale', name: 'للبيع / تمليك', value: 'sale' },
                            { id: 'cf_rent', name: 'للإيجار', value: 'rent' },
                            { id: 'cf_top', name: '⭐ الأعلى تقييماً', value: 'top_rated' },
                          ]
                        : [
                            { id: 'cf_all', name: 'الكل', value: 'all' },
                            { id: 'cf_recent', name: 'الأحدث', value: 'recent' },
                            { id: 'cf_top', name: '⭐ الأعلى تقييماً', value: 'top_rated' },
                            { id: 'cf_new', name: 'جديد', value: 'new' },
                            { id: 'cf_used', name: 'مستعمل', value: 'used' },
                            { id: 'cf_low', name: 'الأقل سعراً', value: 'price_low' },
                            { id: 'cf_high', name: 'الأعلى سعراً', value: 'price_high' },
                          ];

                const isBtnSelected = (btn: { id?: string; value: string; name: string }, idx: number) => {
                  const key = btn.id || btn.value;
                  if (selectedConditionFilter === key) return true;
                  if (selectedConditionFilter === btn.value) return true;
                  if (selectedConditionFilter === btn.name) return true;
                  if ((selectedConditionFilter === 'all' || !selectedConditionFilter) && (btn.value === 'all' || idx === 0)) return true;
                  return false;
                };

                const handleBtnClick = (btn: { id?: string; value: string; name: string }) => {
                  const key = btn.id || btn.value;
                  setSelectedConditionFilter(key);
                  if (btn.value === 'all') {
                    setSelectedBrand('');
                    setSelectedSub('');
                    setSortOrder('recent');
                  } else if (btn.value === 'recent') {
                    setSortOrder('recent');
                  } else if (btn.value === 'top_rated') {
                    setSortOrder('top_rated');
                  } else if (btn.value === 'price_low') {
                    setSortOrder('price_low');
                  } else if (btn.value === 'price_high') {
                    setSortOrder('price_high');
                  }
                };

                return (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-muted-foreground px-1">فلتر</p>
                    <div className="flex flex-wrap items-center gap-2 bg-background p-3 rounded-2xl border border-border shadow-xs">
                      {activeButtons.map((btn, idx) => {
                        const isSelected = isBtnSelected(btn, idx);
                        return (
                          <button
                            key={btn.id || btn.value || idx}
                            type="button"
                            onClick={() => handleBtnClick(btn)}
                            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                              isSelected
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                            }`}
                          >
                            {btn.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Live Ads Listing Grid */}
              <section className="space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-16 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">جاري تحميل الإعلانات...</p>
                  </div>
                ) : displayedAds.length === 0 ? (
                  <Card className="text-center p-12 border-dashed border-border bg-card/50">
                    <PackageSearch className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                    <h3 className="text-lg font-bold text-foreground">لا توجد إعلانات متاحة حالياً في قسم {categoryName}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      يمكنك إضافة إعلانك الأول في هذا القسم من خلال زر إضافة إعلان.
                    </p>
                    <Button onClick={handleAddAdClick} className="bg-primary text-primary-foreground font-bold gap-2 cursor-pointer">
                      <PlusCircle className="h-4 w-4" />
                      <span>إضافة إعلان جديد</span>
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {displayedAds.map((ad) => (
                      <AdCard key={ad.id} ad={ad} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <RequireAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
