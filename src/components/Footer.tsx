
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Facebook, Instagram, Users, Megaphone, Eye, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import type { SiteStats } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { appIconUrl } from '@/lib/data';

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
    }
}

export default function Footer() {
    const { getStats } = useAuth();
    const t = translations.ar;
    const [stats, setStats] = useState<SiteStats | null>(null);
    const [loading, setLoading] = useState(true);

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

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { numberingSystem: 'latn' }).format(num);
    }

  return (
    <footer className="bg-secondary/80 dark:bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
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

            {/* Company Links */}
            <div>
                <h3 className="font-semibold text-foreground mb-4">{t.company}</h3>
                <nav className="flex flex-col gap-3">
                    <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">{t.aboutUs}</Link>
                    <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">{t.pricing}</Link>
                    <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">{t.faq}</Link>
                    <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">{t.contactUs}</Link>
                </nav>
            </div>

             {/* Legal Links */}
            <div>
                <h3 className="font-semibold text-foreground mb-4">{t.legal}</h3>
                <nav className="flex flex-col gap-3">
                    <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">{t.termsOfUse}</Link>
                    <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">{t.privacyPolicy}</Link>
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
