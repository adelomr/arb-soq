
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import type { Ad } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Check, 
  Loader2, 
  X, 
  AlertCircle, 
  AlertTriangle,
  Play, 
  Pause,
  Trash2, 
  Pencil, 
  Activity,
  Search,
  Filter,
  Tag,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { safeParseDate, cn } from '@/lib/utils';
import AdPlaceholder from '@/components/AdPlaceholder';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AdForm from '@/components/AdForm';

const translations = {
  ar: {
    title: 'مراجعة الإعلانات',
    description: 'إدارة جميع الإعلانات في النظام ومراجعتها وفلترتها حسب الفئات أو الحالة.',
    image: 'الصورة',
    ad: 'الإعلان',
    titleCol: 'العنوان',
    user: 'المستخدم',
    price: 'السعر',
    submitted: 'أرسلت',
    actions: 'الإجراءات',
    approve: 'موافقة',
    reject: 'رفض',
    stop: 'إيقاف',
    activate: 'تفعيل',
    delete: 'حذف',
    adLog: 'السجل',
    approving: 'جارٍ الموافقة...',
    rejecting: 'جارٍ الرفض...',
    stopping: 'جارٍ الإيقاف...',
    activating: 'جارٍ التفعيل...',
    deleting: 'جارٍ الحذف...',
    noPendingAds: 'لا توجد إعلانات تطابق الفلاتر المحددة حاليًا.',
    adApproved: 'تمت الموافقة على الإعلان بنجاح.',
    adRejected: 'تم رفض الإعلان بنجاح.',
    adStopped: 'تم إيقاف الإعلان بنجاح.',
    adActivated: 'تم تفعيل الإعلان بنجاح.',
    adDeleted: 'تم حذف الإعلان بنجاح.',
    errorOccurred: 'حدث خطأ. الرجاء المحاولة مرة أخرى.',
    loading: 'جارٍ تحميل الإعلانات...',
    status: 'الحالة',
    active: 'نشط',
    pending: 'قيد المراجعة',
    stopped: 'موقوف',
    rejected: 'مرفوض',
    promoted: 'مميز',
    deleteConfirmTitle: 'هل أنت متأكد من حذف هذا الإعلان؟',
    deleteConfirmDesc: 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف الإعلان وصوره نهائياً من النظام.',
    confirmDelete: 'نعم، احذف الإعلان',
    cancel: 'إلغاء',
    edit: 'تعديل',
    editAdTitle: 'تعديل تفاصيل الإعلان',
  }
};

type AdWithId = Ad & { id: string };
type ActionType = 'approve' | 'reject' | 'stop' | 'activate' | 'delete';

// Helper to check if category is legacy or missing
const checkNeedsCategoryUpdate = (ad: Ad): boolean => {
  const catId = (ad.categoryId || ad.category || '').toLowerCase().trim();
  if (!catId) return true;
  const knownCategories = [
    'vehicles', 'cars', 'automotive', 'سيارات', 'عربيات',
    'realestate', 'real-estate', 'عقارات',
    'electronics', 'إلكترونيات', 'اجهزة',
    'mobiles', 'phones', 'موبايلات', 'هواتف',
    'furniture', 'أثاث', 'اثاث',
    'fashion', 'موضة', 'ازياء',
    'pets', 'حيوانات',
    'baby', 'اطفال',
    'hobbies', 'هوايات',
    'trade', 'commercial', 'تجارة', 'صناعة',
    'services', 'خدمات',
    'crafts', 'labor', 'cat_1786316040524', 'مهن', 'حرف',
    'store-product'
  ];
  return !knownCategories.some(k => catId === k || (k.length > 3 && catId.includes(k)));
};

export default function AdModerationList() {
  const { getAdsForModeration, updateAdStatus, deleteAd, categories } = useAuth();
  const { market } = useMarket();
  const [ads, setAds] = useState<AdWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<ActionType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdWithId | null>(null);
  const [editTarget, setEditTarget] = useState<AdWithId | null>(null);

  // Filter and Search States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { language, direction } = useLanguage();
  const { toast } = useToast();
  const t = translations.ar;
  const dateLocale = ar;

  const currencyFormatter = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: market?.currency || 'EGP',
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  });

  useEffect(() => {
    const unsubscribe = getAdsForModeration(setAds, setLoading);
    return () => unsubscribe();
  }, [getAdsForModeration]);

  const handleUpdateStatus = async (ad: AdWithId, status: 'active' | 'rejected') => {
    setUpdatingId(ad.id);
    const action: ActionType = status === 'active' ? 'approve' : 'reject';
    setCurrentAction(action);
    
    try {
      const isStoreProduct = ad.category === 'store-product';
      await updateAdStatus(ad.userId, ad.id, status, isStoreProduct);
      toast({
        title: action === 'approve' ? t.adApproved : t.adRejected,
      });
    } catch (error) {
      toast({
        title: t.errorOccurred,
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setUpdatingId(null);
      setCurrentAction(null);
    }
  };
  
  const handleStopAd = async (ad: AdWithId) => {
    setUpdatingId(ad.id);
    setCurrentAction('stop');
    
    try {
      const isStoreProduct = ad.category === 'store-product';
      await updateAdStatus(ad.userId, ad.id, 'rejected', isStoreProduct);
      toast({
        title: t.adStopped,
      });
    } catch (error) {
      toast({
        title: t.errorOccurred,
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setUpdatingId(null);
      setCurrentAction(null);
    }
  };

  const handleActivateAd = async (ad: AdWithId) => {
    setUpdatingId(ad.id);
    setCurrentAction('activate');
    
    try {
      const isStoreProduct = ad.category === 'store-product';
      await updateAdStatus(ad.userId, ad.id, 'active', isStoreProduct);
      toast({
        title: t.adActivated,
      });
    } catch (error) {
      toast({
        title: t.errorOccurred,
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setUpdatingId(null);
      setCurrentAction(null);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const ad = deleteTarget;
    setDeleteTarget(null);
    setUpdatingId(ad.id);
    setCurrentAction('delete');

    try {
      await deleteAd(ad.userId, ad.id, ad);
      toast({ title: t.adDeleted });
    } catch (error) {
      toast({ title: t.errorOccurred, variant: 'destructive' });
      console.error(error);
    } finally {
      setUpdatingId(null);
      setCurrentAction(null);
    }
  };

  const getStatusBadge = (status: Ad['status']) => {
      switch (status) {
          case 'active':
              return <Badge variant="secondary" className="border-green-500/50 bg-green-500/10 text-green-700 font-bold">{t.active}</Badge>;
          case 'pending':
              return <Badge variant="secondary" className="border-amber-500/50 bg-amber-500/10 text-amber-700 font-bold">{t.pending}</Badge>;
          case 'rejected':
              return <Badge variant="secondary" className="border-red-500/50 bg-red-500/10 text-red-700 font-bold">{t.stopped}</Badge>;
          default:
              return <Badge variant="outline">{status}</Badge>;
      }
  };

  const isLoadingAction = (adId: string, action: ActionType) => {
      return updatingId === adId && currentAction === action;
  };

  const needsCategoryUpdateCount = ads.filter(checkNeedsCategoryUpdate).length;

  // Filter Ads based on Category, Status, and Search Query
  const filteredAds = ads.filter((ad) => {
    // 1. Category Filter
    if (selectedCategory !== 'all') {
      const catKey = (ad.categoryId || ad.category || '').toLowerCase().trim();
      if (selectedCategory === 'needs_update') {
        if (!checkNeedsCategoryUpdate(ad)) return false;
      } else if (catKey !== selectedCategory.toLowerCase()) {
        return false;
      }
    }

    // 2. Status Filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'needs_update') {
        if (!checkNeedsCategoryUpdate(ad)) return false;
      } else if (ad.status !== selectedStatus) {
        return false;
      }
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (ad.title || '').toLowerCase().includes(q);
      const userMatch = (ad.user?.name || ad.userId || '').toLowerCase().includes(q);
      const locationMatch = (ad.location || '').toLowerCase().includes(q);
      const idMatch = (ad.id || '').toLowerCase().includes(q);
      if (!titleMatch && !userMatch && !locationMatch && !idMatch) {
        return false;
      }
    }

    return true;
  });

  // Calculate ad counts per category for the dropdown
  const categoryOptions = [
    { id: 'all', name: 'جميع الفئات', count: ads.length },
    ...(categories || []).map((cat) => ({
      id: cat.id,
      name: cat.name?.ar || cat.id,
      count: ads.filter((a) => (a.categoryId || a.category || '').toLowerCase().trim() === cat.id.toLowerCase()).length,
    })),
    { id: 'store-product', name: 'منتجات المتاجر', count: ads.filter((a) => a.category === 'store-product').length },
    { id: 'needs_update', name: '⚠️ بحاجة لتحديث الفئة', count: needsCategoryUpdateCount },
  ];

  const hasActiveFilters = selectedCategory !== 'all' || selectedStatus !== 'all' || searchQuery.trim() !== '';

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto text-xs px-3 py-1 font-bold bg-primary/5 text-primary border-primary/20">
              إجمالي الإعلانات: {ads.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {needsCategoryUpdateCount > 0 && (
            <div className="p-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-between text-xs font-bold font-headline">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>يوجد {needsCategoryUpdateCount} إعلان بحاجة إلى تحديث الفئة حتى تظهر في أقسامها الصحيحة للمستخدمين.</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedCategory('needs_update'); setSelectedStatus('all'); }}
                className="text-2xs bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 hover:bg-amber-300 border-none px-2.5 py-0.5 h-6 rounded-full"
              >
                عرضها فقط
              </Button>
            </div>
          )}

          {/* 🔍 شريط الفلترة والبحث المتقدم في أعلى الصفحة */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-3" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* 1. مربع البحث بالاسم أو المستخدم */}
              <div className="md:col-span-6 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالعنوان، اسم المستخدم، المدينة، أو معرف الإعلان..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 h-10 bg-background text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* 2. فلتر الفئات (Category Select Dropdown) */}
              <div className="md:col-span-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-10 bg-background text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                      <SelectValue placeholder="اختر الفئة..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent align="end" className="max-h-72">
                    <SelectGroup>
                      <SelectLabel className="text-xs font-bold text-muted-foreground">فلترة حسب الفئة</SelectLabel>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id} className="text-sm">
                          <div className="flex items-center justify-between gap-4 w-full">
                            <span>{opt.name}</span>
                            <Badge variant="secondary" className="text-2xs px-1.5 py-0 h-4">
                              {opt.count}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* 3. زر إعادة ضبط الفلاتر */}
              <div className="md:col-span-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  className="w-full h-10 gap-1.5 text-xs font-medium"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>إعادة تعيين</span>
                </Button>
              </div>
            </div>

            {/* أزرار فلترة الحالة السريعة */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40 text-xs">
              <span className="text-muted-foreground font-semibold ml-2 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span>الحالة:</span>
              </span>
              {[
                { id: 'all', label: 'الكل', count: ads.length },
                { id: 'active', label: 'نشط', count: ads.filter(a => a.status === 'active').length },
                { id: 'pending', label: 'قيد المراجعة', count: ads.filter(a => a.status === 'pending').length },
                { id: 'rejected', label: 'موقوف', count: ads.filter(a => a.status === 'rejected').length },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5",
                    selectedStatus === st.id
                      ? "bg-primary text-primary-foreground shadow-sm font-bold"
                      : "bg-background hover:bg-muted text-muted-foreground border border-border/60"
                  )}
                >
                  <span>{st.label}</span>
                  <span className={cn("text-2xs px-1.5 py-0.2 rounded-full", selectedStatus === st.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {st.count}
                  </span>
                </button>
              ))}

              {/* عدد النتائج الحالية */}
              <div className="mr-auto text-xs text-muted-foreground font-semibold">
                عرض <span className="text-foreground font-bold">{filteredAds.length}</span> من أصل <span className="text-foreground">{ads.length}</span> إعلان
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">{t.loading}</span>
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-lg font-semibold">{t.noPendingAds}</p>
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={resetFilters} className="mt-2 text-primary font-bold">
                  إعادة ضبط جميع الفلاتر وعرض الكل
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto" dir="rtl">
              <Table dir="rtl">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[64px] sm:w-[80px]">{t.image}</TableHead>
                    <TableHead>{t.titleCol}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t.user}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t.status}</TableHead>
                    <TableHead>{t.price}</TableHead>
                    <TableHead className="text-center min-w-[200px]">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAds.map((ad) => {
                      const hasImage = (ad.imageUrls && ad.imageUrls.length > 0) || (ad as any).imageUrl;
                      const imageSrc = (ad.imageUrls && ad.imageUrls.length > 0) ? ad.imageUrls[0] : (ad as any).imageUrl;
                      const needsCatUpdate = checkNeedsCategoryUpdate(ad);

                      return (
                        <TableRow key={ad.id} className={needsCatUpdate ? 'bg-amber-500/5' : undefined}>
                          {/* Image Cell */}
                          <TableCell>
                            {hasImage ? (
                              <Image
                                alt={ad.title}
                                className="aspect-square rounded-md object-cover transition-all hover:scale-105"
                                height={64}
                                src={imageSrc}
                                width={64}
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-md overflow-hidden">
                                <AdPlaceholder category={ad.category} iconClassName="h-6 w-6" />
                              </div>
                            )}
                          </TableCell>

                          {/* Title Cell */}
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

                          {/* User Cell */}
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              {ad.user?.avatarUrl ? (
                                <Image src={ad.user.avatarUrl} alt={ad.user.name || 'User'} width={24} height={24} className="rounded-full" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-2xs font-bold">
                                  {ad.user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <span>{ad.user?.name || ad.userId}</span>
                            </div>
                          </TableCell>

                          {/* Status Cell */}
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(ad.status)}
                              {ad.isPromoted && <Badge className="mt-1">{t.promoted}</Badge>}
                            </div>
                          </TableCell>

                          {/* Price Cell */}
                          <TableCell>
                            {ad.price ? currencyFormatter.format(ad.price) : '-'}
                          </TableCell>

                          {/* Actions Cell */}
                          <TableCell>
                            <div className="flex items-center justify-center gap-1.5">
                              {/* زر السجل المباشر */}
                              <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10 hover:text-primary">
                                <Link href={`/ad/${ad.userId || 'owner'}/${ad.id}/log`}>
                                  <Activity className="h-3.5 w-3.5" />
                                  <span>{t.adLog}</span>
                                </Link>
                              </Button>

                              {/* زر الإيقاف / التفعيل / الموافقة / الرفض */}
                              {ad.status === 'pending' ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus(ad, 'active')}
                                    disabled={updatingId === ad.id}
                                    className="h-8 px-2.5 text-xs font-semibold gap-1 bg-green-600 hover:bg-green-700 text-white"
                                    title={t.approve}
                                  >
                                    {isLoadingAction(ad.id, 'approve') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                    <span>{t.approve}</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(ad, 'rejected')}
                                    disabled={updatingId === ad.id}
                                    className="h-8 px-2 text-xs font-semibold gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                    title={t.reject}
                                  >
                                    {isLoadingAction(ad.id, 'reject') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                    <span className="sr-only">{t.reject}</span>
                                  </Button>
                                </>
                              ) : ad.status === 'rejected' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleActivateAd(ad)}
                                  disabled={updatingId === ad.id}
                                  className="h-8 px-2.5 text-xs font-semibold gap-1 text-green-600 border-green-600/30 hover:bg-green-500/10 hover:text-green-700"
                                  title="تفعيل الإعلان"
                                >
                                  {isLoadingAction(ad.id, 'activate') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                                  <span>{t.activate}</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStopAd(ad)}
                                  disabled={updatingId === ad.id}
                                  className="h-8 px-2.5 text-xs font-semibold gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-700"
                                  title="إيقاف الإعلان"
                                >
                                  {isLoadingAction(ad.id, 'stop') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pause className="h-3.5 w-3.5" />}
                                  <span>{t.stop}</span>
                                </Button>
                              )}

                              {/* أيقونة وزر التعديل المباشر */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditTarget(ad)}
                                disabled={updatingId === ad.id}
                                className={cn("h-8 px-2.5 text-xs gap-1", needsCatUpdate && "border-amber-500 text-amber-600 bg-amber-500/5")}
                                title={t.edit}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">{needsCatUpdate ? 'تحديث الفئة' : t.edit}</span>
                              </Button>

                              {/* أيقونة الحذف المباشر */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteTarget(ad)}
                                disabled={updatingId === ad.id}
                                className="h-8 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                title={t.delete}
                              >
                                {isLoadingAction(ad.id, 'delete') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                <span className="sr-only">{t.delete}</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteConfirmDesc}
              {deleteTarget && (
                <span className="block mt-2 font-semibold text-foreground">
                  &ldquo;{deleteTarget.title}&rdquo;
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              {t.confirmDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Ad Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Pencil className="h-5 w-5 text-primary" />
              {t.editAdTitle}: {editTarget?.title}
            </DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="pt-2">
              <AdForm
                adId={editTarget.id}
                userId={editTarget.userId}
                isEditMode={true}
                onSuccess={() => {
                  setEditTarget(null);
                  getAdsForModeration(setAds, setLoading);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
