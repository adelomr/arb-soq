
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
import { MoreHorizontal, Pencil, Trash2, Loader2, LayoutDashboard, Store, PlusCircle, Building, Edit, Eye, MousePointerClick, RotateCcw, AlertTriangle, Activity, BarChart3, CarFront, Download, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { useMarket } from '@/context/MarketContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import type { Ad, Category, SubCategory, UserProfile } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import AdPlaceholder from '@/components/AdPlaceholder';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import StoreCard from './StoreCard';
import { useSearchParams } from 'next/navigation';

const translations = {
    ar: {
        dashboardTitle: "إدارة الإعلانات",
        dashboardDescription: "إدارة إعلاناتك، متجرك، وعرض أدائها.",
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
        errorOccurred: 'حدث خطأ أثناء حذف الإعلان.',
        errorResetCounters: 'حدث خطأ أثناء إعادة تعيين العدادات.',
        errorDeleteStore: 'حدث خطأ أثناء حذف المتجر.',
        noStore: "ليس لديك متجر حتى الآن.",
        noStoreDesc: "أنشئ متجرك الخاص لعرض جميع منتجاتك في مكان واحد.",
        createNewStore: "إنشاء متجر جديد",
        editStore: "تعديل المتجر",
        viewStore: "عرض المتجر",
        adLog: "السجل",
    }
}


type DialogState = {
  isOpen: boolean;
  ad: Ad | null;
  action: 'delete' | 'reset';
}

const checkNeedsCategoryUpdate = (ad: Ad, dynamicCategories: Category[] = []): boolean => {
  if (!ad) return false;
  const catId = (ad.categoryId || ad.category || '').toString().toLowerCase().trim();
  if (!catId) return true;
  if (catId === 'store-product') return false;

  // Check if matches any dynamic category or its subcategories
  if (dynamicCategories && dynamicCategories.length > 0) {
    const matched = dynamicCategories.some(c => 
      c.id.toLowerCase() === catId || 
      (c.name?.ar && c.name.ar.toLowerCase() === catId) ||
      c.subcategories?.some((s: SubCategory) => s.id.toLowerCase() === catId || (s.name?.ar && s.name.ar.toLowerCase() === catId))
    );
    if (matched) return false;
  }
  
  const knownCategories = [
    'vehicles', 'cars', 'عربيات', 'سيارات', 'مركبات',
    'realestate', 'real-estate', 'عقارات',
    'mobiles', 'phones', 'tablets', 'موبايلات', 'هواتف',
    'jobs', 'وظائف',
    'furniture', 'أثاث',
    'electronics', 'appliances', 'إلكترونيات', 'أجهزة',
    'fashion', 'موضة',
    'pets', 'حيوانات',
    'baby', 'kids', 'أطفال',
    'hobbies', 'هوايات',
    'trade', 'commercial', 'تجارة',
    'services', 'خدمات',
    'crafts', 'labor', 'cat_1786316040524', 'مهن', 'حرف',
    'store-product'
  ];

  return !knownCategories.some(k => catId === k || (k.length > 3 && catId.includes(k)));
};

const AdTable = ({ ads, isLoading, isAdmin, noItemsMessage, isStoreProduct = false }: { ads: Ad[]; isLoading: boolean; isAdmin: boolean; noItemsMessage: string; isStoreProduct?: boolean }) => {
    const { language, direction } = useLanguage();
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

    const currencyFormatter = new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: market.currency,
        maximumFractionDigits: 0,
        numberingSystem: 'latn' // Force Latin numerals
    });

    const getStatusBadge = (status: Ad['status']) => {
      switch (status) {
          case 'active':
              return <Badge variant="secondary" className="border-green-500/50 bg-green-500/10 text-green-700">{t.active}</Badge>;
          case 'pending':
              return <Badge variant="secondary" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700">{t.pending}</Badge>;
          case 'rejected':
              return <Badge variant="destructive">{t.rejected}</Badge>;
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
                   <div key={i} className="flex items-center space-x-4">
                       <Skeleton className="h-16 w-16 rounded-md" />
                       <div className="space-y-2 flex-1">
                           <Skeleton className="h-4 w-3/4" />
                           <Skeleton className="h-4 w-1/2" />
                       </div>
                       <Skeleton className="h-8 w-20" />
                   </div>
               ))}
           </div>
       );
    }
    
    if (ads.length === 0) {
        return <div className="text-center py-12 text-muted-foreground">{noItemsMessage}</div>;
    }

    return (
        <>
        {needsCategoryUpdateCount > 0 && (
          <div className="mb-4 p-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-between text-xs font-bold font-headline">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>يوجد {needsCategoryUpdateCount} إعلان بحاجة إلى تحديث الفئة حتى تظهر في أقسامها الصحيحة للمستخدمين. اضغط "تعديل" وتحديث الإعلان.</span>
            </div>
            <span className="text-2xs bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded-full">تنبيه فئات الإعلانات</span>
          </div>
        )}
        <div className="w-full overflow-x-auto" dir="rtl">
            <Table dir="rtl">
            <TableHeader>
                <TableRow>
                <TableHead className="w-[64px] sm:w-[80px]">{t.image}</TableHead>
                <TableHead>{t.title}</TableHead>
                {isAdmin && <TableHead className="hidden lg:table-cell">{t.user}</TableHead>}
                <TableHead className="hidden sm:table-cell">{t.status}</TableHead>
                <TableHead>{t.price}</TableHead>
                <TableHead className="text-center min-w-[160px]">{t.actions}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {ads.map((ad) => {
                    const editLink = `/submit?id=${ad.id}&userId=${ad.userId}${isStoreProduct ? '&type=store-product' : ''}`;
                    const needsCatUpdate = checkNeedsCategoryUpdate(ad);
                    return (
                        <TableRow key={ad.id} className={needsCatUpdate ? 'bg-amber-500/5' : undefined}>
                            <TableCell>
                             {(ad.imageUrls && ad.imageUrls.length > 0) || (ad as any).imageUrl ? (
                               <Image
                                   alt={ad.title}
                                   className="aspect-square rounded-md object-cover transition-all hover:scale-105"
                                   height={64}
                                   src={(ad.imageUrls && ad.imageUrls.length > 0) ? ad.imageUrls[0] : (ad as any).imageUrl}
                                   width={64}
                                   data-ai-hint={(ad.imageHints && ad.imageHints.length > 0) ? ad.imageHints[0] : ''}
                               />
                             ) : (
                               <div className="w-16 h-16 rounded-md overflow-hidden">
                                 <AdPlaceholder category={ad.category} iconClassName="h-6 w-6" />
                               </div>
                             )}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>
                                <span>{ad.title}</span>
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
                                        <span>{ad.user?.name || 'Unknown'}</span>
                                    </div>
                                </TableCell>
                            )}
                            <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-col gap-1">
                                {getStatusBadge(ad.status)}
                                {ad.isPromoted && <Badge className="mt-1">{t.promoted}</Badge>}
                            </div>
                            </TableCell>
                            <TableCell>
                                {ad.price ? currencyFormatter.format(ad.price) : '-'}
                            </TableCell>
                            <TableCell>
                            <div className="flex items-center justify-center gap-1.5">
                                {/* زر السجل المباشر */}
                                <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10 hover:text-primary">
                                    <Link href={`/ad/${ad.userId || 'owner'}/${ad.id}/log`}>
                                        <Activity className="h-3.5 w-3.5" />
                                        <span>{t.adLog}</span>
                                    </Link>
                                </Button>

                                {/* أيقونة وزر التعديل المباشر */}
                                <Button asChild size="sm" variant="outline" className={cn("h-8 px-2.5 text-xs gap-1", needsCatUpdate && "border-amber-500 text-amber-600 bg-amber-500/5")}>
                                    <Link href={editLink} title={t.edit}>
                                        <Pencil className="h-3.5 w-3.5" />
                                        <span className="hidden md:inline">{needsCatUpdate ? 'تحديث الفئة' : t.edit}</span>
                                    </Link>
                                </Button>

                                {/* أيقونة الحذف المباشر */}
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => openDialog(ad, 'delete')}
                                    title={t.delete}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span className="sr-only">{t.delete}</span>
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
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{dialogContent[dialogState.action].title}</AlertDialogTitle>
                <AlertDialogDescription>{dialogContent[dialogState.action].description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={closeDialog}>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmAction} className={cn(dialogState.action === 'delete' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}>
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
            <div className="text-center py-12 flex flex-col items-center gap-4">
                <Building className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-xl font-semibold">{t.noStore}</h3>
                <p className="text-muted-foreground max-w-md">{t.noStoreDesc}</p>
                <Button asChild size="lg">
                    <Link href="/store/create">
                        <PlusCircle className="mr-2 h-5 w-5" />
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
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto self-start">
                        <Button asChild variant="outline" className="w-full sm:w-auto">
                            <Link href={`/store/${targetUserId}`}>
                                <Store className="mr-2 h-4 w-4" />
                                {t.viewStore}
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full sm:w-auto">
                            <Link href="/store/create">
                                <Edit className="mr-2 h-4 w-4" />
                                {t.editStore}
                            </Link>
                        </Button>
                        <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        {t.delete}
                        </Button>
                    </div>
                )}
                {!canManage && (
                     <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto self-start">
                        <Button asChild variant="outline" className="w-full sm:w-auto">
                            <Link href={`/store/${targetUserId}`}>
                                <Store className="mr-2 h-4 w-4" />
                                {t.viewStore}
                            </Link>
                        </Button>
                     </div>
                )}
            </div>

            <div className="mb-4 flex justify-between items-center">
                 <h3 className="text-xl font-semibold">{t.myAds}</h3>
                {canManage && (
                    <Button asChild>
                        <Link href="/submit?type=store-product">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t.addNewProduct}
                        </Link>
                    </Button>
                )}
            </div>

            <AdTable ads={storeProducts} isLoading={isLoading} isAdmin={isAdmin} noItemsMessage={t.noProducts} isStoreProduct={true} />

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.deleteStoreTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{t.deleteStoreDesc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStore} className="bg-destructive hover:bg-destructive/90">
                           {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t.confirm}
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
    <div className="space-y-8">
      {/* Main user dashboard card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl md:text-3xl font-headline flex items-center gap-3">
                <LayoutDashboard className="h-6 w-6 md:h-8 md:w-8" />
                {t.dashboardTitle}
            </CardTitle>
            <CardDescription>
                {t.dashboardDescription}
                {urlUserId && <Badge variant="outline" className="ml-2">عرض ملف: {effectiveProfile?.name}</Badge>}
            </CardDescription>
          </div>

          {isSelf && (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <Link href="/submit">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>إضافة إعلان جديد</span>
                </Link>
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="ads" className="w-full">
                <TabsList className={cn("grid w-full", hasStore ? "grid-cols-2" : "grid-cols-1")}>
                    <TabsTrigger value="ads" className="gap-2"><LayoutDashboard className="h-4 w-4" />{t.myAds}</TabsTrigger>
                    {hasStore && <TabsTrigger value="store" className="gap-2"><Store className="h-4 w-4" />{t.myStore}</TabsTrigger>}
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
