'use client';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Pencil, 
  Trash2, 
  Loader2, 
  LayoutDashboard, 
  Store, 
  PlusCircle, 
  Building, 
  Edit, 
  Eye, 
  MousePointerClick, 
  RotateCcw, 
  AlertTriangle, 
  Activity, 
  BarChart3, 
  CarFront, 
  Download, 
  Sparkles, 
  Smartphone,
  Share2,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Layers,
  Copy
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { useMarket } from '@/context/MarketContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import type { Ad, Category, SubCategory, UserProfile } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import AdPlaceholder from '@/components/AdPlaceholder';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import StoreCard from './StoreCard';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const translations = {
    ar: {
        dashboardTitle: "إدارة الإعلانات",
        dashboardDescription: "إدارة إعلاناتك، متجرك، ومتابعة الأداء والإحصائيات المباشرة.",
        myAds: "إعلاناتي",
        myStore: "متجري",
        image: "صورة",
        title: "العنوان",
        user: "المستخدم",
        status: "الحالة",
        price: "السعر",
        views: "المشاهدات",
        clicks: "النقرات",
        actions: "الإجراءات",
        promoted: "مميز",
        active: "نشط",
        pending: "قيد المراجعة",
        rejected: "مرفوض",
        toggleMenu: "تبديل القائمة",
        edit: "تعديل",
        delete: "حذف",
        resetCounters: "إعادة تعيين العدادات",
        loadingAds: "جاري تحميل الإعلانات...",
        noAds: "لم تقم بإضافة أي إعلانات بعد.",
        noProducts: "لم تقم بإضافة أي منتجات لمتجرك بعد.",
        addNewProduct: "إضافة منتج جديد",
        addNewAd: "إضافة إعلان جديد",
        adminView: "أنت مسؤول. يمكنك رؤية جميع الإعلانات في هذا السوق.",
        deleteAdTitle: 'هل أنت متأكد من حذف هذا الإعلان؟',
        deleteAdDesc: 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف الإعلان وصورته نهائياً.',
        resetCountersTitle: 'هل أنت متأكد من إعادة تعيين العدادات؟',
        resetCountersDesc: 'سيتم تصفير عدادات المشاهدات والنقرات لهذا الإعلان.',
        deleteStoreTitle: 'هل أنت متأكد من حذف متجرك؟',
        deleteStoreDesc: 'سيتم حذف اسم متجرك ووصفه نهائياً. لن يتم حذف منتجاتك.',
        cancel: 'إلغاء',
        confirm: 'تأكيد',
        adDeleted: 'تم حذف الإعلان بنجاح.',
        countersReset: 'تم إعادة تعيين العدادات بنجاح.',
        storeDeleted: 'تم حذف المتجر بنجاح.',
        error: 'خطأ',
        errorOccurred: 'حدث خطأ أثناء تنفيذ الإجراء.',
        errorResetCounters: 'حدث خطأ أثناء إعادة تعيين العدادات.',
        errorDeleteStore: 'حدث خطأ أثناء حذف المتجر.',
        noStore: "ليس لديك متجر حتى الآن.",
        noStoreDesc: "أنشئ متجرك الخاص لعرض جميع منتجاتك في مكان واحد.",
        createNewStore: "إنشاء متجر جديد",
        editStore: "تعديل المتجر",
        viewStore: "عرض المتجر",
        adLog: "السجل",
        shareLink: "نسخ رابط الإعلان",
        linkCopied: "تم نسخ رابط الإعلان إلى الحافظة",
        totalAds: "إجمالي الإعلانات",
        activeAds: "إعلانات نشطة",
        totalViews: "المشاهدات",
        totalClicks: "النقرات",
        viewAd: "معاينة الإعلان"
    }
}

type DialogState = {
  isOpen: boolean;
  ad: Ad | null;
  action: 'delete' | 'reset';
}

const checkNeedsCategoryUpdate = (ad: Ad, dynamicCategories: Category[] = []): boolean => {
  if (!ad) return false;
  const catId = (ad.categoryId || ad.category || (ad as any).categoryName || '').toString().toLowerCase().trim();
  
  if (!catId || catId === 'undefined' || catId === 'null' || catId === 'unknown' || catId === 'none') {
    return true;
  }
  
  if (catId === 'store-product') return false;
  return false;
};

// Overview summary stats component
const DashboardStatsSummary = ({ ads }: { ads: Ad[] }) => {
  const t = translations.ar;
  const stats = useMemo(() => {
    const total = ads.length;
    const active = ads.filter(a => a.status === 'active').length;
    const views = ads.reduce((acc, a) => acc + (a.views || 0), 0);
    const clicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
    return { total, active, views, clicks };
  }, [ads]);

  if (ads.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-card border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3.5 transition-all hover:border-primary/40">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xs sm:text-xs text-muted-foreground font-medium">{t.totalAds}</p>
          <p className="text-lg sm:text-2xl font-black font-headline text-foreground">{stats.total}</p>
        </div>
      </div>

      <div className="bg-card border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3.5 transition-all hover:border-emerald-500/40">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xs sm:text-xs text-muted-foreground font-medium">{t.activeAds}</p>
          <p className="text-lg sm:text-2xl font-black font-headline text-emerald-600 dark:text-emerald-400">{stats.active}</p>
        </div>
      </div>

      <div className="bg-card border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3.5 transition-all hover:border-blue-500/40">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Eye className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xs sm:text-xs text-muted-foreground font-medium">{t.totalViews}</p>
          <p className="text-lg sm:text-2xl font-black font-headline text-foreground">{stats.views.toLocaleString('en-US')}</p>
        </div>
      </div>

      <div className="bg-card border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3.5 transition-all hover:border-violet-500/40">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
          <MousePointerClick className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xs sm:text-xs text-muted-foreground font-medium">{t.totalClicks}</p>
          <p className="text-lg sm:text-2xl font-black font-headline text-foreground">{stats.clicks.toLocaleString('en-US')}</p>
        </div>
      </div>
    </div>
  );
};

const AdTable = ({ ads, isLoading, isAdmin, noItemsMessage, isStoreProduct = false }: { ads: Ad[]; isLoading: boolean; isAdmin: boolean; noItemsMessage: string; isStoreProduct?: boolean }) => {
    const { language } = useLanguage();
    const { market } = useMarket();
    const t = translations.ar;
    const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false, ad: null, action: 'delete' });
    const { deleteAd, resetAdCounters, categories } = useAuth();
    const { toast } = useToast();

    const needsCategoryUpdateCount = ads.filter(a => checkNeedsCategoryUpdate(a, categories)).length;

    const openDialog = (ad: Ad, action: 'delete' | 'reset') => {
        setDialogState({ isOpen: true, ad, action });
    };
    
    const closeDialog = () => {
        setDialogState({ isOpen: false, ad: null, action: 'delete' });
    };

    const handleConfirmAction = async () => {
        if (!dialogState.ad) return;

        if (dialogState.action === 'delete') {
            try {
                await deleteAd(dialogState.ad.userId, dialogState.ad.id, dialogState.ad);
                toast({ title: t.adDeleted });
            } catch (e) {
                console.error(e);
                toast({ title: t.error, description: t.errorOccurred, variant: 'destructive' });
            }
        } else if (dialogState.action === 'reset') {
            try {
                await resetAdCounters(dialogState.ad.userId, dialogState.ad.id, dialogState.ad);
                toast({ title: t.countersReset });
            } catch (e) {
                console.error(e);
                toast({ title: t.error, description: t.errorResetCounters, variant: 'destructive' });
            }
        }
        
        closeDialog();
    };

    const handleCopyAdLink = (ad: Ad) => {
        const url = `${window.location.origin}/ad/${ad.userId || 'owner'}/${ad.id}`;
        navigator.clipboard.writeText(url).then(() => {
            toast({ title: t.linkCopied });
        }).catch(() => {
            toast({ title: t.error, variant: 'destructive' });
        });
    };

    const currencyFormatter = new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: market.currency,
        maximumFractionDigits: 0,
        numberingSystem: 'latn'
    });

    const getStatusBadge = (status: Ad['status']) => {
      switch (status) {
          case 'active':
              return (
                <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold gap-1 py-0.5 px-2 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t.active}
                </Badge>
              );
          case 'pending':
              return (
                <Badge variant="secondary" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold gap-1 py-0.5 px-2 text-[11px]">
                  <Clock className="w-3 h-3 text-amber-500" />
                  {t.pending}
                </Badge>
              );
          case 'rejected':
              return (
                <Badge variant="destructive" className="font-bold gap-1 py-0.5 px-2 text-[11px]">
                  <XCircle className="w-3 h-3" />
                  {t.rejected}
                </Badge>
              );
          default:
              return <Badge variant="outline">{status}</Badge>;
      }
    };

    const dialogContent = {
        delete: {
            title: t.deleteAdTitle,
            description: t.deleteAdDesc,
            confirmVariant: 'destructive' as const,
        },
        reset: {
            title: t.resetCountersTitle,
            description: t.resetCountersDesc,
            confirmVariant: 'default' as const,
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
               {[...Array(3)].map((_, i) => (
                   <div key={i} className="p-4 rounded-2xl border border-border/60 bg-card/60 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-pulse">
                       <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl shrink-0" />
                       <div className="space-y-2.5 flex-1 w-full">
                           <Skeleton className="h-5 w-3/4" />
                           <Skeleton className="h-4 w-1/3" />
                           <div className="flex gap-2">
                             <Skeleton className="h-6 w-16 rounded-full" />
                             <Skeleton className="h-6 w-20 rounded-full" />
                           </div>
                       </div>
                       <div className="flex gap-2 w-full sm:w-auto">
                         <Skeleton className="h-9 w-24 rounded-xl" />
                         <Skeleton className="h-9 w-20 rounded-xl" />
                       </div>
                   </div>
               ))}
           </div>
       );
    }
    
    if (ads.length === 0) {
        return (
          <div className="text-center py-16 px-4 bg-muted/20 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <LayoutDashboard className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-lg font-bold font-headline text-foreground">{noItemsMessage}</h4>
                <p className="text-xs text-muted-foreground">ابدأ بنشر إعلانك الآن للوصول إلى آلاف المشترين في منطقتك بكل سهولة.</p>
              </div>
              <Button asChild size="lg" className="rounded-xl font-bold gap-2 mt-2">
                <Link href={isStoreProduct ? '/submit?type=store-product' : '/submit'}>
                  <PlusCircle className="h-4 w-4" />
                  <span>{isStoreProduct ? t.addNewProduct : t.addNewAd}</span>
                </Link>
              </Button>
          </div>
        );
    }

    return (
      <>
        {needsCategoryUpdateCount > 0 && (
          <div className="mb-4 p-3.5 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-between text-xs font-bold font-headline shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>يوجد {needsCategoryUpdateCount} إعلان بحاجة إلى تحديث الفئة حتى تظهر في أقسامها الصحيحة للمستخدمين. اضغط "تعديل" لتحديث الإعلان.</span>
            </div>
            <span className="text-2xs bg-amber-200 dark:bg-amber-800 px-2.5 py-1 rounded-full shrink-0">تنبيه</span>
          </div>
        )}

        {/* 📱 MOBILE VIEW: App-Style Ad Cards (Similar to Dubizzle / Haraj) */}
        <div className="md:hidden space-y-3.5" dir="rtl">
          {ads.map((ad) => {
            const editLink = `/submit?id=${ad.id}&userId=${ad.userId}${isStoreProduct ? '&type=store-product' : ''}`;
            const viewLink = `/ad/${ad.userId || 'owner'}/${ad.id}`;
            const needsCatUpdate = checkNeedsCategoryUpdate(ad, categories);
            const thumbUrl = (ad.imageUrls && ad.imageUrls.length > 0) ? ad.imageUrls[0] : (ad as any).imageUrl;

            return (
              <div 
                key={ad.id}
                className={cn(
                  "bg-card border border-border/80 rounded-2xl p-3.5 shadow-sm transition-all relative overflow-hidden flex flex-col gap-3",
                  needsCatUpdate && "border-amber-400 bg-amber-500/[0.03]"
                )}
              >
                {/* Top Section: Image + Title + Status + Price */}
                <div className="flex gap-3 items-start">
                  <Link href={viewLink} className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/60">
                    {thumbUrl ? (
                      <Image
                        alt={ad.title}
                        className="object-cover w-full h-full"
                        fill
                        sizes="80px"
                        src={thumbUrl}
                      />
                    ) : (
                      <AdPlaceholder category={ad.category} iconClassName="h-6 w-6" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getStatusBadge(ad.status)}
                          {ad.isPromoted && <Badge className="text-[10px] py-0 px-1.5 font-bold">{t.promoted}</Badge>}
                        </div>
                      </div>

                      <Link href={viewLink} className="block">
                        <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug hover:text-primary transition-colors">
                          {ad.title}
                        </h4>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
                      <div className="text-sm font-black text-primary font-headline">
                        {ad.price ? currencyFormatter.format(ad.price) : 'حسب الاتفاق'}
                      </div>
                      
                      {/* Metric pills: Compact Views and Clicks without extra text */}
                      <div className="flex items-center gap-1.5 text-2xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1 bg-muted/70 px-2 py-0.5 rounded-md font-semibold" title={t.views}>
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>{ad.views || 0}</span>
                        </span>
                        <span className="flex items-center gap-1 bg-muted/70 px-2 py-0.5 rounded-md font-semibold" title={t.clicks}>
                          <MousePointerClick className="w-3.5 h-3.5 text-violet-500" />
                          <span>{ad.clicks || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {needsCatUpdate && (
                  <div className="bg-amber-500/10 border border-amber-400/40 rounded-xl p-2 flex items-center justify-between text-2xs font-bold text-amber-700 dark:text-amber-300">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      يحتاج لتحديد وتحديث القسم
                    </span>
                    <Link href={editLink} className="underline text-amber-600 dark:text-amber-400">تحديث الآن</Link>
                  </div>
                )}

                {/* Bottom Action Bar (Touch-Optimized for Mobile) */}
                <div className="flex items-center gap-2 pt-2.5 border-t border-border/60">
                  {/* زر التعديل */}
                  <Button 
                    asChild 
                    variant="outline" 
                    className={cn(
                      "flex-1 h-10 px-3 rounded-xl text-xs font-bold gap-1.5 border-border/80 hover:bg-muted/80 shadow-xs",
                      needsCatUpdate && "border-amber-500 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10"
                    )}
                  >
                    <Link href={editLink}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                      <span>{needsCatUpdate ? 'تحديث الفئة' : t.edit}</span>
                    </Link>
                  </Button>

                  {/* زر السجل المباشر */}
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1 h-10 px-3 rounded-xl text-xs font-bold gap-1.5 text-primary border-primary/30 hover:bg-primary/10 hover:text-primary shadow-xs"
                  >
                    <Link href={`/ad/${ad.userId || 'owner'}/${ad.id}/log`}>
                      <Activity className="h-4 w-4" />
                      <span>{t.adLog}</span>
                    </Link>
                  </Button>

                  {/* زر الحذف المباشر بالأيقونة */}
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => openDialog(ad, 'delete')}
                    className="h-10 w-10 p-0 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 shadow-xs"
                    title={t.delete}
                    aria-label={t.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 💻 DESKTOP VIEW: Clean Structured Table */}
        <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm" dir="rtl">
            <Table dir="rtl">
            <TableHeader className="bg-muted/40">
                <TableRow>
                <TableHead className="w-[72px]">{t.image}</TableHead>
                <TableHead className="min-w-[200px]">{t.title}</TableHead>
                {isAdmin && <TableHead className="hidden lg:table-cell">{t.user}</TableHead>}
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.price}</TableHead>
                <TableHead className="text-center">{t.views} / {t.clicks}</TableHead>
                <TableHead className="text-center min-w-[170px]">{t.actions}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {ads.map((ad) => {
                    const editLink = `/submit?id=${ad.id}&userId=${ad.userId}${isStoreProduct ? '&type=store-product' : ''}`;
                    const viewLink = `/ad/${ad.userId || 'owner'}/${ad.id}`;
                    const needsCatUpdate = checkNeedsCategoryUpdate(ad, categories);
                    const thumbUrl = (ad.imageUrls && ad.imageUrls.length > 0) ? ad.imageUrls[0] : (ad as any).imageUrl;

                    return (
                        <TableRow key={ad.id} className={cn("hover:bg-muted/30 transition-colors", needsCatUpdate && 'bg-amber-500/5')}>
                            <TableCell>
                             <Link href={viewLink} className="relative block w-14 h-14 rounded-xl overflow-hidden bg-muted border border-border/60">
                               {thumbUrl ? (
                                 <Image
                                     alt={ad.title}
                                     className="object-cover transition-all hover:scale-105"
                                     fill
                                     sizes="56px"
                                     src={thumbUrl}
                                 />
                               ) : (
                                 <AdPlaceholder category={ad.category} iconClassName="h-5 w-5" />
                               )}
                             </Link>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>
                                <Link href={viewLink} className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
                                  {ad.title}
                                </Link>
                                {needsCatUpdate && (
                                  <div className="mt-1">
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-400 text-[10px] font-bold gap-1 py-0.5 px-2">
                                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                                      يحتاج تحديث الفئة
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            {isAdmin && (
                                <TableCell className="hidden lg:table-cell">
                                    <div className="flex items-center gap-2">
                                        {ad.user?.avatarUrl ? (
                                            <Image src={ad.user.avatarUrl} alt={ad.user.name || 'User'} width={24} height={24} className="rounded-full"/>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-2xs font-bold">
                                                {ad.user?.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <span className="text-xs">{ad.user?.name || 'Unknown'}</span>
                                    </div>
                                </TableCell>
                            )}
                            <TableCell>
                              <div className="flex flex-col gap-1 items-start">
                                  {getStatusBadge(ad.status)}
                                  {ad.isPromoted && <Badge className="text-[10px] py-0 px-1.5">{t.promoted}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="font-black font-headline text-foreground">
                                {ad.price ? currencyFormatter.format(ad.price) : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-semibold">
                                <span className="flex items-center gap-1" title={t.views}>
                                  <Eye className="h-3.5 w-3.5 text-blue-500" />
                                  <span>{ad.views || 0}</span>
                                </span>
                                <span>/</span>
                                <span className="flex items-center gap-1" title={t.clicks}>
                                  <MousePointerClick className="h-3.5 w-3.5 text-violet-500" />
                                  <span>{ad.clicks || 0}</span>
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                            <div className="flex items-center justify-center gap-1.5">
                                {/* زر السجل المباشر */}
                                <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10 hover:text-primary rounded-lg">
                                    <Link href={`/ad/${ad.userId || 'owner'}/${ad.id}/log`}>
                                        <Activity className="h-3.5 w-3.5" />
                                        <span>{t.adLog}</span>
                                    </Link>
                                </Button>

                                {/* أيقونة وزر التعديل المباشر */}
                                <Button asChild size="sm" variant="outline" className={cn("h-8 px-2.5 text-xs gap-1 rounded-lg font-semibold", needsCatUpdate && "border-amber-500 text-amber-600 bg-amber-500/5")}>
                                    <Link href={editLink} title={t.edit}>
                                        <Pencil className="h-3.5 w-3.5" />
                                        <span>{needsCatUpdate ? 'تحديث الفئة' : t.edit}</span>
                                    </Link>
                                </Button>

                                {/* زر الحذف المباشر بالأيقونة */}
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => openDialog(ad, 'delete')} 
                                  className="h-8 w-8 p-0 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                                  title={t.delete}
                                  aria-label={t.delete}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
            </Table>
        </div>

        <AlertDialog open={dialogState.isOpen} onOpenChange={closeDialog}>
            <AlertDialogContent className="rounded-2xl max-w-md">
            <AlertDialogHeader>
                <AlertDialogTitle className="font-headline text-lg">{dialogContent[dialogState.action].title}</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">{dialogContent[dialogState.action].description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel onClick={closeDialog} className="rounded-xl">{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmAction} className={cn("rounded-xl font-bold", dialogState.action === 'delete' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}>
                {t.confirm}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
    );
}

const StoreTab = ({ user, userProfile, targetUserId, effectiveProfile }: { user: any, userProfile: UserProfile | null, targetUserId: string, effectiveProfile: UserProfile | null }) => {
    const { deleteStore, refreshUserProfile, getAds } = useAuth();
    const { language } = useLanguage();
    const t = translations.ar;
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [storeProducts, setStoreProducts] = useState<Ad[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (targetUserId && effectiveProfile?.store) {
            setIsLoading(true);
            const unsubscribe = getAds({
                userId: targetUserId,
                categories: ['store-product']
            }, (products) => {
                setStoreProducts(products);
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
    }, [targetUserId, effectiveProfile?.store, getAds]);

    if (!targetUserId || !effectiveProfile) return null;

    const hasStore = !!effectiveProfile.store;
    const isOwner = user?.uid === targetUserId;
    const isAdmin = userProfile?.role === 'admin';
    const canManage = isOwner || isAdmin;

    const handleDeleteStore = async () => {
        if (!canManage) return;
        setIsDeleting(true);
        try {
            await deleteStore(targetUserId);
            toast({ title: t.storeDeleted });
            await refreshUserProfile();
        } catch (error) {
            toast({ title: t.error, description: t.errorDeleteStore, variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    if (!hasStore) {
        return (
            <div className="text-center py-16 flex flex-col items-center gap-4 bg-muted/20 border border-dashed border-border rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Building className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="text-xl font-bold font-headline">{t.noStore}</h3>
                  <p className="text-xs text-muted-foreground">{t.noStoreDesc}</p>
                </div>
                <Button asChild size="lg" className="rounded-xl font-bold gap-2 mt-2">
                    <Link href="/store/create">
                        <PlusCircle className="h-5 w-5" />
                        {t.createNewStore}
                    </Link>
                </Button>
            </div>
        );
    }
    
    return (
        <>
            <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
                 <div className="w-full sm:w-2/3 lg:w-1/2">
                   <StoreCard store={effectiveProfile} />
                </div>
                {canManage && (
                    <div className="flex flex-wrap gap-2.5 w-full sm:w-auto self-start">
                        <Button asChild variant="outline" className="rounded-xl text-xs font-semibold">
                            <Link href={`/store/${targetUserId}`}>
                                <Store className="mr-1.5 h-4 w-4 text-primary" />
                                {t.viewStore}
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl text-xs font-semibold">
                            <Link href="/store/create">
                                <Edit className="mr-1.5 h-4 w-4" />
                                {t.editStore}
                            </Link>
                        </Button>
                        <Button variant="destructive" className="rounded-xl text-xs font-semibold" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
                        {t.delete}
                        </Button>
                    </div>
                )}
                {!canManage && (
                     <div className="flex flex-wrap gap-2.5 w-full sm:w-auto self-start">
                        <Button asChild variant="outline" className="rounded-xl text-xs font-semibold">
                            <Link href={`/store/${targetUserId}`}>
                                <Store className="mr-1.5 h-4 w-4 text-primary" />
                                {t.viewStore}
                            </Link>
                        </Button>
                     </div>
                )}
            </div>

            <div className="mb-4 flex justify-between items-center">
                 <h3 className="text-lg font-bold font-headline">{t.myAds}</h3>
                {canManage && (
                    <Button asChild size="sm" className="rounded-xl font-bold gap-1.5">
                        <Link href="/submit?type=store-product">
                            <PlusCircle className="h-4 w-4" />
                            {t.addNewProduct}
                        </Link>
                    </Button>
                )}
            </div>

            <AdTable ads={storeProducts} isLoading={isLoading} isAdmin={isAdmin} noItemsMessage={t.noProducts} isStoreProduct={true} />

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="rounded-2xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-headline text-lg">{t.deleteStoreTitle}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">{t.deleteStoreDesc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl">{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStore} className="rounded-xl font-bold bg-destructive hover:bg-destructive/90">
                           {isDeleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : t.confirm}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default function UserDashboard() {
  const { language } = useLanguage();
  const { user, userProfile, getAds, getUserById } = useAuth();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const t = translations.ar;

  const urlUserId = searchParams.get('userId');
  const targetUserId = urlUserId || user?.uid;

  const [regularAds, setRegularAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [externalProfile, setExternalProfile] = useState<UserProfile | null>(null);

  const isAdmin = userProfile?.role === 'admin';
  const isSelf = user?.uid && targetUserId === user.uid;
  const hasStore = !!userProfile?.store || !!externalProfile?.store;
  
  useEffect(() => {
    if (urlUserId && !user) {
        getUserById(urlUserId).then(setExternalProfile);
    }
  }, [urlUserId, user, getUserById]);

  useEffect(() => {
    let unsubscribe: () => void;
    if (targetUserId) {
        const filters = {
            userId: targetUserId,
        };
        
        setIsLoading(true);
        unsubscribe = getAds(filters, (fetchedAds) => {
            const nonStoreAds = fetchedAds.filter(ad => ad.category !== 'store-product');
            setRegularAds(nonStoreAds);
            setIsLoading(false);
        });
    }

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [targetUserId, getAds]);

  if (!targetUserId) {
    if (user === null && !urlUserId) return <div className="text-center py-20">{t.dashboardTitle} - يرجى تسجيل الدخول</div>;
    return null;
  }

  const effectiveProfile = userProfile || externalProfile;

  return (
    <div className="space-y-6">
      {/* Quick Dashboard Overview Stats */}
      {!isLoading && regularAds.length > 0 && (
        <DashboardStatsSummary ads={regularAds} />
      )}

      {/* Main user dashboard card */}
      <Card className="rounded-3xl border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-muted/20 border-b border-border/50 py-5">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-black font-headline flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                {t.dashboardTitle}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
                {t.dashboardDescription}
                {urlUserId && <Badge variant="outline" className="mr-2">عرض ملف: {effectiveProfile?.name}</Badge>}
            </CardDescription>
          </div>

          {isSelf && (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="default" className="flex items-center gap-2 text-xs font-bold rounded-xl shadow-sm">
                <Link href="/submit">
                  <PlusCircle className="h-4 w-4" />
                  <span>إضافة إعلان جديد</span>
                </Link>
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="ads" className="w-full">
                <TabsList className={cn("grid w-full rounded-2xl p-1 bg-muted/60", hasStore ? 'grid-cols-2' : 'grid-cols-1')}>
                    <TabsTrigger value="ads" className="gap-2 rounded-xl text-xs sm:text-sm font-bold data-[state=active]:shadow-sm"><LayoutDashboard className="h-4 w-4" />{t.myAds}</TabsTrigger>
                    {hasStore && <TabsTrigger value="store" className="gap-2 rounded-xl text-xs sm:text-sm font-bold data-[state=active]:shadow-sm"><Store className="h-4 w-4" />{t.myStore}</TabsTrigger>}
                </TabsList>
                <TabsContent value="ads" className="mt-6">
                    <AdTable ads={regularAds} isLoading={isLoading} isAdmin={isAdmin} noItemsMessage={t.noAds} />
                </TabsContent>
                {hasStore && (
                  <TabsContent value="store" className="mt-6">
                      <StoreTab user={user} userProfile={userProfile} targetUserId={targetUserId} effectiveProfile={effectiveProfile} />
                  </TabsContent>
                )}
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
