'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Footer from '@/components/Footer';
import type { PageData } from '@/lib/types';
import { DEFAULT_LANDING_SECTIONS } from '@/lib/types';
import { 
  Search, 
  Sparkles, 
  Truck, 
  Droplets, 
  Building, 
  Bug, 
  Wind, 
  Car, 
  Briefcase, 
  Phone, 
  MessageCircle, 
  MapPin, 
  ArrowLeft, 
  ExternalLink, 
  Layers, 
  Rocket, 
  Filter, 
  CheckCircle2,
  Building2,
  ChevronDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const ICON_MAP: Record<string, any> = {
  Truck,
  Sparkles,
  Droplets,
  Building,
  Bug,
  Wind,
  Car,
  Briefcase,
};

interface LandingSectionsClientProps {
  initialPages: PageData[];
}

export default function LandingSectionsClient({ initialPages }: LandingSectionsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');

  // Compute pages count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialPages.length };
    DEFAULT_LANDING_SECTIONS.forEach(sec => {
      counts[sec.id] = 0;
    });
    initialPages.forEach(page => {
      const cat = page.landingCategory || 'general-services';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [initialPages]);

  // Extract unique areas from pages
  const uniqueAreas = useMemo(() => {
    const areas = new Set<string>();
    initialPages.forEach(p => {
      if (p.serviceArea) areas.add(p.serviceArea.trim());
    });
    return Array.from(areas);
  }, [initialPages]);

  // Filtered pages list
  const filteredPages = useMemo(() => {
    return initialPages.filter(page => {
      // Category filter
      if (selectedCategory !== 'all') {
        const cat = page.landingCategory || 'general-services';
        if (cat !== selectedCategory) return false;
      }
      // Area filter
      if (areaFilter && page.serviceArea !== areaFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = page.title?.toLowerCase().includes(q);
        const serviceNameMatch = page.serviceName?.toLowerCase().includes(q);
        const areaMatch = page.serviceArea?.toLowerCase().includes(q);
        const descMatch = page.description?.toLowerCase().includes(q);
        const contentMatch = page.content?.toLowerCase().includes(q);
        return titleMatch || serviceNameMatch || areaMatch || descMatch || contentMatch;
      }
      return true;
    });
  }, [initialPages, selectedCategory, areaFilter, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground dir-rtl" dir="rtl">
      <Header />

      <main className="flex-1">
        {/* ===== HERO SECTION ===== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background py-14 md:py-20 border-b border-border/40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
          
          <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 border border-primary/20 animate-fade-in">
              <Rocket className="w-4 h-4" />
              <span>دليل وأقسام صفحات الهبوط المباشرة</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-headline tracking-tight text-foreground mb-4 leading-tight">
              تصفح أفضل <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">صفحات الهبوط والخدمات</span> المتاحة
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              ابحث عن الخدمات الاحترافية، شركات نقل العفش، كشف التسربات، الصيانة والمقاولات في منطقتك وتواصل مباشرة مع المزودين بنقرة واحدة.
            </p>

            {/* Search Controls */}
            <div className="bg-card/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-border shadow-xl max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ابحث باسم الخدمة أو الكلمة المفتاحية..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-10 bg-background border-border text-foreground rounded-xl h-11 text-sm text-right"
                />
              </div>

              <div className="sm:col-span-5 relative">
                <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  value={areaFilter}
                  onChange={e => setAreaFilter(e.target.value)}
                  className="w-full h-11 pr-10 pl-4 bg-background border border-border text-foreground rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-right"
                >
                  <option value="">جميع المناطق والمدن</option>
                  {uniqueAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== CATEGORIES BAR SECTION ===== */}
        <section className="py-8 bg-secondary/30 border-b border-border/40 sticky top-16 z-20 backdrop-blur-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                    : 'bg-card hover:bg-accent text-foreground border border-border'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>جميع الأقسام</span>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${selectedCategory === 'all' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {categoryCounts['all'] || 0}
                </span>
              </button>

              {DEFAULT_LANDING_SECTIONS.map(sec => {
                const IconComp = ICON_MAP[sec.iconName] || Briefcase;
                const isSelected = selectedCategory === sec.id;
                const count = categoryCounts[sec.id] || 0;

                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedCategory(sec.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                        : 'bg-card hover:bg-accent text-foreground border border-border'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span>{sec.name.ar}</span>
                    <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== LANDING PAGES GRID ===== */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Header info bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-headline text-foreground flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  <span>
                    {selectedCategory === 'all'
                      ? 'جميع صفحات الهبوط المتاحة'
                      : DEFAULT_LANDING_SECTIONS.find(s => s.id === selectedCategory)?.name.ar}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  تم إيجاد <span className="font-bold text-primary">{filteredPages.length}</span> صفحة هبوط مطابقة لخياراتك
                </p>
              </div>

              {(searchQuery || areaFilter || selectedCategory !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setAreaFilter('');
                  }}
                  className="text-xs rounded-xl"
                >
                  إعادة ضبط الفلاتر
                </Button>
              )}
            </div>

            {/* Grid */}
            {filteredPages.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border max-w-lg mx-auto p-8">
                <Rocket className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">لا توجد صفحات هبوط بهذا القسم حالياً</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  جرب اختيار قسم آخر أو البحث عن كلمة مفتاحية مختلفة.
                </p>
                <Button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setAreaFilter('');
                  }}
                  className="rounded-xl"
                >
                  عرض جميع صفحات الهبوط
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPages.map(page => {
                  const secObj = DEFAULT_LANDING_SECTIONS.find(s => s.id === (page.landingCategory || 'general-services'));
                  const pageLink = `/p/${page.slug}`;

                  return (
                    <Card
                      key={page.id || page.slug}
                      className="group overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Cover Image Header */}
                        <div className="relative h-48 w-full overflow-hidden bg-muted">
                          {page.coverImageUrl ? (
                            <Image
                              src={page.coverImageUrl}
                              alt={page.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-purple-600/20 flex items-center justify-center">
                              <Rocket className="w-12 h-12 text-primary/40" />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                          {/* Section Badge */}
                          {secObj && (
                            <div className="absolute top-3 right-3 z-10">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${secObj.badgeColor || 'bg-background/90 text-foreground border-border'}`}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {secObj.name.ar}
                              </span>
                            </div>
                          )}

                          {/* Area Badge */}
                          {page.serviceArea && (
                            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 text-white text-xs font-medium bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              <span>{page.serviceArea}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-5">
                          <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1.5">
                            {page.title}
                          </h3>

                          {page.subtitle && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                              {page.subtitle}
                            </p>
                          )}

                          {page.serviceName && (
                            <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-3">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>الخدمة: {page.serviceName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-5 pb-5 pt-0 mt-auto flex flex-col gap-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          {page.whatsappNumber ? (
                            <a
                              href={`https://wa.me/${page.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(page.whatsappMessage || 'السلام عليكم، أود الاستفسار عن خدمتكم')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors shadow-sm"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>واتساب</span>
                            </a>
                          ) : (
                            <div />
                          )}

                          {page.phoneNumber ? (
                            <a
                              href={`tel:${page.phoneNumber}`}
                              className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 px-3 rounded-xl transition-colors shadow-sm"
                            >
                              <Phone className="w-4 h-4" />
                              <span>إتصال مباشر</span>
                            </a>
                          ) : (
                            <div />
                          )}
                        </div>

                        <Link
                          href={pageLink}
                          className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold py-2.5 px-4 rounded-xl transition-all group-hover:bg-primary/10 group-hover:text-primary"
                        >
                          <span>عرض صفحة الهبوط كاملة</span>
                          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
