
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Facebook, Instagram, Users, Megaphone, Eye, Store, Rocket, ChevronDown, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import type { SiteStats, PageData } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { appIconUrl } from '@/lib/data';
import { getPublishedPages, getPublishedLandingPages } from '@/lib/page-service';

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
                 <div className="mt-6">
                    <h3 className="font-semibold text-foreground mb-4">{t.followUs}</h3>
                    <div className="flex gap-4 mt-2">
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
                        maxHeight: drawerOpen ? '350px' : '0px',
                        opacity: drawerOpen ? 1 : 0,
                      }}
                    >
                      {landingPages.map((page) => (
                        <Link
                          key={page.id}
                          href={page.shortCode ? `/l/${page.shortCode}` : `/p/${page.slug}`}
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

             {/* Legal Links */}
            <div>
                <h3 className="font-semibold text-foreground mb-4">{t.legal}</h3>
                <nav className="flex flex-col gap-3">
                    {dynamicPages
                        .filter(page => {
                            // Show legal system pages (terms, privacy) and any custom non-system pages, excluding landing pages
                            const COMPANY_SLUGS = ['about', 'faq', 'contact'];
                            return !COMPANY_SLUGS.includes(page.slug) && page.pageType !== 'landing';
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
                </nav>
            </div>
            
            {/* Statistics */}
            <div>
                <h3 className="font-semibold text-foreground mb-4">{t.statistics}</h3>
                <div className="space-y-3">
                     {loading ? (
                        <div className="space-y-3">
                           <Skeleton className="h-8 w-full rounded-lg" />
                           <Skeleton className="h-8 w-full rounded-lg" />
                           <Skeleton className="h-8 w-full rounded-lg" />
                           <Skeleton className="h-8 w-full rounded-lg" />
                        </div>
                    ) : (
                        <>
                           <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4"/>{t.members}</span>
                               <span className="font-bold text-foreground">{stats ? formatNumber(stats.totalMembers) : '0'}</span>
                           </div>
                           <div className="flex items-center justify-between">
                               <span className="flex items-center gap-2 text-sm text-muted-foreground"><Store className="h-4 w-4"/>{t.stores}</span>
                               <span className="font-bold text-foreground">{stats ? formatNumber(stats.totalStores) : '0'}</span>
                           </div>
                           <div className="flex items-center justify-between">
                               <span className="flex items-center gap-2 text-sm text-muted-foreground"><Megaphone className="h-4 w-4"/>{t.ads}</span>
                               <span className="font-bold text-foreground">{stats ? formatNumber(stats.totalAds) : '0'}</span>
                           </div>
                           <div className="flex items-center justify-between">
                               <span className="flex items-center gap-2 text-sm text-muted-foreground"><Eye className="h-4 w-4"/>{t.visitors}</span>
                               <span className="font-bold text-foreground">{stats ? formatNumber(stats.totalVisits) : '0'}</span>
                           </div>
                        </>
                    )}
                </div>
            </div>

            </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {t.rightsReserved}
        </div>
      </div>
    </footer>
  );
}

