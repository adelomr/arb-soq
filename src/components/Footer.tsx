
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Facebook, Instagram, Users, Megaphone, Eye, Store, Rocket, ChevronDown, ExternalLink, Smartphone, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import type { SiteStats, PageData } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { appIconUrl } from '@/lib/data';
import { getPublishedPages, getPublishedLandingPages } from '@/lib/page-service';
import AppDownloadButton from './AppDownloadButton';


const translations = {
    ar: {
        aboutUs: "من نحن",
        privacyPolicy: "سياسة الخصوصية",
        termsOfUse: "اتفاقية الاستخدام",
        faq: "الأسئلة الشائعة",
        contactUs: "اتصل بنا",
        pricing: "الأسعار",
        company: "الشركة",
        legal: "قانوني",
        followUs: "تابعنا",
        rightsReserved: "سوق العرب. جميع الحقوق محفوظة.",
        statistics: "الإحصائيات",
        members: "الأعضاء المسجلون",
        ads: "الإعلانات المنشورة",
        visitors: "زيارات الموقع",
        stores: "المتاجر",
        landingPages: "صفحات الهبوط",
    }
}

export default function Footer() {
    const { getStats } = useAuth();
    const t = translations.ar;
    const [stats, setStats] = useState<SiteStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [dynamicPages, setDynamicPages] = useState<PageData[]>([]);
    const [landingPages, setLandingPages] = useState<PageData[]>();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const fetchedStats = await getStats();
                setStats(fetchedStats);
            } catch (error) {
                console.error("Failed to fetch site stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [getStats]);

    useEffect(() => {
        const fetchPages = async () => {
            try {
                const pages = await getPublishedPages();
                setDynamicPages(pages);
            } catch (error) {
                console.error("Failed to fetch dynamic pages for footer:", error);
            }
        };
        fetchPages();
    }, []);

    useEffect(() => {
        getPublishedLandingPages().then(setLandingPages).catch(() => setLandingPages([]));
    }, []);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { numberingSystem: 'latn' }).format(num);
    }

  return (
    <footer className="bg-secondary/80 dark:bg-card border-t" dir="rtl">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {/* About Section */}
            <div className="flex flex-col items-start col-span-2 md:col-span-2">
                 <Link href="/" className="flex items-center gap-2 font-bold text-lg font-headline mb-4">
                    <Image src={appIconUrl} alt="App Icon" width={48} height={48} className="h-12 w-12" />
                    <span className="text-xl">سوق العرب</span>
                </Link>
                <p className="text-sm text-muted-foreground max-w-sm">
                    {'أكبر سوق عربي للبيع والشراء. اكتشف صفقات مذهلة أو انشر إعلاناتك مجانًا.'}
                </p>

                <div className="mt-4">
                  <AppDownloadButton variant="compact" />
                </div>

                {/* Statistics Box directly under App Icon & Description */}
                <div className="mt-6 w-full max-w-sm border-t pt-4">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-xs">
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    <span>{t.statistics}</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                     {loading ? (
                        <>
                           <Skeleton className="h-7 w-full rounded-lg" />
                           <Skeleton className="h-7 w-full rounded-lg" />
                        </>
                    ) : (
                        <>
                           <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                                <span className="flex items-center gap-1 text-muted-foreground text-2xs"><Users className="h-3 w-3 text-primary"/>{t.members}</span>
                               <span className="font-bold text-foreground text-xs">{stats ? formatNumber(stats.totalMembers) : '0'}</span>
                           </div>
                           <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                               <span className="flex items-center gap-1 text-muted-foreground text-2xs"><Store className="h-3 w-3 text-primary"/>{t.stores}</span>
                               <span className="font-bold text-foreground text-xs">{stats ? formatNumber(stats.totalStores) : '0'}</span>
                           </div>
                           <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                               <span className="flex items-center gap-1 text-muted-foreground text-2xs"><Megaphone className="h-3 w-3 text-primary"/>{t.ads}</span>
                               <span className="font-bold text-foreground text-xs">{stats ? formatNumber(stats.totalAds) : '0'}</span>
                           </div>
                           <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                               <span className="flex items-center gap-1 text-muted-foreground text-2xs"><Eye className="h-3 w-3 text-primary"/>{t.visitors}</span>
                               <span className="font-bold text-foreground text-xs">{stats ? formatNumber(stats.totalVisits) : '0'}</span>
                           </div>
                        </>
                    )}
                  </div>
                </div>

                 <div className="mt-5">
                    <h3 className="font-semibold text-foreground mb-3 text-xs">{t.followUs}</h3>
                    <div className="flex gap-4">
                        <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
                            <Twitter className="h-5 w-5" />
                        </Link>
                        <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                            <Facebook className="h-5 w-5" />
                        </Link>
                        <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                            <Instagram className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Category Pages Column (between Souq Al Arab and Landing Pages Drawer) */}
            <div>
              <button
                onClick={() => setCategoryDrawerOpen(o => !o)}
                className="flex items-center gap-2 font-semibold text-foreground mb-4 group hover:text-primary transition-colors text-right"
              >
                <span>فئات الأقسام</span>
                <span className="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1 rounded-full bg-primary/10 text-primary text-2xs font-bold">
                  13
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 ${categoryDrawerOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              <nav 
                className="flex flex-col gap-2.5 overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: categoryDrawerOpen ? '420px' : '150px',
                  opacity: 1,
                }}
              >
                {[
                  { title: 'عربيات وقطع غيار', href: '/p/cars-auto-parts' },
                  { title: 'عقارات', href: '/p/real-estate' },
                  { title: 'موبايلات وتابلت', href: '/p/mobiles-tablets' },
                  { title: 'أثاث وديكور', href: '/p/home-office-furniture' },
                  { title: 'أجهزة إلكترونية', href: '/p/electronics-appliances' },
                  { title: 'وظائف', href: '/p/jobs-careers' },
                  { title: 'الموضة والجمال', href: '/p/fashion-beauty' },
                  { title: 'المهن والحرف', href: '/p/crafts-professions' },
                  { title: 'خدمات إعلانية', href: '/p/professional-services' },
                  { title: 'تجارة وصناعة', href: '/p/commercial-industrial' },
                  { title: 'حيوانات أليفة', href: '/p/pets-animals' },
                  { title: 'مستلزمات أطفال', href: '/p/baby-kids' },
                  { title: 'هوايات وتسلية', href: '/p/hobbies-sports' },
                ].map((cat, idx) => (
                  <Link
                    key={idx}
                    href={cat.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/30 flex-shrink-0" />
                    <span className="truncate">{cat.title}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Landing Pages Column (Collapsible Drawer in Grid) */}
            <div>
                {landingPages && landingPages.length > 0 ? (
                  <>
                    <button
                      onClick={() => setDrawerOpen(o => !o)}
                      className="flex items-center gap-2 font-semibold text-foreground mb-4 group hover:text-primary transition-colors text-right"
                    >
                      <span>{t.landingPages}</span>
                      <span className="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1 rounded-full bg-primary/10 text-primary text-2xs font-bold">
                        {landingPages.length}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 ${drawerOpen ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                    <nav 
                      className="flex flex-col gap-2.5 overflow-hidden transition-all duration-300"
                      style={{
                        maxHeight: drawerOpen ? '380px' : '150px',
                        opacity: 1,
                      }}
                    >
                      {landingPages.map((page) => (
                        <Link
                          key={page.id}
                          href={`/p/${page.slug}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/30 flex-shrink-0" />
                          <span className="truncate">{page.title}</span>
                        </Link>
                      ))}
                    </nav>
                  </>
                ) : (
                  <div className="h-full" />
                )}
            </div>

            {/* Company Links */}
            <div>
                <h3 className="font-semibold text-foreground mb-4">{t.company}</h3>
                <nav className="flex flex-col gap-3">
                    {dynamicPages
                        .filter(page => {
                            const COMPANY_SLUGS = ['about', 'faq', 'contact'];
                            return COMPANY_SLUGS.includes(page.slug) && page.pageType !== 'landing';
                        })
                        .map((page) => (
                            <Link 
                                key={page.id} 
                                href={`/p/${page.slug}`} 
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                {page.title}
                            </Link>
                        ))
                    }
                    <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">{t.pricing}</Link>
                </nav>
            </div>

             {/* Legal Links — strictly privacy & terms */}
            <div>
                <h3 className="font-semibold text-foreground mb-4">{t.legal}</h3>
                <nav className="flex flex-col gap-3">
                    {dynamicPages
                        .filter(page => {
                            const LEGAL_SLUGS = ['privacy', 'terms', 'privacy-policy', 'terms-of-use', 'terms-of-service', 'legal'];
                            return LEGAL_SLUGS.includes(page.slug.toLowerCase()) && page.pageType !== 'landing' && page.pageType !== 'adpage';
                        })
                        .map((page) => (
                            <Link 
                                key={page.id} 
                                href={`/p/${page.slug}`} 
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                {page.title}
                            </Link>
                        ))
                    }
                    <Link href="/p/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
                        {t.privacyPolicy}
                    </Link>
                    <Link href="/p/terms-of-use" className="text-muted-foreground hover:text-primary transition-colors">
                        {t.termsOfUse}
                    </Link>
                </nav>
            </div>
            </div>

        <div className="mt-6 border-t pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {t.rightsReserved}
        </div>
      </div>
    </footer>
  );
}

