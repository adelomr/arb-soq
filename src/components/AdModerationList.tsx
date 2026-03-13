
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import type { Ad } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Loader2, X, AlertCircle, ImageIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const translations = {
  ar: {
    title: 'مراجعة الإعلانات',
    description: 'إدارة جميع الإعلانات النشطة في النظام. يمكنك إيقاف أي إعلان إذا كان ينتهك السياسات.',
    ad: 'الإعلان',
    user: 'المستخدم',
    price: 'السعر',
    submitted: 'أرسلت',
    actions: 'الإجراءات',
    approve: 'موافقة',
    reject: 'رفض',
    stop: 'إيقاف',
    approving: 'جارٍ الموافقة...',
    rejecting: 'جارٍ الرفض...',
    stopping: 'جارٍ الإيقاف...',
    noPendingAds: 'لا توجد إعلانات للمراجعة حاليًا.',
    adApproved: 'تمت الموافقة على الإعلان بنجاح.',
    adRejected: 'تم رفض الإعلان بنجاح.',
    adStopped: 'تم إيقاف الإعلان بنجاح.',
    errorOccurred: 'حدث خطأ. الرجاء المحاولة مرة أخرى.',
    loading: 'جارٍ تحميل الإعلانات...',
    status: 'الحالة',
    active: 'نشط',
    pending: 'قيد المراجعة',
  }
};

type AdWithId = Ad & { id: string };
type ActionType = 'approve' | 'reject' | 'stop';

export default function AdModerationList() {
  const { getAdsForModeration, updateAdStatus } = useAuth();
  const [ads, setAds] = useState<AdWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<ActionType | null>(null);

  const { language } = useLanguage();
  const { toast } = useToast();
  const t = translations.ar;
  const dateLocale = ar;

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
      await updateAdStatus(ad.user.id, ad.id, status, isStoreProduct);
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
      await updateAdStatus(ad.user.id, ad.id, 'rejected', isStoreProduct);
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

  const getStatusBadge = (status: Ad['status']) => {
      switch (status) {
          case 'active':
              return <Badge variant="secondary" className="border-green-500/50 bg-green-500/10 text-green-700">{t.active}</Badge>;
          case 'pending':
              return <Badge variant="secondary" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700">{t.pending}</Badge>;
          default:
              return <Badge variant="outline">{status}</Badge>;
      }
  }

  const isLoadingAction = (adId: string, action: ActionType) => {
      return updatingId === adId && currentAction === action;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">{t.loading}</span>
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-lg font-semibold">{t.noPendingAds}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.ad}</TableHead>
                <TableHead className="hidden md:table-cell">{t.user}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.status}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.submitted}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => {
                  const hasImage = ad.imageUrls && ad.imageUrls.length > 0;
                  return (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                            {hasImage ? (
                                <Image
                                    src={ad.imageUrls[0]}
                                    alt={ad.title}
                                    width={64}
                                    height={64}
                                    className="rounded-md object-cover aspect-square"
                                />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground/50"/>
                            )}
                            </div>
                          <span className="font-medium">{ad.title}</span>
                        </div>
                      </TableCell>
                       <TableCell className="hidden md:table-cell">
                         <div className="flex items-center gap-2">
                            <Image src={ad.user.avatarUrl!} alt={ad.user.name} width={24} height={24} className="rounded-full"/>
                            <span>{ad.user.name}</span>
                        </div>
                       </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getStatusBadge(ad.status)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {ad.postedAt ? formatDistanceToNow(new Date(ad.postedAt), { addSuffix: true, locale: dateLocale }) : ''}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                           {ad.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(ad, 'rejected')}
                                disabled={updatingId === ad.id}
                                className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                {isLoadingAction(ad.id, 'reject') ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                <span className="hidden lg:inline ml-2">{t.reject}</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(ad, 'active')}
                                disabled={updatingId === ad.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {isLoadingAction(ad.id, 'approve') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                <span className="hidden lg:inline ml-2">{t.approve}</span>
                              </Button>
                            </>
                          )}
                          {ad.status === 'active' && (
                             <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleStopAd(ad)}
                                disabled={updatingId === ad.id}
                             >
                                {isLoadingAction(ad.id, 'stop') ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                <span className="hidden lg:inline ml-2">{t.stop}</span>
                             </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
