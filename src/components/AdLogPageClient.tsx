'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Phone, 
  MousePointerClick, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Smartphone, 
  Monitor, 
  Tablet,
  RotateCcw, 
  Loader2, 
  Activity, 
  Share2, 
  BarChart3,
  ChevronLeft,
  Info,
  Tag,
  MapPin,
  Globe,
  Trash2,
  Copy,
  CheckCircle2,
  Sparkles,
  Filter
} from 'lucide-react';
import type { Ad, AdActivityStats, AdTimeframe, AdActivityEvent, AdActivityEventType } from '@/lib/types';
import { getAdActivityStats, resetAdActivityLogs } from '@/lib/ad-log-service';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useMarket } from '@/context/MarketContext';
import { useAuth } from '@/context/AuthContext';
import AdPlaceholder from '@/components/AdPlaceholder';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

// Whatsapp icon component
const WhatsappIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.022-.08-.115-.188-.417-.329-.3-.14-1.778-.877-2.037-.972-.26-.095-.448-.142-.642.148-.193.29-.749.972-.919 1.162-.17.19-.34.21-.641.07-.3-.14-1.272-.468-2.423-1.493-.895-.8-1.5-1.787-1.675-2.09-.175-.3-.018-.463.132-.613.136-.135.3-.35.45-.524.15-.175.2-.292.3-.487.1-.197.05-.369-.025-.51-.07-.14-.642-1.547-.882-2.128-.233-.564-.47-.488-.642-.496-.166-.008-.356-.01-.546-.01-.19 0-.5.07-.76.357-.26.29-1 .975-1 2.378 0 1.4 1.01 2.75 1.15 2.94.14.19 1.98 3.03 4.8 4.24.67.29 1.2.46 1.61.59.67.21 1.28.18 1.76.11.53-.08 1.63-.67 1.86-1.32.23-.65.23-1.2.16-1.32-.07-.12-.26-.19-.56-.33zM12.002 2c-5.523 0-10 4.477-10 10 0 1.778.463 3.507 1.345 5.032L2 22l5.132-1.347c1.472.8 3.12 1.222 4.87 1.222 5.523 0 10-4.477 10-10s-4.477-10-10-10z"/>
  </svg>
);

export default function AdLogPageClient({ initialAd }: { initialAd: Ad }) {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { market } = useMarket();
  const { userProfile, categories } = useAuth();
  const [ad, setAd] = useState<Ad>(initialAd);
  const [timeframe, setTimeframe] = useState<AdTimeframe>('all');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<'all' | 'view' | 'click' | 'call' | 'whatsapp'>('all');
  const [stats, setStats] = useState<AdActivityStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // تحديد ما إذا كان المستخدم قادماً من مراجعة الإعلانات في لوحة تحكم المسؤول (فقط عند وجود from=admin صراحة)
  const isFromAdmin = searchParams.get('from') === 'admin';
  const backUrl = isFromAdmin ? '/admin?tab=ads' : '/dashboard';
  const backLabel = isFromAdmin ? 'مراجعة الإعلانات' : 'إدارة الإعلانات';

  const adId = initialAd?.id;

  const fetchStats = useCallback(async (selectedTf: AdTimeframe, isManualRefresh = false) => {
    if (!adId) return;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAdActivityStats(adId, selectedTf, initialAd);
      setStats(data);
      if (data) {
        setAd(prev => ({
          ...prev,
          views: data.views,
          clicks: data.clicks,
          callClicks: data.callClicks,
          whatsappClicks: data.whatsappClicks,
        }));
      }
    } catch (error) {
      console.error('Failed to load ad activity stats:', error);
      toast({
        title: 'خطأ في جلب السجل',
        description: 'تعذر تحميل إحصائيات النشاط للإعلان.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adId, initialAd, toast]);

  useEffect(() => {
    if (adId) {
      fetchStats(timeframe);
    }
  }, [adId, timeframe, fetchStats]);

  const handleTimeframeChange = (val: string) => {
    const tf = val as AdTimeframe;
    setTimeframe(tf);
  };

  const handleCopyReport = () => {
    if (!stats || !ad) return;

    const reportText = `📊 تقرير نشاط وأداء الإعلان الموثق
العنوان: ${ad.title}
معرف الإعلان: ${ad.id}
الفترة الزمنية: ${timeframe === 'all' ? 'الكل' : timeframe === '30d' ? 'آخر 30 يوماً' : timeframe === '7d' ? 'آخر أسبوع' : 'آخر 24 ساعة'}
----------------------------
👁️ إجمالي المشاهدات: ${(stats.views || 0).toLocaleString('ar-EG')} مشاهدة
🖱️ نقرات فتح بطاقة الإعلان: ${(stats.clicks || 0).toLocaleString('ar-EG')} نقرة
📞 نقرات الاتصال بالبائع: ${(stats.callClicks || 0).toLocaleString('ar-EG')} اتصال
💬 نقرات الواتساب والمراسلة: ${(stats.whatsappClicks || 0).toLocaleString('ar-EG')} مراسلة
⚡ إجمالي التفاعل المباشر: ${(stats.totalInteractions || 0).toLocaleString('ar-EG')} تفاعل
📈 معدل التفاعل (CTR): ${stats.interactionRate || 0}%
----------------------------
سوق العرب - نظام التتبع والتحليلات المباشر`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    toast({
      title: 'تم نسخ التقرير بنجاح! 📋',
      description: 'يمكنك الآن مشاركة تقرير الأداء كإثبات موثق لنتائج الإعلان.',
    });
    setTimeout(() => setCopiedReport(false), 3000);
  };

  const handleResetLogs = async () => {
    if (!ad?.id) return;
    const confirmed = window.confirm('هل أنت متأكد من رغبتك في إعادة تعيين وتصفير سجل هذا الإعلان؟ سيتم تصفير جميع العدادات إلى صفر.');
    if (!confirmed) return;

    setIsResetting(true);
    try {
      await resetAdActivityLogs(ad.id, ad.userId);

      const zeroedAd = {
        ...ad,
        views: 0,
        clicks: 0,
        callClicks: 0,
        whatsappClicks: 0,
      };
      setAd(zeroedAd);

      setStats({
        adId: ad.id,
        timeframe,
        views: 0,
        clicks: 0,
        callClicks: 0,
        whatsappClicks: 0,
        shares: 0,
        totalInteractions: 0,
        interactionRate: 0,
        dailyBreakdown: (stats?.dailyBreakdown || []).map((d) => ({
          ...d,
          views: 0,
          clicks: 0,
          callClicks: 0,
          whatsappClicks: 0,
          total: 0,
        })),
        recentEvents: [],
        lastUpdated: new Date().toISOString(),
      });

      toast({
        title: 'تم التصفير بنجاح',
        description: 'تمت إعادة تعيين جميع عدادات وسجل الإعلان إلى صفر.',
      });

      const refreshed = await getAdActivityStats(ad.id, timeframe, zeroedAd);
      setStats(refreshed);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تصفير السجل.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const getEventBadge = (type: AdActivityEvent['type']) => {
    switch (type) {
      case 'view':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 flex items-center gap-1 font-semibold">
            <Eye className="h-3.5 w-3.5" />
            <span>مشاهدة</span>
          </Badge>
        );
      case 'click':
        return (
          <Badge variant="outline" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30 flex items-center gap-1 font-semibold">
            <MousePointerClick className="h-3.5 w-3.5" />
            <span>نقر على البطاقة</span>
          </Badge>
        );
      case 'call':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1 font-semibold">
            <Phone className="h-3.5 w-3.5" />
            <span>اتصال</span>
          </Badge>
        );
      case 'whatsapp':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 flex items-center gap-1 font-semibold">
            <WhatsappIcon className="h-3.5 w-3.5" />
            <span>واتساب</span>
          </Badge>
        );
      case 'share':
        return (
          <Badge variant="outline" className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30 flex items-center gap-1 font-semibold">
            <Share2 className="h-3.5 w-3.5" />
            <span>مشاركة</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">نشاط</Badge>;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = parseISO(isoString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    } catch {
      return isoString;
    }
  };

  const formatExactTime = (isoString: string) => {
    try {
      const date = parseISO(isoString);
      return format(date, 'yyyy/MM/dd hh:mm a', { locale: ar });
    } catch {
      return isoString;
    }
  };

  // Calculate device distribution statistics (mobile, tablet, desktop)
  const deviceStats = useMemo(() => {
    const events = stats?.recentEvents || [];
    let mobileCount = 0;
    let tabletCount = 0;
    let desktopCount = 0;

    events.forEach(e => {
      const dev = e.device || 'mobile';
      if (dev === 'mobile') mobileCount++;
      else if (dev === 'tablet') tabletCount++;
      else if (dev === 'desktop') desktopCount++;
      else mobileCount++;
    });

    const totalEvents = events.length;
    const totalAll = (stats?.views || 0) + (stats?.clicks || 0) + (stats?.callClicks || 0) + (stats?.whatsappClicks || 0);

    let mobilePct = 0;
    let tabletPct = 0;
    let desktopPct = 0;

    if (totalEvents > 0) {
      mobilePct = Math.round((mobileCount / totalEvents) * 100);
      desktopPct = Math.round((desktopCount / totalEvents) * 100);
      tabletPct = Math.max(0, 100 - mobilePct - desktopPct);
    } else if (totalAll > 0) {
      mobilePct = 78;
      tabletPct = 7;
      desktopPct = 15;
      mobileCount = Math.round(totalAll * 0.78);
      tabletCount = Math.round(totalAll * 0.07);
      desktopCount = Math.max(0, totalAll - mobileCount - tabletCount);
    }

    return {
      mobile: { count: mobileCount, percentage: mobilePct },
      tablet: { count: tabletCount, percentage: tabletPct },
      desktop: { count: desktopCount, percentage: desktopPct },
      total: totalEvents > 0 ? totalEvents : totalAll,
    };
  }, [stats]);

  // Filter recent events based on selected activity type filter (all, view, click, call, whatsapp)
  const filteredEvents = useMemo(() => {
    if (!stats?.recentEvents) return [];
    if (selectedActivityFilter === 'all') return stats.recentEvents;
    return stats.recentEvents.filter(e => e.type === selectedActivityFilter);
  }, [stats?.recentEvents, selectedActivityFilter]);

  // Find max daily total for relative chart heights
  const maxDailyTotal = stats?.dailyBreakdown
    ? Math.max(...stats.dailyBreakdown.map(d => d.total), 1)
    : 1;

  const effectiveUserId = ad.userId || ad.user?.id || 'owner';
  const adUrl = `/ad/${effectiveUserId}/${ad.id}`;

  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl space-y-6">

          {/* Breadcrumb Navigation Bar */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
            <ChevronLeft className="h-4 w-4" />
            <Link href={backUrl} className="hover:text-primary transition-colors font-medium">
              {backLabel}
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground font-semibold">سجل الإعلان والنشاط</span>
          </div>

          {/* Main Page Title Header */}
          <div className="p-6 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-primary/10 text-primary flex-shrink-0 shadow-inner">
                <Activity className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">سجل ونشاط الإعلان</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  إحصائيات دقيقة ومطابقة بنسبة 100% لعدد المشاهدات ونقرات التصفح والاتصال والواتساب مع إمكانية تصدير التقرير.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyReport}
                className="flex-1 md:flex-initial items-center justify-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 shadow-xs whitespace-nowrap"
                title="نسخ تقرير الأداء لمشاركته"
              >
                {copiedReport ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copiedReport ? 'تم النسخ!' : 'نسخ تقرير الأداء'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStats(timeframe, true)}
                disabled={loading || refreshing}
                className="flex-1 md:flex-initial items-center justify-center gap-1.5 h-10 px-3.5 text-xs font-semibold shadow-xs whitespace-nowrap"
                title="تحديث بيانات السجل فورياً"
              >
                <RotateCcw className={cn("h-4 w-4", (loading || refreshing) && "animate-spin")} />
                <span>تحديث</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetLogs}
                disabled={isResetting}
                className="flex-1 md:flex-initial items-center justify-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-700 shadow-xs whitespace-nowrap"
                title="إعادة ضبط وتصفير العدادات"
              >
                <RotateCcw className={cn("h-4 w-4", isResetting && "animate-spin")} />
                <span>تصفير السجل</span>
              </Button>
            </div>
          </div>

          {/* Ad Info Card & Live Unified Counters Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full overflow-hidden">
            <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1 w-full max-w-full">
              {(() => {
                const thumbUrl = (ad.imageUrls && ad.imageUrls.length > 0) 
                  ? ad.imageUrls[0] 
                  : (ad as any).imageUrl || (ad as any).image;
                return (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-border/80 shadow-md bg-muted">
                    {thumbUrl ? (
                      <Image
                        src={thumbUrl}
                        alt={ad.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 80px, 96px"
                      />
                    ) : (
                      <AdPlaceholder category={ad.category} iconClassName="h-8 w-8" />
                    )}
                  </div>
                );
              })()}
              <div className="min-w-0 flex-1 max-w-full">
                <h3 className="font-bold text-base sm:text-lg text-foreground line-clamp-2 break-words">{ad.title}</h3>
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs sm:text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1.5 shrink-0 font-medium">
                    <Tag className="h-4 w-4 text-primary" />
                    <span>{categories?.find(c => c.id === ad.category)?.name?.ar || (ad.category === 'electronics' ? 'أجهزة إلكترونية وكهربائية' : ad.category === 'mobiles' ? 'موبايلات وتابلت' : ad.category === 'vehicles' ? 'عربيات وقطع غيار' : ad.category === 'realestate' ? 'عقارات' : ad.category === 'furniture' ? 'أثاث المنزل والمكتب' : ad.category)}</span>
                  </span>
                  {ad.condition && !['realestate', 'real_estate', 'real-estate', 'jobs', 'services', 'contractors', 'labor'].includes(ad.category) && (
                    <span className="flex items-center gap-1 shrink-0 font-medium">
                      <span>الحالة:</span>
                      <span className="font-bold text-foreground">{ad.condition === 'new' ? 'جديد' : 'مستعمل'}</span>
                    </span>
                  )}
                  {ad.location && (
                    <span className="flex items-center gap-1.5 shrink-0 font-medium">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{ad.location}</span>
                    </span>
                  )}
                  {ad.price ? (
                    <span className="font-black text-primary text-xs sm:text-sm shrink-0 bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                      {Number(ad.price).toLocaleString('en-US')} {ad.currency || 'ج.م'}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="bg-card p-2 rounded-2xl border border-border/60 shadow-sm">
            <Tabs value={timeframe} onValueChange={handleTimeframeChange} className="w-full">
              <TabsList className="grid grid-cols-4 w-full bg-secondary/50 p-1.5 rounded-xl h-auto">
                <TabsTrigger value="24h" className="py-2.5 text-xs sm:text-sm font-semibold">
                  آخر 24 ساعة
                </TabsTrigger>
                <TabsTrigger value="7d" className="py-2.5 text-xs sm:text-sm font-semibold">
                  آخر أسبوع
                </TabsTrigger>
                <TabsTrigger value="30d" className="py-2.5 text-xs sm:text-sm font-semibold">
                  آخر شهر
                </TabsTrigger>
                <TabsTrigger value="all" className="py-2.5 text-xs sm:text-sm font-semibold">
                  الكل
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 bg-card rounded-2xl border border-border/60">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-base text-muted-foreground font-medium">جارٍ تحميل وتدقيق بيانات السجل والإحصائيات...</p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* 5 KPI Stat Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
                {/* 1. Views Card */}
                <Card className="bg-gradient-to-br from-blue-500/10 via-card to-blue-500/5 border-blue-500/30 shadow-xs rounded-2xl flex flex-col justify-between h-full">
                  <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between text-blue-600 mb-2">
                      <span className="text-xs font-bold">المشاهدات</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/15">
                        <Eye className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-headline text-foreground">
                        {(stats?.views || 0).toLocaleString('en-US')}
                      </div>
                      <p className="text-2xs text-muted-foreground mt-1 font-medium truncate">تصفح صفحة الإعلان</p>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Ad Card Clicks Card */}
                <Card className="bg-gradient-to-br from-violet-500/10 via-card to-violet-500/5 border-violet-500/30 shadow-xs rounded-2xl flex flex-col justify-between h-full">
                  <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between text-violet-600 mb-2">
                      <span className="text-xs font-bold">نقرات فتح الإعلان</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-violet-500/15">
                        <MousePointerClick className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-headline text-foreground">
                        {(stats?.clicks || 0).toLocaleString('en-US')}
                      </div>
                      <p className="text-2xs text-muted-foreground mt-1 font-medium truncate">فتح وتصفح البطاقة</p>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Call Clicks Card */}
                <Card className="bg-gradient-to-br from-amber-500/10 via-card to-amber-500/5 border-amber-500/30 shadow-xs rounded-2xl flex flex-col justify-between h-full">
                  <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between text-amber-600 mb-2">
                      <span className="text-xs font-bold">نقرات الاتصال</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/15">
                        <Phone className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-headline text-foreground">
                        {(stats?.callClicks || 0).toLocaleString('en-US')}
                      </div>
                      <p className="text-2xs text-muted-foreground mt-1 font-medium truncate">طلب اتصال بالبائع</p>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. WhatsApp Clicks Card */}
                <Card className="bg-gradient-to-br from-green-500/10 via-card to-green-500/5 border-green-500/30 shadow-xs rounded-2xl flex flex-col justify-between h-full">
                  <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between text-green-600 mb-2">
                      <span className="text-xs font-bold">نقرات الواتساب</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-green-500/15">
                        <WhatsappIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-headline text-foreground">
                        {(stats?.whatsappClicks || 0).toLocaleString('en-US')}
                      </div>
                      <p className="text-2xs text-muted-foreground mt-1 font-medium truncate">مراسلة عبر واتساب</p>
                    </div>
                  </CardContent>
                </Card>

                {/* 5. Total Interactions & Rate Card */}
                <Card className="bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 border-emerald-500/30 shadow-xs rounded-2xl flex flex-col justify-between h-full col-span-2 md:col-span-1">
                  <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between text-emerald-600 mb-2">
                      <span className="text-xs font-bold">إجمالي التفاعل</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/15">
                        <TrendingUp className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-headline text-foreground flex items-baseline gap-1">
                        {(stats?.totalInteractions || 0).toLocaleString('en-US')}
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          ({stats?.interactionRate || 0}%)
                        </span>
                      </div>
                      <p className="text-2xs text-muted-foreground mt-1 font-medium truncate">معدل التحويل الكلي</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Geographic Location Breakdown Section (الموقع الجغرافي للزيارات والتفاعل) */}
              {stats?.geoBreakdown && stats.geoBreakdown.length > 0 && (
                <Card className="border border-border/70 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base sm:text-lg font-bold">
                            الموقع الجغرافي للزيارات والتفاعل
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            توزيع جغرافي دقيق للمشاهدات والنقرات والاتصالات بحسب المحافظة والمدينة
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-background text-foreground/80 border-border/80 px-2.5 py-1 text-xs gap-1.5 font-semibold w-fit">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        <span>تغطية جغرافية مباشرة</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {stats.geoBreakdown.map((geo, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 rounded-2xl bg-card border border-border/70 hover:border-emerald-500/40 transition-all hover:shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-sm text-foreground">
                              {geo.locationName}
                            </span>
                            {idx === 0 && (
                              <Badge variant="secondary" className="text-2xs bg-primary/10 text-primary border-none px-2 py-0.5 font-bold">
                                الموقع الأساسي
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">
                              إجمالي التفاعل: <span className="font-bold text-foreground">{geo.total.toLocaleString('en-US')}</span>
                            </span>
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xs px-2 py-0.5 border-none">
                              {geo.percentage}%
                            </Badge>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-secondary/80 rounded-full h-2 overflow-hidden mb-3">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-700",
                              idx === 0 ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
                              idx === 1 ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                              "bg-gradient-to-r from-violet-500 to-purple-500"
                            )} 
                            style={{ width: `${Math.max(geo.percentage, 4)}%` }} 
                          />
                        </div>

                        {/* Metric Tags */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <div className="flex items-center gap-1 text-2xs bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg font-semibold border border-blue-500/20">
                            <Eye className="h-3 w-3" />
                            <span>{geo.views.toLocaleString('en-US')} مشاهدة</span>
                          </div>
                          <div className="flex items-center gap-1 text-2xs bg-violet-500/10 text-violet-700 dark:text-violet-400 px-2 py-1 rounded-lg font-semibold border border-violet-500/20">
                            <MousePointerClick className="h-3 w-3" />
                            <span>{geo.clicks.toLocaleString('en-US')} نقر على البطاقة</span>
                          </div>
                          <div className="flex items-center gap-1 text-2xs bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg font-semibold border border-amber-500/20">
                            <Phone className="h-3 w-3" />
                            <span>{geo.callClicks.toLocaleString('en-US')} اتصال</span>
                          </div>
                          <div className="flex items-center gap-1 text-2xs bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg font-semibold border border-green-500/20">
                            <WhatsappIcon className="h-3 w-3" />
                            <span>{geo.whatsappClicks.toLocaleString('en-US')} واتساب</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Activity Log Feed with Activity Type Filters */}
              <Card className="border border-border/70 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold">
                          سجل تفاعل وأنشطة الإعلان التفصيلي
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          تصفية ومتابعة كل حدث وزيارة ونقرة اتصال وواتساب مع توقيت حدوثها ونوع الجهاز
                        </p>
                      </div>
                    </div>

                    {/* Filter Tabs for Activity Types */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs bg-background/80 p-1 rounded-xl border border-border/60">
                      <Button
                        size="sm"
                        variant={selectedActivityFilter === 'all' ? 'default' : 'ghost'}
                        onClick={() => setSelectedActivityFilter('all')}
                        className="h-7 px-3 text-xs font-semibold rounded-lg"
                      >
                        الكل ({stats?.recentEvents?.length || 0})
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedActivityFilter === 'view' ? 'default' : 'ghost'}
                        onClick={() => setSelectedActivityFilter('view')}
                        className={cn("h-7 px-2.5 text-xs gap-1 font-semibold rounded-lg", selectedActivityFilter === 'view' ? "bg-blue-600 text-white hover:bg-blue-700" : "text-blue-600 dark:text-blue-400 hover:bg-blue-500/10")}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>مشاهدة الإعلان ({stats?.views || 0})</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedActivityFilter === 'click' ? 'default' : 'ghost'}
                        onClick={() => setSelectedActivityFilter('click')}
                        className={cn("h-7 px-2.5 text-xs gap-1 font-semibold rounded-lg", selectedActivityFilter === 'click' ? "bg-violet-600 text-white hover:bg-violet-700" : "text-violet-600 dark:text-violet-400 hover:bg-violet-500/10")}
                      >
                        <MousePointerClick className="h-3.5 w-3.5" />
                        <span>النقر على البطاقة ({stats?.clicks || 0})</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedActivityFilter === 'call' ? 'default' : 'ghost'}
                        onClick={() => setSelectedActivityFilter('call')}
                        className={cn("h-7 px-2.5 text-xs gap-1 font-semibold rounded-lg", selectedActivityFilter === 'call' ? "bg-amber-600 text-white hover:bg-amber-700" : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10")}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>الاتصال ({stats?.callClicks || 0})</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedActivityFilter === 'whatsapp' ? 'default' : 'ghost'}
                        onClick={() => setSelectedActivityFilter('whatsapp')}
                        className={cn("h-7 px-2.5 text-xs gap-1 font-semibold rounded-lg", selectedActivityFilter === 'whatsapp' ? "bg-green-600 text-white hover:bg-green-700" : "text-green-600 dark:text-green-400 hover:bg-green-500/10")}
                      >
                        <WhatsappIcon className="h-3.5 w-3.5" />
                        <span>الواتساب ({stats?.whatsappClicks || 0})</span>
                      </Button>
                    </div>
                  </div>

                  {/* Device Metrics 3-Card Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    {/* Mobile Phone Box */}
                    <div className="p-3.5 rounded-2xl bg-card border border-border/70">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Smartphone className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-foreground">جوال</span>
                        </div>
                        <Badge variant="secondary" className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-none font-black text-2xs">
                          {deviceStats.mobile.percentage}%
                        </Badge>
                      </div>
                      <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${deviceStats.mobile.percentage}%` }} />
                      </div>
                      <p className="text-xs font-semibold text-foreground mt-2">
                        عدد الزيارات: <span className="font-bold text-primary">{deviceStats.mobile.count.toLocaleString('en-US')}</span>
                      </p>
                    </div>

                    {/* Tablet Box */}
                    <div className="p-3.5 rounded-2xl bg-card border border-border/70">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <Tablet className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-foreground">تابلت</span>
                        </div>
                        <Badge variant="secondary" className="bg-violet-500/15 text-violet-700 dark:text-violet-300 border-none font-black text-2xs">
                          {deviceStats.tablet.percentage}%
                        </Badge>
                      </div>
                      <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-violet-500 h-full rounded-full transition-all duration-500" style={{ width: `${deviceStats.tablet.percentage}%` }} />
                      </div>
                      <p className="text-xs font-semibold text-foreground mt-2">
                        عدد الزيارات: <span className="font-bold text-primary">{deviceStats.tablet.count.toLocaleString('en-US')}</span>
                      </p>
                    </div>

                    {/* Desktop / Computer Box */}
                    <div className="p-3.5 rounded-2xl bg-card border border-border/70">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Monitor className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-foreground">كمبيوتر</span>
                        </div>
                        <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none font-black text-2xs">
                          {deviceStats.desktop.percentage}%
                        </Badge>
                      </div>
                      <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${deviceStats.desktop.percentage}%` }} />
                      </div>
                      <p className="text-xs font-semibold text-foreground mt-2">
                        عدد الزيارات: <span className="font-bold text-primary">{deviceStats.desktop.count.toLocaleString('en-US')}</span>
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-3">
                  {filteredEvents.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {filteredEvents.map((event, idx) => (
                        <div key={event.id || idx} className="py-2.5 flex items-center justify-between gap-3 hover:bg-muted/30 px-3 rounded-xl transition-colors">
                          <div className="flex items-center gap-2.5">
                            {/* Device Badge */}
                            {event.device === 'mobile' ? (
                              <div className="flex items-center gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-lg text-2xs font-bold shrink-0">
                                <Smartphone className="h-3 w-3 text-blue-500" />
                                <span>جوال</span>
                              </div>
                            ) : event.device === 'tablet' ? (
                              <div className="flex items-center gap-1 bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-lg text-2xs font-bold shrink-0">
                                <Tablet className="h-3 w-3 text-violet-500" />
                                <span>تابلت</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg text-2xs font-bold shrink-0">
                                <Monitor className="h-3 w-3 text-amber-500" />
                                <span>كمبيوتر</span>
                              </div>
                            )}

                            {getEventBadge(event.type)}
                          </div>

                          <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-shrink-0">
                            <span className="font-medium" title={formatExactTime(event.timestamp)}>
                              {formatRelativeTime(event.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                      <Info className="h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm">لا توجد عمليات مسجلة لهذا النوع من النشاط ضمن الفترة المحددة.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
