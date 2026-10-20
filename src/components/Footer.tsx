
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Facebook, Instagram, Users, Megaphone, Eye, Store, Rocket, ChevronDown, ExternalLink, Smartphone, LayoutGrid, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import type { SiteStats, PageData } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { appIconUrl } from '@/lib/data';
import { getPublishedPages, getPublishedLandingPages } from '@/lib/page-service';
import { getAllBlogCategories } from '@/lib/blog-service';
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
        blog: "المدونة",
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
    const { getStats, categories, getPageUrlForCategory } = useAuth();
    const t = translations.ar;
    const [stats, setStats] = useState<SiteStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [dynamicPages, setDynamicPages] = useState<PageData[]>([]);
    const [landingPages, setLandingPages] = useState<PageData[]>();
    const [blogCategories, setBlogCategories] = useState<string[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
    const [blogDrawerOpen, setBlogDrawerOpen] = useState(false);

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

    useEffect(() => {
        getAllBlogCategories().then(setBlogCategories).catch(() => setBlogCategories([]));
    }, []);

    const termsPage = dynamicPages.find(p => ['terms', 'terms-of-use', 'terms-of-service'].includes(p.slug.toLowerCase()));
    const termsHref = termsPage ? `/p/${termsPage.slug}` : '/p/terms';

    const formatNumber = (num: number) => {
        try {
            return new Intl.NumberFormat('en-US', { numberingSystem: 'latn' }).format(num || 0);
        } catch {
            return String(num || 0);
        }
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
                  {categories.length}
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
                {categories.length > 0 ? (
                  categories.map((cat) => {
                    const catName = cat.name?.ar || cat.id;
                    const catHref = getPageUrlForCategory ? getPageUrlForCategory(cat.id, undefined, catName) : `/search?q=${encodeURIComponent(catName)}`;
                    return (
                      <Link
                        key={cat.id}
                        href={catHref}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/30 flex-shrink-0" />
                        <span className="truncate">{catName}</span>
                      </Link>
                    );
                  })
                ) : (
                  <Link
                    href="/categories"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/30 flex-shrink-0" />
                    <span>تصفح الفئات</span>
                  </Link>
                )}
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

            {/* Company Links (includes About, Contact, Pricing, and Terms/Privacy) */}
            <div>
                <h3 className="font-semibold text-foreground mb-4">{t.company}</h3>
                <nav className="flex flex-col gap-3">
                    {dynamicPages
                        .filter(page => {
                            const COMPANY_AND_LEGAL_SLUGS = [
                              'about', 'faq', 'contact', 
                              'terms', 'privacy', 'privacy-policy', 
                              'terms-of-use', 'terms-of-service', 'legal'
                            ];
                            return COMPANY_AND_LEGAL_SLUGS.includes(page.slug.toLowerCase()) && page.pageType !== 'landing' && page.pageType !== 'adpage';
                        })
                        .map((page) => (
                            <Link 
                                key={page.id} 
                                href={`/p/${page.slug}`} 
                                className="text-muted-foreground hover:text-primary transition-colors text-sm"
                            >
                                {page.title}
                            </Link>
                        ))
                    }
                    {/* Ensure Terms of Use is accessible under Company */}
                    {!dynamicPages.some(p => ['terms', 'terms-of-use', 'terms-of-service'].includes(p.slug.toLowerCase())) && (
                        <Link href="/p/terms" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                            {t.termsOfUse}
                        </Link>
                    )}
                    <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t.pricing}</Link>
                </nav>
            </div>

            {/* Blog Categories Column (Drawer styled like Landing Pages) */}
            <div>
                <div className="flex items-center gap-2 font-semibold text-foreground mb-4 text-right">
                  <Link
                    href="/blog"
                    className="text-foreground hover:text-primary transition-colors font-bold"
                  >
                    {t.blog}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setBlogDrawerOpen(o => !o)}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
                    title="توسيع أو طي أقسام المدونة"
                    aria-label="توسيع أو طي أقسام المدونة"
                  >
                    <span className="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1 rounded-full bg-primary/10 text-primary text-2xs font-bold">
                      {blogCategories.length}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 ${blogDrawerOpen ? 'rotate-180' : 'rotate-0'}`} />
                  </button>
                </div>
                <nav 
                  className={`flex flex-col gap-2.5 transition-all duration-300 ${blogDrawerOpen ? 'overflow-y-auto scrollbar-thin pr-1' : 'overflow-hidden'}`}
                  style={{
                    maxHeight: blogDrawerOpen ? '420px' : '150px',
                    opacity: 1,
                  }}
                >
                  <Link
                    href="/blog"
                    className="text-sm font-semibold text-primary hover:underline transition-colors flex items-center gap-1.5 pb-1 border-b border-border/40 mb-0.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>الرئيسية للمدونة</span>
                  </Link>
                  {blogCategories.length > 0 ? (
                    blogCategories.map((cat, idx) => (
                      <Link
                        key={idx}
                        href={`/blog?category=${encodeURIComponent(cat)}`}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/30 flex-shrink-0" />
                        <span className="truncate">{cat}</span>
                      </Link>
                    ))
                  ) : (
                    <Link
                      href="/blog"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/30 flex-shrink-0" />
                      <span>تصفح كل الموضوعات</span>
                    </Link>
                  )}
                </nav>
            </div>
            </div>

        {/* Bottom Footer Bar */}
        <div className="mt-6 border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 flex-wrap">
                <span>&copy; {new Date().getFullYear()} {t.rightsReserved}</span>
                <span className="text-muted-foreground/40">•</span>
                <Link
                  href={termsHref}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  {termsPage?.title || t.termsOfUse}
                </Link>
            </div>
            <a
                href="https://wa.me/201127556848"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
            >
                <MessageCircle className="h-3.5 w-3.5 text-green-500 group-hover:scale-110 transition-transform" />
                <span>برمجة وتصميم ابو القعقاع للصيانة وادارة الاعلانات</span>
            </a>
        </div>
      </div>
    </footer>
  );
}

