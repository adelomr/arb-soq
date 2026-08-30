'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Crown, 
  Zap, 
  Check, 
  Loader2, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Flame, 
  ShieldCheck, 
  Ban,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ad } from '@/lib/types';
import AdPlaceholder from '@/components/AdPlaceholder';

interface AdminFeatureAdDialogProps {
  ad: (Ad & { id: string }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const GOLD_DURATIONS = [
  { value: 7, label: '7 أيام' },
  { value: 15, label: '15 يوم' },
  { value: 30, label: '30 يوم (شهر)' },
  { value: 60, label: '60 يوم (شهرين)' },
  { value: 90, label: '90 يوم (3 أشهر)' },
  { value: 365, label: 'سنة كاملة (365 يوم)' },
];

const SILVER_DURATIONS = [
  { value: 3, label: '3 أيام' },
  { value: 7, label: '7 أيام (أسبوع)' },
  { value: 14, label: '14 يوم (أسبوعين)' },
  { value: 30, label: '30 يوم (شهر)' },
];

export default function AdminFeatureAdDialog({
  ad,
  open,
  onOpenChange,
  onSuccess,
}: AdminFeatureAdDialogProps) {
  const { updateAdFeatureTier } = useAuth();
  const { toast } = useToast();

  const [selectedTier, setSelectedTier] = useState<'gold' | 'silver' | 'none'>('gold');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [notifyUser, setNotifyUser] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize form state when ad opens
  useEffect(() => {
    if (ad) {
      const isCurrentlyFeatured = Boolean((ad.featuredTier === 'gold' || ad.featuredTier === 'silver') && (!ad.featuredUntil || new Date(ad.featuredUntil) > new Date()));
      const tier = (ad.featuredTier as 'gold' | 'silver') || 'gold';
      
      if (isCurrentlyFeatured) {
        setSelectedTier(tier);
        setDurationDays(tier === 'gold' ? 30 : 7);
      } else {
        setSelectedTier('gold');
        setDurationDays(30);
      }
    }
  }, [ad, open]);

  if (!ad) return null;

  const isBoostActive = Boolean((ad.featuredTier === 'gold' || ad.featuredTier === 'silver') && (!ad.featuredUntil || new Date(ad.featuredUntil) > new Date()));
  const currentTier = isBoostActive ? ad.featuredTier : null;
  const hasImage = (ad.imageUrls && ad.imageUrls.length > 0) || (ad as any).imageUrl;
  const imageSrc = (ad.imageUrls && ad.imageUrls.length > 0) ? ad.imageUrls[0] : (ad as any).imageUrl;

  const remainingDays = ad.featuredUntil
    ? Math.max(0, Math.ceil((new Date(ad.featuredUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const handleApply = async () => {
    setLoading(true);
    try {
      if (selectedTier === 'none') {
        await updateAdFeatureTier(ad, null, 0, notifyUser);
        toast({
          title: 'تم إرجاع الإعلان كإعلان عادي',
          description: `تم إيقاف تمييز الإعلان "${ad.title}" بنجاح.`,
        });
      } else {
        await updateAdFeatureTier(ad, selectedTier, durationDays, notifyUser);
        const tierTitle = selectedTier === 'gold' ? 'الباقة الذهبية 🥇' : 'الباقة الفضية 🥈';
        toast({
          title: 'تم تمييز الإعلان بنجاح! 🚀',
          description: `تم ترقية الإعلان "${ad.title}" بـ ${tierTitle} لمدة ${durationDays} يوم.`,
        });
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'حدث خطأ أثناء التحديث',
        description: error?.message || 'تعذر تطبيق التعديلات، يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto text-right p-6 sm:p-7" dir="rtl">
        <DialogHeader className="text-right pb-2 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-headline flex items-center gap-2">
                <span>إدارة تمييز وترقية الإعلان</span>
                <Badge variant="outline" className="text-2xs font-mono bg-primary/5 text-primary border-primary/20">
                  لوحة الإدارة
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                تطبيق الباقة الذهبية أو الفضية على الإعلان مباشرة وتحديد مدة الظهور في الصدارة.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* بطاقة معاينة الإعلان والحالة الحالية */}
        <div className="my-3 p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-background border border-border relative">
              {hasImage ? (
                <Image
                  src={imageSrc}
                  alt={ad.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <AdPlaceholder category={ad.category} iconClassName="h-6 w-6" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground line-clamp-1">{ad.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                المعلن: <span className="font-medium text-foreground">{ad.user?.name || ad.userId}</span>
              </p>
              {ad.price && (
                <span className="inline-block mt-1 text-xs font-bold text-primary">
                  {ad.price.toLocaleString('ar-EG')} {ad.currency || 'ج.م'}
                </span>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
            <span className="text-2xs text-muted-foreground block mb-1 font-medium">الحالة الحالية:</span>
            {isBoostActive ? (
              <Badge 
                className={cn(
                  "font-bold text-xs px-2.5 py-1 gap-1.5 shadow-sm",
                  currentTier === 'gold' 
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/20" 
                    : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/40 hover:bg-blue-500/20"
                )}
              >
                {currentTier === 'gold' ? (
                  <>
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    <span>باقة ذهبية 🥇</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    <span>باقة فضية 🥈</span>
                  </>
                )}
                {remainingDays !== null && (
                  <span className="text-2xs opacity-80 mr-1 font-mono">({remainingDays} يوم متبقي)</span>
                )}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground bg-background">
                إعلان عادي غير مميز
              </Badge>
            )}
          </div>
        </div>

        {/* اختيار نوع الباقة */}
        <div className="space-y-4 pt-1">
          <Label className="text-sm font-bold flex items-center gap-1.5 text-foreground">
            <Zap className="h-4 w-4 text-primary" />
            <span>اختر باقة التمييز المطلوب تطبيقها:</span>
          </Label>

          <RadioGroup 
            value={selectedTier} 
            onValueChange={(val) => {
              const tier = val as 'gold' | 'silver' | 'none';
              setSelectedTier(tier);
              if (tier === 'gold') setDurationDays(30);
              else if (tier === 'silver') setDurationDays(7);
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {/* 1. الباقة الذهبية */}
            <label
              htmlFor="tier-gold"
              className={cn(
                "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.01]",
                selectedTier === 'gold'
                  ? "border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/30"
                  : "border-border/70 bg-card hover:bg-muted/40"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-foreground flex items-center gap-1">
                      الباقة الذهبية
                      <span className="text-xs">🥇</span>
                    </h5>
                    <span className="text-2xs text-amber-600 dark:text-amber-400 font-semibold">صدارة قصوى VIP</span>
                  </div>
                </div>
                <RadioGroupItem value="gold" id="tier-gold" className="mt-1" />
              </div>
              <ul className="mt-3 space-y-1.5 text-2xs text-muted-foreground pr-1">
                <li className="flex items-center gap-1 text-foreground font-medium">
                  <Check className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <span>قمة الصفحة الرئيسية والبحث</span>
                </li>
                <li className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <span>إطار ذهبي وتوهج بارز</span>
                </li>
                <li className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <span>تحسين تلقائي بالذكاء الاصطناعي</span>
                </li>
              </ul>
            </label>

            {/* 2. الباقة الفضية */}
            <label
              htmlFor="tier-silver"
              className={cn(
                "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.01]",
                selectedTier === 'silver'
                  ? "border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500/30"
                  : "border-border/70 bg-card hover:bg-muted/40"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-foreground flex items-center gap-1">
                      الباقة الفضية
                      <span className="text-xs">🥈</span>
                    </h5>
                    <span className="text-2xs text-blue-600 dark:text-blue-400 font-semibold">ظهور مميز</span>
                  </div>
                </div>
                <RadioGroupItem value="silver" id="tier-silver" className="mt-1" />
              </div>
              <ul className="mt-3 space-y-1.5 text-2xs text-muted-foreground pr-1">
                <li className="flex items-center gap-1 text-foreground font-medium">
                  <Check className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span>ظهور في صدارة الفئات</span>
                </li>
                <li className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span>شارة فضية مميزة وإطار أنيق</span>
                </li>
                <li className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span>زيادة ملحوظة في المشاهدات</span>
                </li>
              </ul>
            </label>

            {/* 3. إلغاء التمييز */}
            <label
              htmlFor="tier-none"
              className={cn(
                "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.01]",
                selectedTier === 'none'
                  ? "border-destructive bg-destructive/10 shadow-md ring-1 ring-destructive/30"
                  : "border-border/70 bg-card hover:bg-muted/40"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-destructive/20 text-destructive">
                    <Ban className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-foreground">إلغاء التمييز</h5>
                    <span className="text-2xs text-destructive font-semibold">إرجاع إعلان عادي</span>
                  </div>
                </div>
                <RadioGroupItem value="none" id="tier-none" className="mt-1" />
              </div>
              <p className="mt-3 text-2xs text-muted-foreground leading-relaxed">
                سحب ميزة التمييز فوراً وإرجاع الإعلان كإعلان قياسي بدون شارة أو أولوية صدارة.
              </p>
            </label>
          </RadioGroup>

          {/* مدة التمييز (في حال اختيار الذهبية أو الفضية) */}
          {selectedTier !== 'none' && (
            <div className="p-4 rounded-xl bg-card border border-border/70 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>تحديد مدة صلاحية التمييز:</span>
                </Label>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {durationDays} يوم
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {(selectedTier === 'gold' ? GOLD_DURATIONS : SILVER_DURATIONS).map((dur) => (
                  <button
                    key={dur.value}
                    type="button"
                    onClick={() => setDurationDays(dur.value)}
                    className={cn(
                      "py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center",
                      durationDays === dur.value
                        ? (selectedTier === 'gold'
                            ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                            : "bg-blue-600 text-white border-blue-700 shadow-sm")
                        : "bg-background hover:bg-muted text-muted-foreground border-border/80"
                    )}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* خيار إشعار المستخدم */}
          <div className="flex items-center space-x-2 space-x-reverse pt-2">
            <Checkbox
              id="notifyUser"
              checked={notifyUser}
              onCheckedChange={(checked) => setNotifyUser(!!checked)}
            />
            <label
              htmlFor="notifyUser"
              className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
            >
              إرسال إشعار تنبيه لصاحب الإعلان يفيده بترقية أو تحديث حالة إعلانه
            </label>
          </div>
        </div>

        <DialogFooter className="mt-6 pt-4 border-t border-border/50 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-xs"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={loading}
            className={cn(
              "text-xs font-bold gap-1.5 min-w-[130px]",
              selectedTier === 'gold' && "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20",
              selectedTier === 'silver' && "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-500/20",
              selectedTier === 'none' && "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جارٍ التطبيق...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>
                  {selectedTier === 'none' ? 'إلغاء التمييز الآن' : 'تطبيق التمييز وحفظ'}
                </span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
