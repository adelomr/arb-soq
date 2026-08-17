'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import { useToast } from '@/hooks/use-toast';
import { createDirectBoostSession, PLAN_PRICES } from '@/app/actions/checkout';
import { Sparkles, Crown, Zap, Check, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromoteAdDialogProps {
  ad: {
    id: string;
    title: string;
    country?: string;
    userId: string;
    isFeatured?: boolean;
    featuredTier?: 'silver' | 'gold' | null;
    featuredUntil?: string | null;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function PromoteAdDialog({ ad, trigger, open, onOpenChange }: PromoteAdDialogProps) {
  const { user, userProfile } = useAuth();
  const { market } = useMarket();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<'silver' | 'gold'>('gold');
  const [loading, setLoading] = useState(false);

  const countryKey = (ad.country || userProfile?.country || market.id || 'eg').toLowerCase();
  
  const silverPricing = PLAN_PRICES.silver[countryKey] || PLAN_PRICES.silver['default'];
  const goldPricing = PLAN_PRICES.gold[countryKey] || PLAN_PRICES.gold['default'];

  const handleDirectCheckout = async () => {
    if (!user || !userProfile) {
      toast({
        title: 'تسجيل الدخول مطلوب',
        description: 'يرجى تسجيل الدخول بحسابك لتتمكن من ترقية الإعلان.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createDirectBoostSession({
        adId: ad.id,
        userId: user.uid,
        planId: selectedPlan,
        country: countryKey,
        userEmail: user.email || 'user@arb-soq.com',
        userName: userProfile.name || 'عميل سوق العرب',
        userPhone: userProfile.phoneNumber || undefined,
      });

      if (result.success && result.url) {
        toast({
          title: 'جاري التوجيه لبوابة الدفع...',
          description: 'سيتم نقلك لإتمام عملية الدفع بأمان وتفعيل الإعلان فوراً.',
        });
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'حدث خطأ أثناء إنشاء جلسة الدفع.');
      }
    } catch (error: any) {
      toast({
        title: 'فشل بدء الدفع',
        description: error.message || 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-xl text-right p-6 sm:p-8" dir="rtl">
        <DialogHeader className="text-right">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-bold font-headline text-center">
            ترقية وتمييز الإعلان 🚀
          </DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base text-muted-foreground mt-1">
            اختر إحدى باقات التمييز لإعلانك: <strong className="text-foreground">«{ad.title}»</strong> للحصول على مشاهدات ومبيعات تصل إلى 10 أضعاف!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          {/* Silver Plan Card */}
          <div
            onClick={() => setSelectedPlan('silver')}
            className={cn(
              'cursor-pointer rounded-2xl border-2 p-5 transition-all relative flex flex-col justify-between',
              selectedPlan === 'silver'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/40 bg-card'
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-300">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-base">الباقة الفضية</h4>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary font-medium">
                  {silverPricing.durationDays} أيام
                </span>
              </div>

              <div className="my-3">
                <span className="text-2xl font-black text-foreground">
                  {silverPricing.displayPrice}
                </span>
                <span className="text-xs text-muted-foreground mr-1.5">
                  {silverPricing.currency}
                </span>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  <span>تثبيت وتمييز لمدة 7 أيام</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  <span>شارة فضية لافتة للأنظار</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  <span>أولوية في نتائج القسم</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Gold Plan Card */}
          <div
            onClick={() => setSelectedPlan('gold')}
            className={cn(
              'cursor-pointer rounded-2xl border-2 p-5 transition-all relative flex flex-col justify-between',
              selectedPlan === 'gold'
                ? 'border-amber-500 bg-amber-500/10 shadow-lg ring-1 ring-amber-500/50'
                : 'border-border hover:border-amber-500/40 bg-card'
            )}
          >
            <div className="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full shadow">
              الأكثر طلباً ⭐
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                    <Crown className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-base text-amber-600 dark:text-amber-400">
                    الباقة الذهبية VIP
                  </h4>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                  {goldPricing.durationDays} يوماً
                </span>
              </div>

              <div className="my-3">
                <span className="text-2xl font-black text-foreground">
                  {goldPricing.displayPrice}
                </span>
                <span className="text-xs text-muted-foreground mr-1.5">
                  {goldPricing.currency}
                </span>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-medium text-foreground">تثبيت في قمة الموقع والبحث</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    تحسين الإعلان بالذكاء الاصطناعي ✨
                  </span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>شارة VIP ذهبية برّاقة</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>تثبيت لمدة 30 يوماً كاملة</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleDirectCheckout}
            disabled={loading}
            size="lg"
            className="w-full py-6 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>جارٍ التجهيز والتحويل لبوابة الدفع...</span>
              </>
            ) : (
              <>
                <span>الدفع وتفعيل التمييز فوراً ({selectedPlan === 'gold' ? `${goldPricing.displayPrice} ${goldPricing.currency}` : `${silverPricing.displayPrice} ${silverPricing.currency}`})</span>
                <ArrowRight className="h-5 w-5 rotate-180" />
              </>
            )}
          </Button>
          <div className="flex items-center justify-center gap-2 flex-wrap text-2xs text-muted-foreground pt-1">
            <span className="font-semibold text-foreground/80">طرق الدفع المتاحة:</span>
            <span className="px-2 py-0.5 rounded bg-secondary/80 text-foreground font-medium">💳 فيزا / ماستركارد / ميزة</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">📱 فودافون كاش / المحافظ الذكية</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">🏢 منافذ فوري</span>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            دفع آمن 100% ومشفر عبر بوابة Paymob الإلكترونية المعتمدة وتفعيل تلقائي في نفس اللحظة.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
