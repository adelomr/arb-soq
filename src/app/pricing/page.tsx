'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Loader2, 
  Award, 
  Gem, 
  Star, 
  X, 
  Sparkles, 
  Crown, 
  ShieldCheck, 
  Zap, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Clock,
  Search,
  BadgeCheck
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMarket } from "@/context/MarketContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';
import { createPaymobPayment } from '@/app/actions';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

type PlanId = 'free' | 'premium' | 'gold';

// أسعار الباقات بالعملات المختلفة لجميع الدول العربية
const PRICING_DATA: Record<string, {
  currency: string;
  flag: string;
  name: string;
  free: { price: string; period: string; amountCents: string };
  premium: { price: string; period: string; amountCents: string };
  gold: { price: string; period: string; amountCents: string };
}> = {
  sa: {
    currency: 'ر.س',
    flag: '🇸🇦',
    name: 'السعودية',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '20', period: 'اشتراك 30 يوماً', amountCents: '2000' },
    gold: { price: '60', period: 'اشتراك 60 يوماً', amountCents: '6000' },
  },
  eg: {
    currency: 'ج.م',
    flag: '🇪🇬',
    name: 'مصر',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '250', period: 'اشتراك 30 يوماً', amountCents: '25000' },
    gold: { price: '750', period: 'اشتراك 60 يوماً', amountCents: '75000' },
  },
  ae: {
    currency: 'د.إ',
    flag: '🇦🇪',
    name: 'الإمارات',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '20', period: 'اشتراك 30 يوماً', amountCents: '2000' },
    gold: { price: '60', period: 'اشتراك 60 يوماً', amountCents: '6000' },
  },
  kw: {
    currency: 'د.ك',
    flag: '🇰🇼',
    name: 'الكويت',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '2', period: 'اشتراك 30 يوماً', amountCents: '200' },
    gold: { price: '5', period: 'اشتراك 60 يوماً', amountCents: '500' },
  },
  qa: {
    currency: 'ر.ق',
    flag: '🇶🇦',
    name: 'قطر',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '20', period: 'اشتراك 30 يوماً', amountCents: '2000' },
    gold: { price: '60', period: 'اشتراك 60 يوماً', amountCents: '6000' },
  },
  bh: {
    currency: 'د.ب',
    flag: '🇧🇭',
    name: 'البحرين',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '2', period: 'اشتراك 30 يوماً', amountCents: '200' },
    gold: { price: '6', period: 'اشتراك 60 يوماً', amountCents: '600' },
  },
  om: {
    currency: 'ر.ع',
    flag: '🇴🇲',
    name: 'عُمان',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '2', period: 'اشتراك 30 يوماً', amountCents: '200' },
    gold: { price: '6', period: 'اشتراك 60 يوماً', amountCents: '600' },
  },
  jo: {
    currency: 'د.أ',
    flag: '🇯🇴',
    name: 'الأردن',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '4', period: 'اشتراك 30 يوماً', amountCents: '400' },
    gold: { price: '12', period: 'اشتراك 60 يوماً', amountCents: '1200' },
  },
  iq: {
    currency: 'د.ع',
    flag: '🇮🇶',
    name: 'العراق',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '7,000', period: 'اشتراك 30 يوماً', amountCents: '700000' },
    gold: { price: '20,000', period: 'اشتراك 60 يوماً', amountCents: '2000000' },
  },
  ma: {
    currency: 'د.م',
    flag: '🇲🇦',
    name: 'المغرب',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '50', period: 'اشتراك 30 يوماً', amountCents: '5000' },
    gold: { price: '150', period: 'اشتراك 60 يوماً', amountCents: '15000' },
  },
  dz: {
    currency: 'د.ج',
    flag: '🇩🇿',
    name: 'الجزائر',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '700', period: 'اشتراك 30 يوماً', amountCents: '70000' },
    gold: { price: '2,000', period: 'اشتراك 60 يوماً', amountCents: '200000' },
  },
  tn: {
    currency: 'د.ت',
    flag: '🇹🇳',
    name: 'تونس',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '15', period: 'اشتراك 30 يوماً', amountCents: '1500' },
    gold: { price: '45', period: 'اشتراك 60 يوماً', amountCents: '4500' },
  },
  ly: {
    currency: 'د.ل',
    flag: '🇱🇾',
    name: 'ليبيا',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '25', period: 'اشتراك 30 يوماً', amountCents: '2500' },
    gold: { price: '75', period: 'اشتراك 60 يوماً', amountCents: '7500' },
  },
  ye: {
    currency: 'ر.ي',
    flag: '🇾🇪',
    name: 'اليمن',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '1,200', period: 'اشتراك 30 يوماً', amountCents: '120000' },
    gold: { price: '3,500', period: 'اشتراك 60 يوماً', amountCents: '350000' },
  },
  sd: {
    currency: 'ج.س',
    flag: '🇸🇩',
    name: 'السودان',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '3,000', period: 'اشتراك 30 يوماً', amountCents: '300000' },
    gold: { price: '9,000', period: 'اشتراك 60 يوماً', amountCents: '900000' },
  },
  lb: {
    currency: 'ل.ل',
    flag: '🇱🇧',
    name: 'لبنان',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '450,000', period: 'اشتراك 30 يوماً', amountCents: '45000000' },
    gold: { price: '1,350,000', period: 'اشتراك 60 يوماً', amountCents: '135000000' },
  },
  ps: {
    currency: '₪',
    flag: '🇵🇸',
    name: 'فلسطين',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '20', period: 'اشتراك 30 يوماً', amountCents: '2000' },
    gold: { price: '60', period: 'اشتراك 60 يوماً', amountCents: '6000' },
  },
  usd: {
    currency: '$',
    flag: '🌐',
    name: 'دول أخرى (USD)',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    premium: { price: '5', period: 'اشتراك 30 يوماً', amountCents: '500' },
    gold: { price: '15', period: 'اشتراك 60 يوماً', amountCents: '1500' },
  },
};

import { Suspense } from 'react';

function PricingContent() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { market, setMarket } = useMarket();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // تحديد الدولة والعملة الافتراضية مع التزامن التلقائي مع سوق المستخدم
  const [selectedCountry, setSelectedCountry] = useState<string>('sa');
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const countryKey = (market?.id || userProfile?.country || 'sa').toLowerCase();
    if (PRICING_DATA[countryKey]) {
      setSelectedCountry(countryKey);
    } else {
      setSelectedCountry('sa');
    }
  }, [market?.id, userProfile?.country]);

  const paymentStatus = searchParams?.get('payment');
  const activatedPlan = searchParams?.get('plan');

  useEffect(() => {
    if (paymentStatus === 'success') {
      if (refreshUserProfile) refreshUserProfile();
      toast({
        title: "🎉 تم تفعيل الباقة بنجاح!",
        description: activatedPlan 
          ? `تهانينا! تم تفعيل اشتراكك في ${activatedPlan === 'gold' ? 'الباقة الذهبية VIP' : 'الباقة الفضية المميزة'} بنجاح.` 
          : "تمت عملية الدفع وتفعيل الباقة بنجاح.",
      });
    } else if (paymentStatus === 'failed') {
      toast({
        title: "فشلت عملية الدفع",
        description: "لم تكتمل عملية الدفع أو تم إلغاؤها. يمكنك المحاولة مرة أخرى في أي وقت.",
        variant: 'destructive',
      });
    }
  }, [paymentStatus, activatedPlan, refreshUserProfile, toast]);

  const currentPricing = useMemo(() => {
    return PRICING_DATA[selectedCountry] || PRICING_DATA['eg'];
  }, [selectedCountry]);

  const handleSubscribe = async (planId: PlanId) => {
    if (planId === 'free') {
      router.push('/submit');
      return;
    }

    if (!user || !userProfile) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يرجى تسجيل الدخول أو إنشاء حساب لاختيار باقة مميزة.",
        variant: 'destructive',
      });
      router.push('/login?redirect=/pricing');
      return;
    }

    const planInfo = planId === 'gold' ? currentPricing.gold : currentPricing.premium;
    setLoadingPlan(planId);

    try {
      const nameParts = (userProfile.name || 'عميل سوق العرب').trim().split(' ');
      const paymentInput = {
        amount_cents: planInfo.amountCents,
        email: user.email || 'user@arb-soq.com',
        first_name: nameParts[0] || 'عميل',
        last_name: nameParts.slice(1).join(' ') || 'سوق العرب',
        phone_number: userProfile.phoneNumber || '+201000000000',
        userId: user.uid,
        planId: planId,
      };

      const result = await createPaymobPayment(paymentInput);

      if (result.success && result.url) {
        toast({
          title: "جارٍ التحويل لبوابة الدفع...",
          description: "سيتم نقلك لصفحة الدفع الآمنة من Paymob لتأكيد الاشتراك.",
        });
        window.location.href = result.url;
      } else {
        throw new Error(result.error || "تعذر بدء عملية الدفع.");
      }
    } catch (error: any) {
      toast({
        title: "فشل إنشاء طلب الدفع",
        description: error.message || "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.",
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      {isClient && <Header />}

      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-primary/10 via-background to-background pt-14 pb-10 text-center px-4 overflow-hidden">
          <div className="container mx-auto max-w-4xl relative z-10">
            <Badge variant="outline" className="mb-4 px-3 py-1 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm font-bold gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>باقات مخصصة لمضاعفة المبيعات والانتشار</span>
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-black font-headline tracking-tight text-foreground leading-tight">
              اختر الباقة المناسبة وضاعف وصول إعلاناتك
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              سواء كنت فرداً يعرض سلعاً مستعملة، أو متجراً أو تاجراً يبحث عن تصدر نتائج البحث والصفحة الرئيسية، لدينا الخطة المثالية لنمو مبيعاتك.
            </p>

            {/* Currency Selector Tabs */}
            <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-secondary/60 border shadow-inner flex-wrap justify-center gap-1">
              {Object.entries(PRICING_DATA).map(([code, data]) => (
                <button
                  key={code}
                  onClick={() => setSelectedCountry(code)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5",
                    selectedCountry === code
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{data.flag}</span>
                  <span>{data.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Cards Grid */}
        <section className="container mx-auto px-4 max-w-6xl mt-4 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* 1. Free Plan */}
            <Card className="flex flex-col border border-border rounded-3xl bg-card transition-all duration-300 hover:shadow-lg relative overflow-hidden">
              <CardHeader className="p-6 sm:p-8 pb-4 text-right">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300">
                    <Award className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="font-semibold">للمستخدم العادي</Badge>
                </div>
                <CardTitle className="text-2xl font-bold">الباقة المجانية</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  مثالية لنشر الأغراض الشخصية والمستعملة وتجربة المنصة.
                </CardDescription>

                <div className="pt-6 pb-2 border-b">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black">0</span>
                    <span className="text-lg font-bold text-muted-foreground">{currentPricing.currency}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{currentPricing.free.period}</span>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 pt-4 flex-1 flex flex-col justify-between space-y-6">
                <ul className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-center gap-2.5 font-medium text-foreground">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span><strong>5 إعلانات نشطة</strong> كحد أقصى</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>حتى <strong>4 صور</strong> لكل إعلان</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>الظهور في نتائج البحث وتصفح الأقسام</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>مراسلة وتواصل مباشر عبر الواتساب والاتصال</span>
                  </li>
                  <li className="flex items-center gap-2.5 opacity-50">
                    <X className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>بدون إضافة رابط فيديو يوتيوب أو موقع خارجي</span>
                  </li>
                  <li className="flex items-center gap-2.5 opacity-50">
                    <X className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>بدون تحسين الإعلان بالذكاء الاصطناعي</span>
                  </li>
                </ul>

                <Button
                  onClick={() => handleSubscribe('free')}
                  variant="outline"
                  size="lg"
                  className="w-full py-6 text-sm sm:text-base font-bold rounded-2xl"
                >
                  ابدأ النشر مجاناً 🚀
                </Button>
              </CardContent>
            </Card>

            {/* 2. Silver / Premium Plan */}
            <Card className="flex flex-col border-2 border-primary/40 rounded-3xl bg-card transition-all duration-300 hover:shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 bg-primary/15 py-1 text-center text-xs font-bold text-primary">
                ⭐ الباقة الأكثر شعبية للتجار والأفراد
              </div>
              <CardHeader className="p-6 sm:p-8 pt-8 pb-4 text-right">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Zap className="w-6 h-6" />
                  </div>
                  <Badge className="bg-primary text-primary-foreground font-bold">باقة التميز</Badge>
                </div>
                <CardTitle className="text-2xl font-bold">الباقة الفضية (المميزة)</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  لزيادة المشاهدات حتى 5 أضعاف ونشر إعلانات غير محدودة.
                </CardDescription>

                <div className="pt-6 pb-2 border-b">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-primary">{currentPricing.premium.price}</span>
                    <span className="text-lg font-bold text-muted-foreground">{currentPricing.currency}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{currentPricing.premium.period}</span>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 pt-4 flex-1 flex flex-col justify-between space-y-6">
                <ul className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-center gap-2.5 font-bold text-foreground">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span><strong>إعلانات غير محدودة</strong> طوال فترة الاشتراك</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-medium text-foreground">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>إضافة <strong>رابط فيديو يوتيوب + موقع إلكتروني خارجي</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>حتى <strong>8 صور</strong> بجودة عالية لكل إعلان</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-medium text-foreground">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>شارة <strong>«⭐ إعلان مميز»</strong> لافتة للأنظار</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-medium text-foreground">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>أولوية الترتيب في البحث وتصفح الفئات</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>دعم فني وأولوية المراجعة والتفعيل</span>
                  </li>
                </ul>

                <Button
                  onClick={() => handleSubscribe('premium')}
                  disabled={loadingPlan === 'premium'}
                  size="lg"
                  className="w-full py-6 text-sm sm:text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-md gap-2"
                >
                  {loadingPlan === 'premium' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارٍ التجهيز...</span>
                    </>
                  ) : (
                    <>
                      <span>اشترك الآن ({currentPricing.premium.price} {currentPricing.currency})</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 3. Gold VIP Plan */}
            <Card className="flex flex-col border-2 border-amber-500/80 rounded-3xl bg-gradient-to-b from-amber-500/5 via-card to-card shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-400 py-1.5 text-center text-xs font-black text-black tracking-wider uppercase">
                👑 الباقة الذهبية VIP — الأكثر مبيعاً
              </div>
              <CardHeader className="p-6 sm:p-8 pt-8 pb-4 text-right">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Crown className="w-6 h-6 fill-amber-500 text-amber-500" />
                  </div>
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold border-none shadow-sm">
                    VIP الاحترافية
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold">الباقة الذهبية VIP</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  لأصحاب المتاجر والشركات — صدارة الموقع بالكامل وتحسين بالذكاء الاصطناعي.
                </CardDescription>

                <div className="pt-6 pb-2 border-b">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-amber-500">{currentPricing.gold.price}</span>
                    <span className="text-lg font-bold text-muted-foreground">{currentPricing.currency}</span>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{currentPricing.gold.period}</span>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 pt-4 flex-1 flex flex-col justify-between space-y-6">
                <ul className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-center gap-2.5 font-bold text-foreground">
                    <Check className="w-4 h-4 text-amber-500 shrink-0" />
                    <span><strong>إعلانات غير محدودة</strong> طوال 60 يوماً</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-bold text-amber-600 dark:text-amber-400">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span><strong>تحسين الإعلان وكتابة الوصف بالذكاء الاصطناعي ✨</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5 font-bold text-foreground">
                    <Check className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>إضافة <strong>رابط فيديو يوتيوب + موقع إلكتروني خارجي</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5 font-bold text-foreground">
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    <span>شارة <strong>«👑 ذهبي VIP»</strong> مع إطار ذهبي لامع</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-bold text-foreground">
                    <Check className="w-4 h-4 text-amber-500 shrink-0" />
                    <span><strong>تصدر قمة الصفحة الرئيسية</strong> والبحث والفئات أولاً</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>حتى <strong>15 صورة</strong> بجودة فائقة لكل إعلان</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-medium text-foreground">
                    <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                    <span><strong>توثيق الحساب مجاناً</strong> بالعلامة الزرقاء المعتمدة</span>
                  </li>
                </ul>

                <Button
                  onClick={() => handleSubscribe('gold')}
                  disabled={loadingPlan === 'gold'}
                  size="lg"
                  className="w-full py-6 text-sm sm:text-base font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black rounded-2xl shadow-lg gap-2"
                >
                  {loadingPlan === 'gold' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>جارٍ التجهيز...</span>
                    </>
                  ) : (
                    <>
                      <span>اشتراك VIP الذهبي ({currentPricing.gold.price} {currentPricing.currency})</span>
                      <ArrowRight className="w-4 h-4 rotate-180 text-black" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Payment Trust & Methods Strip */}
          <div className="mt-12 p-6 rounded-3xl bg-secondary/40 border flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-foreground">دفع إلكتروني آمن ومشفر 100%</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  يتم الدفع عبر بوابة Paymob المعتمدة، وتفعيل الباقة يتم بشكل تلقائي ولحظي.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-xl bg-background border shadow-xs">💳 فيزا / ماستركارد</span>
              <span className="px-3 py-1.5 rounded-xl bg-background border shadow-xs">💳 بطاقات ميزة</span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">📱 فودافون كاش والمحافظ</span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">🏢 منافذ فوري</span>
            </div>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section className="container mx-auto px-4 max-w-5xl my-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold font-headline">مقارنة شاملة بين الباقات</h2>
            <p className="text-sm text-muted-foreground mt-1">تعرف على كافة الفروقات لاختيار الخطة التي تلائم تطلعاتك</p>
          </div>

          <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="bg-secondary/60 border-b">
                    <th className="p-4 font-bold text-foreground">الميزة</th>
                    <th className="p-4 font-bold text-center">المجانية</th>
                    <th className="p-4 font-bold text-center text-primary">الفضية</th>
                    <th className="p-4 font-bold text-center text-amber-600 dark:text-amber-400">الذهبية VIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-4 font-semibold">عدد الإعلانات النشطة</td>
                    <td className="p-4 text-center">5 إعلانات</td>
                    <td className="p-4 text-center font-bold text-primary">غير محدود</td>
                    <td className="p-4 text-center font-bold text-amber-600">غير محدود</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">مدة بقاء الاشتراك</td>
                    <td className="p-4 text-center">دائم</td>
                    <td className="p-4 text-center font-semibold">30 يوماً</td>
                    <td className="p-4 text-center font-bold text-amber-600">60 يوماً</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">عدد الصور لكل إعلان</td>
                    <td className="p-4 text-center">4 صور</td>
                    <td className="p-4 text-center">8 صور</td>
                    <td className="p-4 text-center font-bold">15 صورة</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">إضافة رابط فيديو يوتيوب وموقع خارجي</td>
                    <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                    <td className="p-4 text-center font-bold text-primary">✅ متاح</td>
                    <td className="p-4 text-center font-bold text-amber-600">✅ متاح</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">شارة التميز المرئية</td>
                    <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                    <td className="p-4 text-center font-bold text-primary">⭐ إعلان مميز</td>
                    <td className="p-4 text-center font-bold text-amber-600">👑 ذهبي VIP لامع</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">أولوية الظهور في قمة الموقع والبحث</td>
                    <td className="p-4 text-center">عادي</td>
                    <td className="p-4 text-center font-semibold text-primary">أولوية متقدمة</td>
                    <td className="p-4 text-center font-bold text-amber-600">القمة والصدارة الأولى</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">تحسين الإعلانات بالذكاء الاصطناعي</td>
                    <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                    <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                    <td className="p-4 text-center font-bold text-amber-600">✨ نعم (تلقائياً)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">توثيق الحساب بالعلامة الزرقاء</td>
                    <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                    <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                    <td className="p-4 text-center font-bold text-primary">✅ مجاناً مع الباقة</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 max-w-4xl mt-12 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold font-headline flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              <span>الأسئلة الشائعة حول الباقات</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="item-1" className="border rounded-2xl px-5 bg-card">
              <AccordionTrigger className="font-bold text-right text-sm sm:text-base">
                متى يتم تفعيل الباقة بعد الدفع؟
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                يتم تفعيل الباقة فورياً وبشكل تلقائي في نفس اللحظة عبر نظام الـ Webhook الذكي؛ ستصلك رسالة تأكيد في حسابك وتتحول ميزات الباقة لحسابك وإعلاناتك مباشرة.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-2xl px-5 bg-card">
              <AccordionTrigger className="font-bold text-right text-sm sm:text-base">
                ماذا يحدث إذا تجاوزت 5 إعلانات في الباقة المجانية؟
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                تتيح الباقة المجانية إضافة حتى 5 إعلانات نشطة في نفس الوقت. إذا أردت نشر إعلانات إضافية، يمكنك إما حذف إعلان قديم أو الترقية للباقة الفضية أو الذهبية لنشر إعلانات غير محدودة.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-2xl px-5 bg-card">
              <AccordionTrigger className="font-bold text-right text-sm sm:text-base">
                كيف يعمل تحسين الإعلان بالذكاء الاصطناعي في الباقة الذهبية؟
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                يقوم محرك الذكاء الاصطناعي المدمج في الموقع بتحليل عنوان ووصف إعلانك وصياغتهما بأسلوب تسويقي جذاب واحترافي ومتوافق مع محركات البحث (SEO) لضمان ظهور إعلانك لأكبر عدد من المشترين المحتملين.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-2xl px-5 bg-card">
              <AccordionTrigger className="font-bold text-right text-sm sm:text-base">
                ما هي وسائل الدفع المقبولة في المنصة؟
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                نقبل جميع البطاقات البنكية (Visa و MasterCard وميزة)، بالإضافة إلى المحافظ الإلكترونية مثل فودافون كاش واتصالات كاش وأورنج كاش، ومنافذ الدفع النقدي عبر فوري.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
