'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WorkerRow from '@/components/WorkerRow';
import { useMarket } from '@/context/MarketContext';
import { Loader2, PlusCircle, Phone, Briefcase as BriefcaseIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import QuickOptions from '@/components/QuickOptions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

const translations = {
    ar: {
        title_prefix: "سوق عمال",
        subtitle: "اعثر على أفضل العمال والحرفيين لمشاريعك.",
        servicesAvailable: "عامل متاح في سوقك",
        loading: "جارٍ تحميل العمال...",
        noWorkers: "لا يوجد عمال متاحون حاليًا لهذه المهنة.",
        joinMarket: "الانضمام إلى سوق العمال",
        joinMarketDesc: "أضف مهنتك ورقم هاتفك إلى ملفك الشخصي لتظهر هنا.",
        searchPlaceholder: "اختر مهنة للتصفية...",
        allProfessions: "جميع المهن",
        usersCount: "عدد المستخدمين",
        selectProfession: "اختر مهنة",
        loadingTitle: "سوق العمال",
        joinMarketDialogTitle: "متطلبات الانضمام للسوق",
        joinMarketDialogDesc: "لتكون جزءًا من سوق العمال وتظهر للعملاء، يجب عليك إكمال ملفك الشخصي:",
        requirement1: "تحديد مهنتك",
        requirement2: "إضافة رقم هاتف موثّق",
        goToProfile: "الانتقال للملف الشخصي",
        cancel: "إلغاء",
    },
}

export default function LaborMarketPage() {
  const { market } = useMarket();
  const t = translations.ar;
  const { getAllUsers, user, userProfile, professions, refreshUserProfile } = useAuth();
  
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessionId, setSelectedProfessionId] = useState<string>('all');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Refresh user profile on component mount to get latest data
    if (user) {
      refreshUserProfile();
    }
  }, [user, refreshUserProfile]);

  useEffect(() => {
    setLoading(true);
    const fetchWorkers = async () => {
      const allUsers = await getAllUsers();
      const laborUsers = allUsers.filter(u => u.profession && u.phoneVerified);
      setWorkers(laborUsers);
      setLoading(false);
    }

    fetchWorkers();
  }, [getAllUsers]);
  
  const isUserQualified = user && userProfile && userProfile.profession && userProfile.phoneVerified;
  const userCity = userProfile?.city;
  
  const filteredAndSortedWorkers = workers
  .filter(worker => {
    if (!worker.country) return false;
    const workerCountry = worker.country.trim().toLowerCase();
    const marketNameAr = market.name.ar.toLowerCase();
    // Correctly reference the english name from the market object which is also 'ar' in the provided markets.ts
    const marketNameEn = market.name.ar.toLowerCase();
    return workerCountry.includes(marketNameAr) || workerCountry.includes(marketNameEn);
  })
  .filter(worker => {
      if (selectedProfessionId !== 'all' && worker.profession !== selectedProfessionId) {
          return false;
      }
      return true;
  })
  .sort((a, b) => {
      if (userCity) {
          const cityA = a.city || '';
          const cityB = b.city || '';
          const userCityLower = userCity.toLowerCase();
          
          const aIsInUserCity = cityA.toLowerCase() === userCityLower;
          const bIsInUserCity = cityB.toLowerCase() === userCityLower;

          if (aIsInUserCity && !bIsInUserCity) return -1;
          if (!aIsInUserCity && bIsInUserCity) return 1;
      }
      return 0;
  });
    
  const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtTop = element.scrollTop === 0;
    const isAtBottom = element.scrollHeight - element.scrollTop === element.clientHeight;

    if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
      e.stopPropagation();
    }
  };

  const dynamicTitle = `${t.title_prefix} ${market.name.ar}`;

  const renderWorkerList = () => {
    return (
        <div className="space-y-4">
            {filteredAndSortedWorkers.map(worker => (
                <WorkerRow key={worker.id} worker={worker} />
            ))}
        </div>
    );
  };
  
  const hasProfession = !!userProfile?.profession;
  const hasPhone = !!userProfile?.phoneVerified;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <QuickOptions />
      <main className="flex-1 bg-background">
        <section className="bg-secondary/50 py-12">
            <div className="container mx-auto px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold font-headline">
                    {dynamicTitle}
                </h1>
                <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                    {t.subtitle}
                </p>
                 {!isUserQualified && user && (
                    <div className="mt-6 bg-primary/10 p-4 rounded-lg max-w-lg mx-auto">
                        <p className="text-primary font-semibold mb-2">{t.joinMarketDesc}</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {t.joinMarket}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t.joinMarketDialogTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>{t.joinMarketDialogDesc}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <ul className="space-y-3 py-2 text-sm">
                                    {!hasProfession && (
                                        <li className="flex items-center gap-3">
                                            <BriefcaseIcon className="h-5 w-5 text-primary"/>
                                            <span>{t.requirement1}</span>
                                        </li>
                                    )}
                                     {!hasPhone && (
                                        <li className="flex items-center gap-3">
                                            <Phone className="h-5 w-5 text-primary"/>
                                            <span>{t.requirement2}</span>
                                        </li>
                                     )}
                                </ul>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                        <Link href="/profile">{t.goToProfile}</Link>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="space-y-6">
                <div className="sticky top-[8.5rem] z-30 bg-background/95 py-2">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="w-full sm:w-auto min-w-[288px] space-y-2">
                            <Label htmlFor="profession-select">{t.selectProfession}</Label>
                            {isClient && (
                                <Select onValueChange={(value) => setSelectedProfessionId(value)} defaultValue="all" dir="rtl">
                                    <SelectTrigger id="profession-select" className="w-full text-base h-12">
                                        <SelectValue placeholder={t.searchPlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <ScrollArea className="h-60" onWheel={handleWheelScroll}>
                                        <SelectItem value="all">{t.allProfessions}</SelectItem>
                                        {professions.map((prof) => (
                                            <SelectItem key={prof.id} value={prof.id}>
                                            {prof.name.ar}
                                            </SelectItem>
                                        ))}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>{t.usersCount}</Label>
                            <div className="h-12 border bg-card p-3 flex items-center justify-center rounded-md">
                                <p className="text-lg font-bold">{filteredAndSortedWorkers.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2">{t.loading}</span>
                        </div>
                    ) : filteredAndSortedWorkers.length > 0 ? (
                        renderWorkerList()
                    ) : (
                        <div className="text-center py-16 text-muted-foreground">
                            {t.noWorkers}
                        </div>
                    )}
                </div>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
