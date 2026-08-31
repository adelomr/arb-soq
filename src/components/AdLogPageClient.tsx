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
  ExternalLink,
  ArrowRight,
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

const Header = dynamic(() => import('@/components/Header'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

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
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [stats, setStats] = useState<AdActivityStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // تحديد ما إذا كان المستخدم قادماً من مراجعة الإعلانات في لوحة تحكم المسؤول
  const isFromAdmin = searchParams.get('from') === 'admin' || userProfile?.role === 'admin';
  const backUrl = isFromAdmin ? '/admin?tab=ads' : '/dashboard';
  const backLabel = isFromAdmin ? 'مراجعة الإعلانات' : 'لوحة التحكم';

  const fetchStats = useCallback(async (selectedTf: AdTimeframe, isManualRefresh = false) => {
    if (!ad?.id) return;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAdActivityStats(ad.id, selectedTf, ad);
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
  }, [ad, toast]);

  useEffect(() => {
    if (ad?.id) {
      fetchStats(timeframe);
    }
  }, [ad?.id, timeframe, fetchStats]);

  const handleTimeframeChange = (val: string) => {
    const tf = val as AdTimeframe;
    setTimeframe(tf);
  };

  const handleCopyReport = () => {
    if (!stats || !ad) return;

    const reportText = `📊 تقرير نشاط وأداء الإعلان الموثق
العنوان: ${ad.title}
معرف الإعلان: ${ad.id}
الفترة الزمنية: ${timeframe === 'all' ? 'كافة الأوقات' : timeframe === '30d' ? 'آخر 30 يوماً' : timeframe === '7d' ? 'آخر أسبوع' : 'آخر 24 ساعة'}
----------------------------
👁️ إجمالي المشاهدات: ${(stats.views || 0).toLocaleString('ar-EG')} مشاهدة
🖱️ نقرات فتح الإعلان: ${(stats.clicks || 0).toLocaleString('ar-EG')} نقرة
📞 نقرات الاتصال بالبائع: ${(stats.callClicks || 0).toLocaleString('ar-EG')} اتصال
💬 نقرات الواتساب والمراسلة: ${(stats.whatsappClicks || 0).toLocaleString('ar-EG')} مراسلة
⚡ إجمالي النقرات والتفاعل: ${(stats.totalInteractions || 0).toLocaleString('ar-EG')} تفاعل
📈 معدل التحويل والتفاعل (CTR): ${stats.interactionRate || 0}%
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
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>مشاهدة صفحة الإعلان</span>
          </Badge>
        );
      case 'click':
        return (
          <Badge variant="outline" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30 flex items-center gap-1 font-semibold">
            <MousePointerClick className="h-3 w-3" />
            <span>نقر على بطاقة الإعلان</span>
          </Badge>
        );
      case 'call':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1 font-semibold">
            <Phone className="h-3 w-3" />
            <span>اتصال هاتفي بالبائع</span>
          </Badge>
        );
      case 'whatsapp':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 flex items-center gap-1 font-semibold">
            <WhatsappIcon className="h-3 w-3" />
            <span>مراسلة عبر واتساب</span>
          </Badge>
        );
      case 'share':
        return (
          <Badge variant="outline" className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30 flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            <span>مشاركة رابط الإعلان</span>
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

  // Filter recent events based on selected type filter
  const filteredEvents = useMemo(() => {
    if (!stats?.recentEvents) return [];
    if (selectedTypeFilter === 'all') return stats.recentEvents;
    return stats.recentEvents.filter(e => e.type === selectedTypeFilter);
  }, [stats?.recentEvents, selectedTypeFilter]);

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

          {/* Breadcrumb & Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
              <ChevronLeft className="h-4 w-4" />
              <Link href={backUrl} className="hover:text-primary transition-colors font-medium">
                {backLabel}
              </Link>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-foreground font-semibold">سجل الإعلان والنشاط</span>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <Link href={backUrl}>
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>الرجوع إلى {backLabel}</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <Link href={adUrl} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>عرض صفحة الإعلان</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Main Page Title Header */}
          <div className="p-6 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-primary/10 text-primary flex-shrink-0 shadow-inner">
                <Activity className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">سجل ونشاط الإعلان</h1>
                  <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    نظام التتبع المباشر
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  إحصائيات دقيقة ومطابقة بنسبة 100% لعدد المشاهدات ونقرات التصفح والاتصال والواتساب مع إمكانية تصدير التقرير.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyReport}
                className="flex-1 md:flex-initial items-center justify-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10"
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
                className="flex-1 md:flex-initial items-center justify-center gap-1.5 h-10 px-3.5 text-xs"
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
                className="flex-1 md:flex-initial items-center justify-center gap-1.5 h-10 px-3.5 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-700"
                title="إعادة ضبط وتصفير العدادات"
              >
                <RotateCcw className={cn("h-4 w-4", isResetting && "animate-spin")} />
                <span>تصفير السجل</span>
              </Button>

              <Button asChild variant="default" size="sm" className="flex-1 md:flex-initial h-10 px-4 gap-1.5 text-xs font-bold">
                <Link href={adUrl} target="_blank">
                  <span>مشاهدة الإعلان</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Ad Info Card & Live Unified Counters Bar */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {ad.imageUrls && ad.imageUrls.length > 0 ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border/60 shadow-sm">
                  <Image
                    src={ad.imageUrls[0]}
                    alt={ad.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/5 border border-border/60 flex items-center justify-center text-primary flex-shrink-0">
                  <BarChart3 className="h-8 w-8" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-base text-foreground truncate">{ad.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    {categories?.find(c => c.id === ad.category)?.name?.ar || (ad.category === 'electronics' ? 'أجهزة إلكترونية وكهربائية' : ad.category === 'mobiles' ? 'موبايلات وتابلت' : ad.category === 'vehicles' ? 'عربيات وقطع غيار' : ad.category === 'realestate' ? 'عقارات' : ad.category === 'furniture' ? 'أثاث المنزل والمكتب' : ad.category)}
                  </span>
                  {ad.condition && (
                    <span className="flex items-center gap-1">
                      <span>الحالة:</span>
                      <span className="font-semibold text-foreground">{ad.condition === 'new' ? 'جديد' : 'مستعمل'}</span>
                    </span>
                  )}
                  {ad.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {ad.location}
                    </span>
                  )}
                  {ad.price ? (
                    <span className="font-bold text-primary">
                      {Number(ad.price).toLocaleString('en-US')} {ad.currency || 'ج.م'}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Quick Live Summary Badge */}
            <div className="flex items-center gap-2 bg-background/80 border border-border/80 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs">
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400" title="المشاهدات المعتمدة">
                <Eye className="h-4 w-4" />
                <span>{(stats?.views || ad.views || 0).toLocaleString('en-US')} مشاهدة</span>
              </span>
              <span className="text-border font-normal">/</span>
              <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400" title="النقرات المعتمدة">
                <MousePointerClick className="h-4 w-4" />
                <span>{(stats?.clicks || ad.clicks || 0).toLocaleString('en-US')} نقرة</span>
              </span>
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
                  الكل (كافة الأوقات)
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

              {/* KPI Stat Cards Grid (5 Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Views Card */}
                <Card className="bg-gradient-to-br from-blue-500/10 via-card to-blue-500/5 border-blue-500/30 shadow-xs">
                  <CardContent className="p-4.5">
                    <div className="flex items-center justify-between text-blue-600 mb-2.5">
                      <span className="text-xs font-bold">المشاهدات</span>
                      <div className="p-2 rounded-xl bg-blue-500/15">
                        <Eye className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-foreground">
                      {(stats?.views || 0).toLocaleString('en-US')}
                    </div>
                    <p className="text-2xs text-muted-foreground mt-1">تصفح صفحة الإعلان</p>
                  </CardContent>
                </Card>

                {/* Ad Clicks Card */}
                <Card className="bg-gradient-to-br from-violet-500/10 via-card to-violet-500/5 border-violet-500/30 shadow-xs">
                  <CardContent className="p-4.5">
                    <div className="flex items-center justify-between text-violet-600 mb-2.5">
                      <span className="text-xs font-bold">نقرات فتح الإعلان</span>
                      <div className="p-2 rounded-xl bg-violet-500/15">
                        <MousePointerClick className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-foreground">
                      {(stats?.clicks || 0).toLocaleString('en-US')}
                    </div>
                    <p className="text-2xs text-muted-foreground mt-1">الضغط على بطاقة الإعلان</p>
                  </CardContent>
                </Card>

                {/* Call Clicks Card */}
                <Card className="bg-gradient-to-br from-amber-500/10 via-card to-amber-500/5 border-amber-500/30 shadow-xs">
                  <CardContent className="p-4.5">
                    <div className="flex items-center justify-between text-amber-600 mb-2.5">
                      <span className="text-xs font-bold">نقرات الاتصال</span>
                      <div className="p-2 rounded-xl bg-amber-500/15">
                        <Phone className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-foreground">
                      {(stats?.callClicks || 0).toLocaleString('en-US')}
                    </div>
                    <p className="text-2xs text-muted-foreground mt-1">الضغط على زر اتصل بالبائع</p>
                  </CardContent>
                </Card>

                {/* WhatsApp Clicks Card */}
                <Card className="bg-gradient-to-br from-green-500/10 via-card to-green-500/5 border-green-500/30 shadow-xs">
                  <CardContent className="p-4.5">
                    <div className="flex items-center justify-between text-green-600 mb-2.5">
                      <span className="text-xs font-bold">نقرات الواتساب</span>
                      <div className="p-2 rounded-xl bg-green-500/15">
                        <WhatsappIcon className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-foreground">
                      {(stats?.whatsappClicks || 0).toLocaleString('en-US')}
                    </div>
                    <p className="text-2xs text-muted-foreground mt-1">المراسلة الفورية عبر واتساب</p>
                  </CardContent>
                </Card>

                {/* Total Interactions & Rate Card */}
                <Card className="bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 border-emerald-500/30 shadow-xs sm:col-span-2 lg:col-span-1">
                  <CardContent className="p-4.5">
                    <div className="flex items-center justify-between text-emerald-600 mb-2.5">
                      <span className="text-xs font-bold">إجمالي التفاعل (CTR)</span>
                      <div className="p-2 rounded-xl bg-emerald-500/15">
                        <TrendingUp className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-foreground flex items-baseline gap-1.5">
                      {(stats?.totalInteractions || 0).toLocaleString('en-US')}
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        ({stats?.interactionRate || 0}%)
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-2xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <Sparkles className="h-3 w-3" />
                      <span>{Number(stats?.interactionRate || 0) > 5 ? 'أداء ممتاز وجذاب 🔥' : 'إعلان نشط ومتفاعل'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Timeline Breakdown Chart */}
              {stats?.dailyBreakdown && stats.dailyBreakdown.length > 0 && (
                <Card className="border border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        التوزيع الزمني الدقيق للنشاط والتفاعل
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
                          مشاهدات
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-violet-500 inline-block" />
                          نقرات فتح
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                          اتصال
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
                          واتساب
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-2">
                    <div className="flex items-end justify-between gap-1 sm:gap-3 h-48 pt-6 px-2 border-b border-border/40 overflow-x-auto">
                      {stats.dailyBreakdown.map((point, idx) => {
                        const totalBarHeight = maxDailyTotal > 0 ? (point.total / maxDailyTotal) * 100 : 0;
                        const heightPercent = Math.max(totalBarHeight, point.total > 0 ? 14 : 4);
                        
                        return (
                          <div key={idx} className="flex-1 min-w-[34px] max-w-[64px] flex flex-col items-center gap-1.5 group relative">
                            {/* Tooltip on Hover */}
                            <div className="absolute -top-16 z-30 hidden group-hover:flex flex-col items-center bg-popover text-popover-foreground border shadow-xl px-3 py-1.5 rounded-lg text-xs whitespace-nowrap pointer-events-none">
                              <span className="font-bold text-foreground">{point.formattedDate}</span>
                              <span className="text-2xs text-muted-foreground mt-0.5">
                                مشاهدات: {point.views} | نقرات: {point.clicks} | اتصال: {point.callClicks} | واتساب: {point.whatsappClicks}
                              </span>
                            </div>

                            {/* Stacked Bar */}
                            <div 
                              className="w-full rounded-t-lg bg-secondary/70 flex flex-col-reverse overflow-hidden transition-all duration-300 group-hover:brightness-110 group-hover:scale-y-105"
                              style={{ height: `${heightPercent}%` }}
                            >
                              {point.views > 0 && (
                                <div 
                                  style={{ height: `${(point.views / Math.max(point.total, 1)) * 100}%` }} 
                                  className="bg-blue-500 w-full"
                                />
                              )}
                              {point.clicks > 0 && (
                                <div 
                                  style={{ height: `${(point.clicks / Math.max(point.total, 1)) * 100}%` }} 
                                  className="bg-violet-500 w-full"
                                />
                              )}
                              {point.callClicks > 0 && (
                                <div 
                                  style={{ height: `${(point.callClicks / Math.max(point.total, 1)) * 100}%` }} 
                                  className="bg-amber-500 w-full"
                                />
                              )}
                              {point.whatsappClicks > 0 && (
                                <div 
                                  style={{ height: `${(point.whatsappClicks / Math.max(point.total, 1)) * 100}%` }} 
                                  className="bg-green-500 w-full"
                                />
                              )}
                            </div>

                            {/* Day Label */}
                            <span className="text-2xs text-muted-foreground truncate w-full text-center group-hover:text-foreground group-hover:font-bold">
                              {point.formattedDate.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity Log Feed with Filters */}
              <Card className="border border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base sm:text-lg font-bold">
                        سجل الأحداث المباشر والعمليات المسجلة
                      </CardTitle>
                      <Badge variant="outline" className="text-2xs font-normal">
                        {filteredEvents.length} حدث
                      </Badge>
                    </div>

                    {/* Filter Tabs for Event Types */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <Button
                        size="sm"
                        variant={selectedTypeFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setSelectedTypeFilter('all')}
                        className="h-7 px-2.5 text-xs"
                      >
                        الكل
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedTypeFilter === 'view' ? 'default' : 'outline'}
                        onClick={() => setSelectedTypeFilter('view')}
                        className="h-7 px-2.5 text-xs text-blue-600 dark:text-blue-400"
                      >
                        مشاهدات
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedTypeFilter === 'click' ? 'default' : 'outline'}
                        onClick={() => setSelectedTypeFilter('click')}
                        className="h-7 px-2.5 text-xs text-violet-600 dark:text-violet-400"
                      >
                        نقرات فتح
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedTypeFilter === 'call' ? 'default' : 'outline'}
                        onClick={() => setSelectedTypeFilter('call')}
                        className="h-7 px-2.5 text-xs text-amber-600 dark:text-amber-400"
                      >
                        اتصال
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedTypeFilter === 'whatsapp' ? 'default' : 'outline'}
                        onClick={() => setSelectedTypeFilter('whatsapp')}
                        className="h-7 px-2.5 text-xs text-green-600 dark:text-green-400"
                      >
                        واتساب
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  {filteredEvents.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {filteredEvents.map((event, idx) => (
                        <div key={event.id || idx} className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 px-3 rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                            {getEventBadge(event.type)}
                            <span className="text-xs sm:text-sm text-foreground/80 font-medium hidden sm:inline">
                              {event.type === 'view' && 'زيارة وتصفح صفحة الإعلان'}
                              {event.type === 'click' && 'نقر على بطاقة الإعلان في القائمة'}
                              {event.type === 'call' && 'طلب اتصال مباشر بالبائع'}
                              {event.type === 'whatsapp' && 'فتح محادثة واتساب مع البائع'}
                              {event.type === 'share' && 'مشاركة رابط الإعلان'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-shrink-0">
                            {event.device === 'mobile' ? (
                              <span className="flex items-center gap-1 bg-secondary/70 px-2 py-0.5 rounded text-2xs font-medium" title="هاتف جوال">
                                <Smartphone className="h-3 w-3 text-primary" />
                                <span>جوال</span>
                              </span>
                            ) : event.device === 'tablet' ? (
                              <span className="flex items-center gap-1 bg-secondary/70 px-2 py-0.5 rounded text-2xs font-medium" title="جهاز لوحي">
                                <Tablet className="h-3 w-3 text-primary" />
                                <span>تابلت</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 bg-secondary/70 px-2 py-0.5 rounded text-2xs font-medium" title="جهاز كمبيوتر">
                                <Monitor className="h-3 w-3 text-primary" />
                                <span>كمبيوتر</span>
                              </span>
                            )}
                            <span>•</span>
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
                      <p className="text-sm">لا توجد سجلات نشاط مسجلة ضمن الفلتر والفترة المحددة.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
