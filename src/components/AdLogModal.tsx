'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  ShieldAlert,
  Info,
  MapPin
} from 'lucide-react';
import type { Ad, AdActivityStats, AdTimeframe, AdActivityEvent } from '@/lib/types';
import { getAdActivityStats, resetAdActivityLogs } from '@/lib/ad-log-service';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Whatsapp icon component
const WhatsappIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.022-.08-.115-.188-.417-.329-.3-.14-1.778-.877-2.037-.972-.26-.095-.448-.142-.642.148-.193.29-.749.972-.919 1.162-.17.19-.34.21-.641.07-.3-.14-1.272-.468-2.423-1.493-.895-.8-1.5-1.787-1.675-2.09-.175-.3-.018-.463.132-.613.136-.135.3-.35.45-.524.15-.175.2-.292.3-.487.1-.197.05-.369-.025-.51-.07-.14-.642-1.547-.882-2.128-.233-.564-.47-.488-.642-.496-.166-.008-.356-.01-.546-.01-.19 0-.5.07-.76.357-.26.29-1 .975-1 2.378 0 1.4 1.01 2.75 1.15 2.94.14.19 1.98 3.03 4.8 4.24.67.29 1.2.46 1.61.59.67.21 1.28.18 1.76.11.53-.08 1.63-.67 1.86-1.32.23-.65.23-1.2.16-1.32-.07-.12-.26-.19-.56-.33zM12.002 2c-5.523 0-10 4.477-10 10 0 1.778.463 3.507 1.345 5.032L2 22l5.132-1.347c1.472.8 3.12 1.222 4.87 1.222 5.523 0 10-4.477 10-10s-4.477-10-10-10z"/>
  </svg>
);

interface AdLogModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
  onStatsReset?: () => void;
}

export default function AdLogModal({ ad, isOpen, onClose, onStatsReset }: AdLogModalProps) {
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<AdTimeframe>('all');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<'all' | 'view' | 'click' | 'call' | 'whatsapp'>('all');
  const [stats, setStats] = useState<AdActivityStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const fetchStats = useCallback(async (selectedTf: AdTimeframe, isManualRefresh = false) => {
    if (!ad?.id) return;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAdActivityStats(ad.id, selectedTf, ad);
      setStats(data);
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
    if (isOpen && ad?.id) {
      fetchStats(timeframe);
    }
  }, [isOpen, ad?.id, timeframe, fetchStats]);

  const handleTimeframeChange = (val: string) => {
    const tf = val as AdTimeframe;
    setTimeframe(tf);
  };

  const handleResetLogs = async () => {
    if (!ad?.id) return;
    const confirmed = window.confirm('هل أنت متأكد من رغبتك في إعادة تعيين سجل وإحصائيات هذا الإعلان؟ سيتم تصفير العدادات نهائياً.');
    if (!confirmed) return;

    setIsResetting(true);
    try {
      await resetAdActivityLogs(ad.id, ad.userId);
      toast({
        title: 'تم التصفير',
        description: 'تم إعادة تعيين سجل الإعلان بنجاح.',
      });
      await fetchStats(timeframe);
      if (onStatsReset) onStatsReset();
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

  if (!ad) return null;

  const getEventBadge = (type: AdActivityEvent['type']) => {
    switch (type) {
      case 'view':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>مشاهدة</span>
          </Badge>
        );
      case 'click':
        return (
          <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20 flex items-center gap-1 font-semibold">
            <MousePointerClick className="h-3 w-3" />
            <span>نقر على الإعلان</span>
          </Badge>
        );
      case 'call':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1 font-semibold">
            <Phone className="h-3 w-3" />
            <span>اتصال بالبائع</span>
          </Badge>
        );
      case 'whatsapp':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1 font-semibold">
            <WhatsappIcon className="h-3 w-3" />
            <span>رسالة واتساب</span>
          </Badge>
        );
      case 'share':
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 flex items-center gap-1">
            <Share2 className="h-3 w-3" />
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

  // Find max daily total for relative chart heights
  const maxDailyTotal = stats?.dailyBreakdown
    ? Math.max(...stats.dailyBreakdown.map(d => d.total), 1)
    : 1;

  const effectiveUserId = ad.userId || ad.user?.id || 'owner';
  const adUrl = `/ad/${effectiveUserId}/${ad.id}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6" dir="rtl">
        {/* Header with Title "السجل" */}
        <DialogHeader className="text-right pb-3 border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">
                  سجل نشاط الإعلان
                  <Badge variant="secondary" className="font-normal text-xs px-2 py-0.5 bg-primary/10 text-primary">
                    مباشر
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  تفاصيل المشاهدات، نقرات التصفح، الاتصال، والواتساب بدقة وموثوقية عالية.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStats(timeframe, true)}
              disabled={loading || refreshing}
              className="flex items-center gap-1.5 text-xs ml-10 sm:ml-12"
              title="تحديث البيانات"
            >
              <RotateCcw className={cn("h-3.5 w-3.5", (loading || refreshing) && "animate-spin")} />
              <span className="hidden sm:inline">تحديث</span>
            </Button>
          </div>

          {/* Ad Summary Capsule */}
          <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {ad.imageUrls && ad.imageUrls.length > 0 ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-border/60">
                  <Image
                    src={ad.imageUrls[0]}
                    alt={ad.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/5 border border-border/60 flex items-center justify-center text-primary flex-shrink-0">
                  <BarChart3 className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-foreground truncate">{ad.title}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>{ad.category}</span>
                  {ad.price ? <span>• {Number(ad.price).toLocaleString('en-US')} {ad.currency || 'ج.م'}</span> : null}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold bg-background px-2 py-1 rounded-lg border">
                👁️ {(stats?.views || ad.views || 0).toLocaleString('en-US')} / 🖱️ {(stats?.clicks || ad.clicks || 0).toLocaleString('en-US')}
              </span>
              <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-primary gap-1 flex-shrink-0">
                <Link href={adUrl} target="_blank">
                  <span>عرض الإعلان</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Timeframe Filter Tabs */}
        <div className="py-2">
          <Tabs value={timeframe} onValueChange={handleTimeframeChange} className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger value="24h" className="text-xs sm:text-sm font-medium">
                آخر 24 ساعة
              </TabsTrigger>
              <TabsTrigger value="7d" className="text-xs sm:text-sm font-medium">
                آخر أسبوع
              </TabsTrigger>
              <TabsTrigger value="30d" className="text-xs sm:text-sm font-medium">
                آخر شهر
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm font-medium">
                كافة الأوقات
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">جارٍ تحميل بيانات السجل...</p>
          </div>
        ) : (
          <div className="space-y-6 pt-1">
            {/* KPI Stat Cards Grid (5 Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {/* Views Card */}
              <Card className="bg-gradient-to-br from-blue-500/10 via-background to-blue-500/5 border-blue-500/20 shadow-sm">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-blue-600 mb-2">
                    <span className="text-xs font-bold">المشاهدات</span>
                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-foreground">
                    {(stats?.views || 0).toLocaleString('en-US')}
                  </div>
                  <p className="text-2xs text-muted-foreground mt-1">تصفح الإعلان</p>
                </CardContent>
              </Card>

              {/* Ad Clicks Card */}
              <Card className="bg-gradient-to-br from-violet-500/10 via-background to-violet-500/5 border-violet-500/20 shadow-sm">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-violet-600 mb-2">
                    <span className="text-xs font-bold">نقرات الإعلان</span>
                    <div className="p-1.5 rounded-lg bg-violet-500/10">
                      <MousePointerClick className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-foreground">
                    {(stats?.clicks || 0).toLocaleString('en-US')}
                  </div>
                  <p className="text-2xs text-muted-foreground mt-1">فتح البطاقة</p>
                </CardContent>
              </Card>

              {/* Call Clicks Card */}
              <Card className="bg-gradient-to-br from-amber-500/10 via-background to-amber-500/5 border-amber-500/20 shadow-sm">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-amber-600 mb-2">
                    <span className="text-xs font-bold">نقرات الاتصال</span>
                    <div className="p-1.5 rounded-lg bg-amber-500/10">
                      <Phone className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-foreground">
                    {(stats?.callClicks || 0).toLocaleString('en-US')}
                  </div>
                  <p className="text-2xs text-muted-foreground mt-1">زر الهاتف</p>
                </CardContent>
              </Card>

              {/* WhatsApp Clicks Card */}
              <Card className="bg-gradient-to-br from-green-500/10 via-background to-green-500/5 border-green-500/20 shadow-sm">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-green-600 mb-2">
                    <span className="text-xs font-bold">نقرات الواتساب</span>
                    <div className="p-1.5 rounded-lg bg-green-500/10">
                      <WhatsappIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-foreground">
                    {(stats?.whatsappClicks || 0).toLocaleString('en-US')}
                  </div>
                  <p className="text-2xs text-muted-foreground mt-1">محادثة واتساب</p>
                </CardContent>
              </Card>

              {/* Total Interactions & Rate */}
              <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-emerald-500/5 border-emerald-500/20 shadow-sm col-span-2 sm:col-span-1">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-emerald-600 mb-2">
                    <span className="text-xs font-bold">التفاعل الإجمالي</span>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-foreground flex items-baseline gap-1">
                    {(stats?.totalInteractions || 0).toLocaleString('en-US')}
                    <span className="text-2xs font-semibold text-emerald-600">
                      ({stats?.interactionRate || 0}%)
                    </span>
                  </div>
                  <p className="text-2xs text-muted-foreground mt-1">معدل التحويل الكلي</p>
                </CardContent>
              </Card>
            </div>

            {/* Daily Timeline Breakdown Chart */}
            {/* Geographic Breakdown in Modal */}
            {stats?.geoBreakdown && stats.geoBreakdown.length > 0 && (
              <Card className="border border-border/60">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="font-bold text-sm text-foreground">الموقع الجغرافي للزيارات والتفاعل</h4>
                    </div>
                    <Badge variant="outline" className="text-3xs bg-background">
                      تغطية مباشرة
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {stats.geoBreakdown.map((geo, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="font-bold text-foreground">{geo.locationName}</span>
                          </div>
                          <Badge className="bg-emerald-600 text-white font-bold text-3xs px-1.5 py-0.5">
                            {geo.percentage}%
                          </Badge>
                        </div>
                        <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden mb-2">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.max(geo.percentage, 5)}%` }} 
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-3xs text-muted-foreground">
                          <span>👁️ {geo.views} مشاهدة</span>
                          <span>•</span>
                          <span>🖱️ {geo.clicks} نقرة بطاقة</span>
                          <span>•</span>
                          <span>📞 {geo.callClicks} اتصال</span>
                          <span>•</span>
                          <span>💬 {geo.whatsappClicks} واتساب</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity Log Feed */}
            <Card className="border border-border/60">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h4 className="font-bold text-sm text-foreground">سجل الأحداث الزمني</h4>
                  </div>
                  
                  {/* Filter Tabs for Activity Types */}
                  <div className="flex flex-wrap items-center gap-1 text-2xs bg-secondary/60 p-1 rounded-lg">
                    <Button
                      size="sm"
                      variant={selectedActivityFilter === 'all' ? 'default' : 'ghost'}
                      onClick={() => setSelectedActivityFilter('all')}
                      className="h-6 px-2 text-2xs font-semibold rounded-md"
                    >
                      الكل
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedActivityFilter === 'view' ? 'default' : 'ghost'}
                      onClick={() => setSelectedActivityFilter('view')}
                      className={cn("h-6 px-2 text-2xs gap-0.5 font-semibold rounded-md", selectedActivityFilter === 'view' ? "bg-blue-600 text-white" : "text-blue-600 dark:text-blue-400")}
                    >
                      <Eye className="h-3 w-3" />
                      <span>مشاهدات</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedActivityFilter === 'click' ? 'default' : 'ghost'}
                      onClick={() => setSelectedActivityFilter('click')}
                      className={cn("h-6 px-2 text-2xs gap-0.5 font-semibold rounded-md", selectedActivityFilter === 'click' ? "bg-violet-600 text-white" : "text-violet-600 dark:text-violet-400")}
                    >
                      <MousePointerClick className="h-3 w-3" />
                      <span>نقرات</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedActivityFilter === 'call' ? 'default' : 'ghost'}
                      onClick={() => setSelectedActivityFilter('call')}
                      className={cn("h-6 px-2 text-2xs gap-0.5 font-semibold rounded-md", selectedActivityFilter === 'call' ? "bg-amber-600 text-white" : "text-amber-600 dark:text-amber-400")}
                    >
                      <Phone className="h-3 w-3" />
                      <span>اتصال</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedActivityFilter === 'whatsapp' ? 'default' : 'ghost'}
                      onClick={() => setSelectedActivityFilter('whatsapp')}
                      className={cn("h-6 px-2 text-2xs gap-0.5 font-semibold rounded-md", selectedActivityFilter === 'whatsapp' ? "bg-green-600 text-white" : "text-green-600 dark:text-green-400")}
                    >
                      <WhatsappIcon className="h-3 w-3" />
                      <span>واتساب</span>
                    </Button>
                  </div>
                </div>

                {(() => {
                  const events = (stats?.recentEvents || []).filter(e => selectedActivityFilter === 'all' || e.type === selectedActivityFilter);
                  return events.length > 0 ? (
                    <div className="divide-y divide-border/40 max-h-56 overflow-y-auto pr-1">
                      {events.map((event, idx) => (
                        <div key={event.id || idx} className="py-2.5 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-lg transition-colors">
                          <div className="flex items-center gap-2.5">
                            {getEventBadge(event.type)}
                            <span className="text-xs text-muted-foreground">
                              {event.type === 'view' && 'زيارة لصفحة الإعلان'}
                              {event.type === 'click' && 'نقر على بطاقة الإعلان'}
                              {event.type === 'call' && 'ضغط على زر اتصل بالبائع'}
                              {event.type === 'whatsapp' && 'ضغط على زر المراسلة بالواتساب'}
                              {event.type === 'share' && 'مشاركة رابط الإعلان'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-2xs text-muted-foreground flex-shrink-0">
                            {event.device === 'mobile' ? (
                              <span className="flex items-center gap-0.5" title="هاتف محمول">
                                <Smartphone className="h-3 w-3" />
                                <span>جوال</span>
                              </span>
                            ) : event.device === 'tablet' ? (
                              <span className="flex items-center gap-0.5" title="جهاز لوحي">
                                <Tablet className="h-3 w-3" />
                                <span>تابلت</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5" title="كمبيوتر">
                                <Monitor className="h-3 w-3" />
                                <span>كمبيوتر</span>
                              </span>
                            )}
                            <span>•</span>
                            <span>{formatRelativeTime(event.timestamp)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                      <Info className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-xs">لا توجد سجلات مطابقة لنوع النشاط المحدد خلال هذه الفترة.</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetLogs}
                disabled={isResetting}
                className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:text-amber-700 h-8 text-xs"
              >
                <RotateCcw className={cn("h-3 w-3 mr-1", isResetting && "animate-spin")} />
                <span>إعادة تعيين وتصفير السجل</span>
              </Button>

              <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
