'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
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
  BadgeCheck,
  Smartphone,
  CreditCard,
  Coins,
  Store,
  ShoppingBag,
  Package,
  Percent,
  Headphones,
  BarChart3,
  Globe2,
  CheckCircle2,
  Layers,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMarket } from "@/context/MarketContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';
import { createPaymobPayment } from '@/app/actions';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import VodafoneCashDialog from '@/components/VodafoneCashDialog';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

type AdPlanId = 'free' | 'premium' | 'gold';
type StorePlanId = 'store_free' | 'store_pro' | 'store_vip';

// ─── 1. أسعار باقات الإعلانات بالعملات المختلفة لجميع الدول العربية ───
const AD_PRICING_DATA: Record<string, {
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

// ─── 2. أسعار باقات المتاجر الإلكترونية لجميع الدول العربية ───
const STORE_PRICING_DATA: Record<string, {
  currency: string;
  flag: string;
  name: string;
  free: { price: string; period: string; amountCents: string };
  pro: { price: string; period: string; amountCents: string };
  vip: { price: string; period: string; amountCents: string };
}> = {
  sa: {
    currency: 'ر.س',
    flag: '🇸🇦',
    name: 'السعودية',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '35', period: 'اشتراك 30 يوماً', amountCents: '3500' },
    vip: { price: '95', period: 'اشتراك 60 يوماً', amountCents: '9500' },
  },
  eg: {
    currency: 'ج.م',
    flag: '🇪🇬',
    name: 'مصر',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '350', period: 'اشتراك 30 يوماً', amountCents: '35000' },
    vip: { price: '950', period: 'اشتراك 60 يوماً', amountCents: '95000' },
  },
  ae: {
    currency: 'د.إ',
    flag: '🇦🇪',
    name: 'الإمارات',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '35', period: 'اشتراك 30 يوماً', amountCents: '3500' },
    vip: { price: '95', period: 'اشتراك 60 يوماً', amountCents: '9500' },
  },
  kw: {
    currency: 'د.ك',
    flag: '🇰🇼',
    name: 'الكويت',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '3.5', period: 'اشتراك 30 يوماً', amountCents: '350' },
    vip: { price: '9.5', period: 'اشتراك 60 يوماً', amountCents: '950' },
  },
  qa: {
    currency: 'ر.ق',
    flag: '🇶🇦',
    name: 'قطر',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '35', period: 'اشتراك 30 يوماً', amountCents: '3500' },
    vip: { price: '95', period: 'اشتراك 60 يوماً', amountCents: '9500' },
  },
  bh: {
    currency: 'د.ب',
    flag: '🇧🇭',
    name: 'البحرين',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '3.5', period: 'اشتراك 30 يوماً', amountCents: '350' },
    vip: { price: '9.5', period: 'اشتراك 60 يوماً', amountCents: '950' },
  },
  om: {
    currency: 'ر.ع',
    flag: '🇴🇲',
    name: 'عُمان',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '3.5', period: 'اشتراك 30 يوماً', amountCents: '350' },
    vip: { price: '9.5', period: 'اشتراك 60 يوماً', amountCents: '950' },
  },
  jo: {
    currency: 'د.أ',
    flag: '🇯🇴',
    name: 'الأردن',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '7', period: 'اشتراك 30 يوماً', amountCents: '700' },
    vip: { price: '19', period: 'اشتراك 60 يوماً', amountCents: '1900' },
  },
  iq: {
    currency: 'د.ع',
    flag: '🇮🇶',
    name: 'العراق',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '12,000', period: 'اشتراك 30 يوماً', amountCents: '1200000' },
    vip: { price: '32,000', period: 'اشتراك 60 يوماً', amountCents: '3200000' },
  },
  ma: {
    currency: 'د.م',
    flag: '🇲🇦',
    name: 'المغرب',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '90', period: 'اشتراك 30 يوماً', amountCents: '9000' },
    vip: { price: '240', period: 'اشتراك 60 يوماً', amountCents: '24000' },
  },
  dz: {
    currency: 'د.ج',
    flag: '🇩🇿',
    name: 'الجزائر',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '1,200', period: 'اشتراك 30 يوماً', amountCents: '120000' },
    vip: { price: '3,200', period: 'اشتراك 60 يوماً', amountCents: '320000' },
  },
  tn: {
    currency: 'د.ت',
    flag: '🇹🇳',
    name: 'تونس',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '25', period: 'اشتراك 30 يوماً', amountCents: '2500' },
    vip: { price: '70', period: 'اشتراك 60 يوماً', amountCents: '7000' },
  },
  ly: {
    currency: 'د.ل',
    flag: '🇱🇾',
    name: 'ليبيا',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '45', period: 'اشتراك 30 يوماً', amountCents: '4500' },
    vip: { price: '120', period: 'اشتراك 60 يوماً', amountCents: '12000' },
  },
  ye: {
    currency: 'ر.ي',
    flag: '🇾🇪',
    name: 'اليمن',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '2,000', period: 'اشتراك 30 يوماً', amountCents: '200000' },
    vip: { price: '5,500', period: 'اشتراك 60 يوماً', amountCents: '550000' },
  },
  sd: {
    currency: 'ج.س',
    flag: '🇸🇩',
    name: 'السودان',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '5,000', period: 'اشتراك 30 يوماً', amountCents: '500000' },
    vip: { price: '14,000', period: 'اشتراك 60 يوماً', amountCents: '1400000' },
  },
  lb: {
    currency: 'ل.ل',
    flag: '🇱🇧',
    name: 'لبنان',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '750,000', period: 'اشتراك 30 يوماً', amountCents: '75000000' },
    vip: { price: '2,100,000', period: 'اشتراك 60 يوماً', amountCents: '210000000' },
  },
  ps: {
    currency: '₪',
    flag: '🇵🇸',
    name: 'فلسطين',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '35', period: 'اشتراك 30 يوماً', amountCents: '3500' },
    vip: { price: '95', period: 'اشتراك 60 يوماً', amountCents: '9500' },
  },
  usd: {
    currency: '$',
    flag: '🌐',
    name: 'دول أخرى (USD)',
    free: { price: '0', period: 'مجاناً دائماً', amountCents: '0' },
    pro: { price: '9', period: 'اشتراك 30 يوماً', amountCents: '900' },
    vip: { price: '25', period: 'اشتراك 60 يوماً', amountCents: '2500' },
  },
};

function PricingContent() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { market } = useMarket();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // نوع الباقات المعروضة: إعلانات أو متاجر
  const initialTab = searchParams?.get('tab') === 'stores' ? 'stores' : 'ads';
  const [activeTab, setActiveTab] = useState<'ads' | 'stores'>(initialTab);

  // تحديد الدولة والعملة الافتراضية
  const [selectedCountry, setSelectedCountry] = useState<string>('eg');
  const [userSelectedCountryManually, setUserSelectedCountryManually] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // حالة حوار فودافون كاش
  const [vodafoneCashDialog, setVodafoneCashDialog] = useState<{
    open: boolean;
    planId: 'premium' | 'gold' | 'store_pro' | 'store_vip' | string;
    planName: string;
    amount: number;
    currency: string;
  }>({ open: false, planId: 'premium', planName: '', amount: 0, currency: 'EGP' });

  const openVodafoneCash = (planId: 'premium' | 'gold' | 'store_pro' | 'store_vip') => {
    if (!user || !userProfile) {
      toast({
        title: 'تسجيل الدخول مطلوب',
        description: 'يرجى تسجيل الدخول أو إنشاء حساب لاختيار الباقة.',
        variant: 'destructive',
      });
      router.push(`/login?redirect=/pricing${activeTab === 'stores' ? '?tab=stores' : ''}`);
      return;
    }

    let egpAmount = 250;
    let planName = 'الباقة الفضية المميزة ⭐';

    if (planId === 'gold') {
      egpAmount = 750;
      planName = 'الباقة الذهبية VIP 👑';
    } else if (planId === 'store_pro') {
      egpAmount = 350;
      planName = 'باقة التاجر المحترف للمتاجر ⭐';
    } else if (planId === 'store_vip') {
      egpAmount = 950;
      planName = 'باقة متاجر النخبة والشركات VIP 👑';
    }

    setVodafoneCashDialog({
      open: true,
      planId,
      planName,
      amount: egpAmount,
      currency: 'ج.م',
    });
  };

  const showVodafoneCash = true;

  useEffect(() => {
    setIsClient(true);
    if (!userSelectedCountryManually) {
      const countryKey = (market?.id || userProfile?.country || 'eg').toLowerCase();
      if (AD_PRICING_DATA[countryKey]) {
        setSelectedCountry(countryKey);
      }
    }
  }, [market?.id, userProfile?.country, userSelectedCountryManually]);

  const paymentStatus = searchParams?.get('payment');
  const activatedPlan = searchParams?.get('plan');

  useEffect(() => {
    if (paymentStatus === 'success') {
      if (refreshUserProfile) refreshUserProfile();
      const planTitle = activatedPlan === 'store_vip'
        ? 'باقة متاجر النخبة والشركات VIP 👑'
        : activatedPlan === 'store_pro'
        ? 'باقة التاجر المحترف ⭐'
        : activatedPlan === 'gold'
        ? 'الباقة الذهبية VIP 👑'
        : 'الباقة الفضية المميزة ⭐';

      toast({
        title: "🎉 تم تفعيل الباقة بنجاح!",
        description: `تهانينا! تم تفعيل اشتراكك في ${planTitle} بنجاح.`,
      });
    } else if (paymentStatus === 'failed') {
      toast({
        title: "فشلت عملية الدفع",
        description: "لم تكتمل عملية الدفع أو تم إلغاؤها. يمكنك المحاولة مرة أخرى في أي وقت.",
        variant: 'destructive',
      });
    }
  }, [paymentStatus, activatedPlan, refreshUserProfile, toast]);

  const currentAdPricing = useMemo(() => {
    return AD_PRICING_DATA[selectedCountry] || AD_PRICING_DATA['eg'];
  }, [selectedCountry]);

  const currentStorePricing = useMemo(() => {
    return STORE_PRICING_DATA[selectedCountry] || STORE_PRICING_DATA['eg'];
  }, [selectedCountry]);

  const handleSubscribeAd = async (planId: AdPlanId) => {
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

    const planInfo = planId === 'gold' ? currentAdPricing.gold : currentAdPricing.premium;
    setLoadingPlan(planId);

    try {
      const displayName = userProfile?.name || userProfile?.fullName || user.displayName || 'عميل سوق العرب';
      const nameParts = displayName.trim().split(' ');
      const paymentInput = {
        amount_cents: String(planInfo.amountCents),
        email: (user.email && user.email.includes('@')) ? user.email : ((userProfile as any)?.email || 'customer@arb-soq.com'),
        first_name: nameParts[0] || 'عميل',
        last_name: nameParts.slice(1).join(' ') || 'سوق العرب',
        phone_number: userProfile?.phoneNumber || userProfile?.phone || '+201003975823',
        userId: user.uid,
        planId: planId,
      };

      const result = await createPaymobPayment(paymentInput);

      if (result.success && result.url) {
        toast({
          title: "جارٍ التحويل لبوابة الدفع...",
          description: "سيتم نقلك لصفحة الدفع الآمنة لتأكيد الاشتراك.",
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

  const handleSubscribeStore = async (planId: StorePlanId) => {
    if (planId === 'store_free') {
      router.push('/store/create');
      return;
    }

    if (!user || !userProfile) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يرجى تسجيل الدخول أو إنشاء حساب لبناء متجرك والاشتراك.",
        variant: 'destructive',
      });
      router.push('/login?redirect=/pricing?tab=stores');
      return;
    }

    const planInfo = planId === 'store_vip' ? currentStorePricing.vip : currentStorePricing.pro;
    setLoadingPlan(planId);

    try {
      const displayName = userProfile?.name || userProfile?.fullName || user.displayName || 'عميل متجر سوق العرب';
      const nameParts = displayName.trim().split(' ');
      const paymentInput = {
        amount_cents: String(planInfo.amountCents),
        email: (user.email && user.email.includes('@')) ? user.email : ((userProfile as any)?.email || 'store@arb-soq.com'),
        first_name: nameParts[0] || 'تاجر',
        last_name: nameParts.slice(1).join(' ') || 'سوق العرب',
        phone_number: userProfile?.phoneNumber || userProfile?.phone || '+201003975823',
        userId: user.uid,
        planId: planId,
      };

      const result = await createPaymobPayment(paymentInput);

      if (result.success && result.url) {
        toast({
          title: "جارٍ التحويل لبوابة الدفع...",
          description: "سيتم نقلك لصفحة الدفع لتأكيد باقة متجرك.",
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
        <section className="relative bg-gradient-to-b from-primary/10 via-background to-background pt-12 pb-10 text-center px-4 overflow-hidden">
          <div className="container mx-auto max-w-4xl relative z-10">
            {/* Header Badge */}
            <Badge variant="outline" className="mb-4 px-3.5 py-1 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm font-bold gap-1.5 shadow-sm inline-flex items-center">
              {activeTab === 'ads' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>باقات مخصصة لمضاعفة المبيعات وانتشار الإعلانات</span>
                </>
              ) : (
                <>
                  <Store className="w-3.5 h-3.5 text-amber-500" />
                  <span>باقات وخطط بناء المتاجر الإلكترونية للتجار وأصحاب المشاريع</span>
                </>
              )}
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-black font-headline tracking-tight text-foreground leading-tight">
              {activeTab === 'ads'
                ? 'اختر الباقة المناسبة وضاعف وصول إعلاناتك'
                : 'أنشئ متجرك الإلكتروني الاحترافي وضاعف مبيعاتك'}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {activeTab === 'ads'
                ? 'سواء كنت فرداً يعرض سلعاً مستعملة، أو معلناً يبحث عن تصدر نتائج البحث والصفحة الرئيسية، لدينا الخطة المثالية لنمو مبيعاتك.'
                : 'حلول متكاملة لبناء هويتك التجارية: صفحة متجر مخصصة، سلة تسوق، توثيق معتمد، ظهور في الصفحة الرئيسية، و 0% عمولة على المبيعات.'}
            </p>

            {/* ── Tabs Switcher: باقات الإعلانات vs باقات المتاجر ── */}
            <div className="mt-7 inline-flex items-center p-1.5 rounded-2xl bg-secondary/80 border border-border shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('ads')}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2",
                  activeTab === 'ads'
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Zap className="w-4 h-4" />
                <span>📢 باقات الإعلانات والترويج</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stores')}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2",
                  activeTab === 'stores'
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md font-extrabold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Store className="w-4 h-4" />
                <span>🏪 باقات المتاجر والتجار</span>
                <span className="bg-amber-400 text-black font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-xs">
                  جديد
                </span>
              </button>
            </div>

            {/* Currency Selector Tabs */}
            <div className="mt-6 inline-flex items-center p-1.5 rounded-2xl bg-secondary/60 border shadow-inner flex-wrap justify-center gap-1">
              {Object.entries(AD_PRICING_DATA).map(([code, data]) => (
                <button
                  key={code}
                  onClick={() => {
                    setSelectedCountry(code);
                    setUserSelectedCountryManually(true);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5",
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

        {/* ════════════════════════════════════════════════════════════════
            1. عرض باقات الإعلانات (Ads Pricing Cards Grid)
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ads' && (
          <section className="container mx-auto px-4 max-w-6xl mt-2 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              
              {/* 1. Free Ad Plan */}
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
                      <span className="text-lg font-bold text-muted-foreground">{currentAdPricing.currency}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{currentAdPricing.free.period}</span>
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
                    onClick={() => handleSubscribeAd('free')}
                    variant="outline"
                    size="lg"
                    className="w-full py-6 text-sm sm:text-base font-bold rounded-2xl"
                  >
                    ابدأ النشر مجاناً 🚀
                  </Button>
                </CardContent>
              </Card>

              {/* 2. Silver / Premium Ad Plan */}
              <Card className="flex flex-col border-2 border-primary/40 rounded-3xl bg-card transition-all duration-300 hover:shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 bg-primary/15 py-1 text-center text-xs font-bold text-primary">
                  ⭐ الباقة الأكثر شعبية للمعلنين والتجار
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
                      <span className="text-4xl sm:text-5xl font-black text-primary">{currentAdPricing.premium.price}</span>
                      <span className="text-lg font-bold text-muted-foreground">{currentAdPricing.currency}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{currentAdPricing.premium.period}</span>
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

                  <div className="space-y-2.5">
                    {showVodafoneCash && (
                      <Button
                        onClick={() => openVodafoneCash('premium')}
                        size="lg"
                        className="w-full py-6 text-sm sm:text-base font-bold rounded-2xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>
                          {selectedCountry === 'eg'
                            ? `ادفع بفودافون كاش (${currentAdPricing.premium.price} ج.م)`
                            : `ادفع بفودافون كاش والمحافظ (250 ج.م)`}
                        </span>
                      </Button>
                    )}

                    <Button
                      disabled={true}
                      size="lg"
                      variant="outline"
                      className="w-full py-5 text-xs sm:text-sm font-semibold rounded-2xl gap-2 border-border/80 text-muted-foreground bg-muted/30 cursor-not-allowed opacity-70"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>الدفع بالبطاقة البنكية (قيد التفعيل قريباً)</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 3. Gold VIP Ad Plan */}
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
                    لأصحاب الأعمال والشركات — صدارة الموقع بالكامل وتحسين بالذكاء الاصطناعي.
                  </CardDescription>

                  <div className="pt-6 pb-2 border-b">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-amber-500">{currentAdPricing.gold.price}</span>
                      <span className="text-lg font-bold text-muted-foreground">{currentAdPricing.currency}</span>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{currentAdPricing.gold.period}</span>
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

                  <div className="space-y-2.5">
                    {showVodafoneCash && (
                      <Button
                        onClick={() => openVodafoneCash('gold')}
                        size="lg"
                        className="w-full py-6 text-sm sm:text-base font-extrabold rounded-2xl gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black shadow-lg transition-all"
                      >
                        <Smartphone className="w-4 h-4 text-black" />
                        <span>
                          {selectedCountry === 'eg'
                            ? `ادفع بفودافون كاش (${currentAdPricing.gold.price} ج.م)`
                            : `ادفع بفودافون كاش والمحافظ (750 ج.م)`}
                        </span>
                      </Button>
                    )}

                    <Button
                      disabled={true}
                      size="lg"
                      variant="outline"
                      className="w-full py-5 text-xs sm:text-sm font-semibold rounded-2xl gap-2 border-border/80 text-muted-foreground bg-muted/30 cursor-not-allowed opacity-70"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>الدفع بالبطاقة البنكية (قيد التفعيل قريباً)</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            2. عرض باقات المتاجر الإلكترونية (Store Pricing Cards Grid)
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'stores' && (
          <section className="container mx-auto px-4 max-w-6xl mt-2 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              
              {/* 1. Basic / Free Store Plan */}
              <Card className="flex flex-col border border-border rounded-3xl bg-card transition-all duration-300 hover:shadow-lg relative overflow-hidden">
                <CardHeader className="p-6 sm:p-8 pb-4 text-right">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300">
                      <Store className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="font-semibold">للمبتدئين والمشاريع الناشئة</Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold">باقة المتجر الأساسي</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    ابدأ تجارتك الإلكترونية واعرض منتجاتك مباشرة لآلاف المشترين.
                  </CardDescription>

                  <div className="pt-6 pb-2 border-b">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black">0</span>
                      <span className="text-lg font-bold text-muted-foreground">{currentStorePricing.currency}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{currentStorePricing.free.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 pt-4 flex-1 flex flex-col justify-between space-y-6">
                  <ul className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-center gap-2.5 font-bold text-foreground">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>حتى <strong>10 منتجات نشطة</strong> في المتجر</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-medium text-foreground">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>صفحة متجر بهوية مخصصة (شعار، غلاف، وصف)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>رابط مباشر وسهل لمشاركة المتجر والمنتجات</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>استقبال الطلبات عبر الواتساب والمكالمات مباشرة</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>0% عمولة</strong> على كافة مبيعاتك (أرباحك لك 100%)</span>
                    </li>
                    <li className="flex items-center gap-2.5 opacity-50">
                      <X className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>بدون شارة المتجر الموثق</span>
                    </li>
                    <li className="flex items-center gap-2.5 opacity-50">
                      <X className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>بدون الظهور في شريط «المتاجر المميزة» بالرئيسية</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => handleSubscribeStore('store_free')}
                    variant="outline"
                    size="lg"
                    className="w-full py-6 text-sm sm:text-base font-bold rounded-2xl gap-2 border-primary/40 text-primary hover:bg-primary/5"
                  >
                    <span>ابدأ بناء متجرك مجاناً 🚀</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* 2. Pro Store Plan */}
              <Card className="flex flex-col border-2 border-primary/50 rounded-3xl bg-card transition-all duration-300 hover:shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 bg-primary/15 py-1 text-center text-xs font-bold text-primary">
                  ⭐ الخيار المفضل للمتاجر النشطة والمتنامية
                </div>
                <CardHeader className="p-6 sm:p-8 pt-8 pb-4 text-right">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <Badge className="bg-primary text-primary-foreground font-bold">باقة التاجر المحترف</Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold">متجر التاجر المحترف</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    بناء هوية تجارية قوية ومضاعفة مبيعاتك مع أدوات تسويق حصرية.
                  </CardDescription>

                  <div className="pt-6 pb-2 border-b">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-primary">{currentStorePricing.pro.price}</span>
                      <span className="text-lg font-bold text-muted-foreground">{currentStorePricing.currency}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{currentStorePricing.pro.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 pt-4 flex-1 flex flex-col justify-between space-y-6">
                  <ul className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-center gap-2.5 font-bold text-foreground">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>حتى <strong>60 منتج نشط</strong> مع تصنيفات مخصصة</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-primary">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                      <span>شارة <strong>«⭐ متجر موثق ومميز»</strong> تزيد ثقة العملاء</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-foreground">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span><strong>ظهور بارز</strong> في قسم «المتاجر المميزة» بالصفحة الرئيسية</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-medium text-foreground">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>سلة مشتريات سريعة وإدارة وتتبع الطلبات</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>ربط كافة حسابات التواصل الاجتماعي وموقع خارجي</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>إحصائيات متقدمة لزيارات المتجر والمنتجات الأكثر طلباً</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <Percent className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>0% عمولة</strong> على كافة العمليات</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>أولوية الترتيب في البحث ودعم فني سريع</span>
                    </li>
                  </ul>

                  <div className="space-y-2.5">
                    {showVodafoneCash && (
                      <Button
                        onClick={() => openVodafoneCash('store_pro')}
                        size="lg"
                        className="w-full py-6 text-sm sm:text-base font-bold rounded-2xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>
                          {selectedCountry === 'eg'
                            ? `ادفع بفودافون كاش (${currentStorePricing.pro.price} ج.م)`
                            : `ادفع بفودافون كاش والمحافظ (350 ج.م)`}
                        </span>
                      </Button>
                    )}

                    <Button
                      disabled={true}
                      size="lg"
                      variant="outline"
                      className="w-full py-5 text-xs sm:text-sm font-semibold rounded-2xl gap-2 border-border/80 text-muted-foreground bg-muted/30 cursor-not-allowed opacity-70"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>الدفع بالبطاقة البنكية (قيد التفعيل قريباً)</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 3. VIP Enterprise Store Plan */}
              <Card className="flex flex-col border-2 border-amber-500/80 rounded-3xl bg-gradient-to-b from-amber-500/5 via-card to-card shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-400 py-1.5 text-center text-xs font-black text-black tracking-wider uppercase">
                  👑 باقة كبار التجار والشركات VIP — بلا حدود
                </div>
                <CardHeader className="p-6 sm:p-8 pt-8 pb-4 text-right">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Crown className="w-6 h-6 fill-amber-500 text-amber-500" />
                    </div>
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold border-none shadow-sm">
                      النخبة والشركات VIP
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold">متجر الشركات والنخبة VIP</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    للمصانع والماركات وكبار الموردين — سيطرة كاملة وأدوات ذكاء اصطناعي ومدير حساب خاص.
                  </CardDescription>

                  <div className="pt-6 pb-2 border-b">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-amber-500">{currentStorePricing.vip.price}</span>
                      <span className="text-lg font-bold text-muted-foreground">{currentStorePricing.currency}</span>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{currentStorePricing.vip.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 pt-4 flex-1 flex flex-col justify-between space-y-6">
                  <ul className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-center gap-2.5 font-black text-foreground text-sm">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span><strong>منتجات غير محدودة (Unlimited)</strong> 🚀</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span><strong>توليد وتحسين أوصاف المنتجات بالذكاء الاصطناعي ✨</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-foreground">
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                      <span>شارة التوثيق الملكية <strong>«👑 متجر VIP معتمد»</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-foreground">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span><strong>صدارة قسم المتاجر وقمة الصفحة الرئيسية والبحث أولاً</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5 font-medium text-foreground">
                      <Globe2 className="w-4 h-4 text-primary shrink-0" />
                      <span>رابط متجر مخصص وفخم (Custom Vanity URL)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>إبراز تخفيضات المتجر في بنرات الموقع الإعلانية</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <Percent className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>0% عمولة</strong> مع ترويج متجرك في منصاتنا</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-foreground">
                      <Headphones className="w-4 h-4 text-primary shrink-0" />
                      <span><strong>مدير حساب مخصص</strong> ودعم مباشر واتساب 24/7</span>
                    </li>
                  </ul>

                  <div className="space-y-2.5">
                    {showVodafoneCash && (
                      <Button
                        onClick={() => openVodafoneCash('store_vip')}
                        size="lg"
                        className="w-full py-6 text-sm sm:text-base font-extrabold rounded-2xl gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black shadow-lg transition-all"
                      >
                        <Smartphone className="w-4 h-4 text-black" />
                        <span>
                          {selectedCountry === 'eg'
                            ? `ادفع بفودافون كاش (${currentStorePricing.vip.price} ج.م)`
                            : `ادفع بفودافون كاش والمحافظ (950 ج.م)`}
                        </span>
                      </Button>
                    )}

                    <Button
                      disabled={true}
                      size="lg"
                      variant="outline"
                      className="w-full py-5 text-xs sm:text-sm font-semibold rounded-2xl gap-2 border-border/80 text-muted-foreground bg-muted/30 cursor-not-allowed opacity-70"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>الدفع بالبطاقة البنكية (قيد التفعيل قريباً)</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </section>
        )}

        {/* Payment Trust & Methods Strip */}
        <section className="container mx-auto px-4 max-w-6xl mb-16">
          <div className="p-6 rounded-3xl bg-secondary/40 border flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-foreground">دفع إلكتروني آمن ومعتمد 100%</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  يتم التفعيل الفوري لكافة ميزات الحساب فور تأكيد العملية، مع دعم فني مخصص.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-xl bg-background border shadow-xs">💳 فيزا / ماستركارد</span>
              <span className="px-3 py-1.5 rounded-xl bg-background border shadow-xs">💳 بطاقات ميزة</span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">📱 فودافون كاش والمحافظ الذكية</span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">🏢 منافذ فوري</span>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            3. جدول المقارنة الشامل (Detailed Comparison Table)
           ════════════════════════════════════════════════════════════════ */}
        <section className="container mx-auto px-4 max-w-5xl my-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold font-headline">
              {activeTab === 'ads' ? 'مقارنة شاملة بين باقات الإعلانات' : 'مقارنة شاملة بين باقات وخطط المتاجر'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'ads'
                ? 'تعرف على كافة الفروقات لاختيار باقة الإعلان الأنسب لميزانيتك'
                : 'قارن بين ميزات المتاجر لتختار الخطة المثالية لنمو نشاطك التجاري'}
            </p>
          </div>

          <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {activeTab === 'ads' ? (
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
              ) : (
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-secondary/60 border-b">
                      <th className="p-4 font-bold text-foreground">الميزة</th>
                      <th className="p-4 font-bold text-center">المتجر الأساسي</th>
                      <th className="p-4 font-bold text-center text-primary">التاجر المحترف ⭐</th>
                      <th className="p-4 font-bold text-center text-amber-600 dark:text-amber-400">النخبة والشركات VIP 👑</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-4 font-semibold">عدد منتجات المتجر النشطة</td>
                      <td className="p-4 text-center">حتى 10 منتجات</td>
                      <td className="p-4 text-center font-bold text-primary">حتى 60 منتج</td>
                      <td className="p-4 text-center font-black text-amber-600">غير محدود (Unlimited)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">مدة الاشتراك</td>
                      <td className="p-4 text-center">مجاناً دائماً</td>
                      <td className="p-4 text-center font-semibold">30 يوماً</td>
                      <td className="p-4 text-center font-bold text-amber-600">60 يوماً</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">شارة توثيق المتجر</td>
                      <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                      <td className="p-4 text-center font-bold text-primary">⭐ متجر موثق ومميز</td>
                      <td className="p-4 text-center font-black text-amber-600">👑 متجر VIP رسمي معتمد</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">الظهور في قسم «المتاجر المميزة» بالرئيسية</td>
                      <td className="p-4 text-center">عادي</td>
                      <td className="p-4 text-center font-bold text-primary">✅ ظهور بارز</td>
                      <td className="p-4 text-center font-black text-amber-600">👑 في الصدارة أولاً</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">سلة التسوق واستقبال الطلبات</td>
                      <td className="p-4 text-center">واتساب واتصال</td>
                      <td className="p-4 text-center font-semibold text-primary">سلة سريعة + واتساب</td>
                      <td className="p-4 text-center font-bold text-amber-600">سلة متطورة + تنبيهات فورية</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">كتابة وتحسين الأوصاف بالذكاء الاصطناعي</td>
                      <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                      <td className="p-4 text-center text-muted-foreground">10 منتجات شهرياً</td>
                      <td className="p-4 text-center font-black text-amber-600">✨ توليد غير محدود</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">نسبة العمولة على المبيعات</td>
                      <td className="p-4 text-center font-bold text-emerald-600">0% عمولة</td>
                      <td className="p-4 text-center font-bold text-emerald-600">0% عمولة</td>
                      <td className="p-4 text-center font-bold text-emerald-600">0% عمولة</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">إحصائيات المبيعات وزوار المتجر</td>
                      <td className="p-4 text-center">أساسية</td>
                      <td className="p-4 text-center font-semibold text-primary">تحليلات متقدمة</td>
                      <td className="p-4 text-center font-bold text-amber-600">تقرير شامل وتفاعلي</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">الدعم الفني وإدارة الحساب</td>
                      <td className="p-4 text-center">دعم قياسي</td>
                      <td className="p-4 text-center font-semibold text-primary">دعم ذو أولوية</td>
                      <td className="p-4 text-center font-black text-amber-600">مدير حساب مخصص + 24/7</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            4. الأسئلة الشائعة (FAQ Section)
           ════════════════════════════════════════════════════════════════ */}
        <section className="container mx-auto px-4 max-w-4xl mt-12 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold font-headline flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              <span>{activeTab === 'ads' ? 'الأسئلة الشائعة حول باقات الإعلانات' : 'الأسئلة الشائعة حول المتاجر والتجار'}</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {activeTab === 'ads' ? (
              <>
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
                    نقبل جميع المحافظ الإلكترونية مثل فودافون كاش واتصالات كاش وأورنج كاش والمحافظ البنكية، بالإضافة إلى البطاقات البنكية (Visa و MasterCard وميزة).
                  </AccordionContent>
                </AccordionItem>
              </>
            ) : (
              <>
                <AccordionItem value="item-s1" className="border rounded-2xl px-5 bg-card">
                  <AccordionTrigger className="font-bold text-right text-sm sm:text-base">
                    كيف أبدأ ببناء متجري الإلكتروني بعد الاشتراك؟
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    فور الاشتراك، يمكنك التوجه إلى صفحة «إنشاء وإدارة المتجر» من القائمة العلوية أو لوحة التحكم، وإدخال اسم متجرك وشعاره وغلافه، ثم البدء فوراً في إضافة منتجاتك وتصنيفاتها لتظهر في صفحة متجرك الرسمية وفي نتائج البحث.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-s2" className="border rounded-2xl px-5 bg-card">
                  <AccordionTrigger className="font-bold text-right text-sm sm:text-base">
                    هل يخصم موقع سوق العرب أي عمولة على مبيعات المتجر؟
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    لا على الإطلاق! نسبة العمولة في سوق العرب هي 0% على كافة المبيعات؛ كافة الأرباح والمبالغ المستلمة من المشترين تعود إليك بالكامل بدون أي خصومات خفية.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-s3" className="border rounded-2xl px-5 bg-card">
                  <AccordionTrigger className="font-bold text-right text-sm sm:text-base">
                    كيف يستلم المتجر طلبات الشراء وأموال المنتجات؟
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    يتواصل المشتري معك مباشرة عبر الواتساب أو الاتصال الهاتفي أو سلة الشراء الذكية لتأكيد الطلب وتفاصيل الشحن، ويتم الدفع بينك وبين العميل وفق وسيلة الدفع التي تفضلها (الدفع عند الاستلام، المحافظ الإلكترونية، أو التحويل البنكي).
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-s4" className="border rounded-2xl px-5 bg-card">
                  <AccordionTrigger className="font-bold text-right text-sm sm:text-base">
                    كيف يساهم محرك الذكاء الاصطناعي في زيادة مبيعات متجري؟
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    في باقة النخبة VIP، يساعدك الذكاء الاصطناعي في كتابة أوصاف تسويقية احترافية للمنتجات، واستخراج الكلمات المفتاحية الأكثر بحثاً على جوجل وسوق العرب، مما يجعل منتجاتك تظهر في أولى النتائج وتجذب آلاف المشترين المستهدفين.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-s5" className="border rounded-2xl px-5 bg-card">
                  <AccordionTrigger className="font-bold text-right text-sm sm:text-base">
                    هل يمكنني ترقية باقة متجري في أي وقت؟
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    نعم بالتأكيد! يمكنك البدء بالمتجر الأساسي المجاني وتجربة النظام، ثم الترقية في أي وقت إلى باقة التاجر المحترف أو باقة الشركات والنخبة VIP للاستفادة من عدد منتجات غير محدود وظهور بصدارة الصفحة الرئيسية.
                  </AccordionContent>
                </AccordionItem>
              </>
            )}
          </Accordion>
        </section>
      </main>

      <Footer />

      {/* ── حوار الدفع بفودافون كاش ── */}
      <VodafoneCashDialog
        isOpen={vodafoneCashDialog.open}
        onOpenChange={(open) => setVodafoneCashDialog((s) => ({ ...s, open }))}
        planId={vodafoneCashDialog.planId}
        planName={vodafoneCashDialog.planName}
        amount={vodafoneCashDialog.amount}
        currency={vodafoneCashDialog.currency}
      />
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
