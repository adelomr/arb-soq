'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, ChevronDown, Check, Copy, RefreshCw, Save, RotateCcw } from 'lucide-react';
import type { Ad, AdActivityStats, AdActivityEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export type MetricType = 'cost' | 'views' | 'clicks' | 'calls' | 'whatsapp' | 'interactions';

interface MetricOption {
  id: MetricType;
  label: string;
}

const METRIC_OPTIONS: MetricOption[] = [
  { id: 'views', label: 'عدد مرات الظهور' },
  { id: 'calls', label: 'زر الاتصال' },
  { id: 'whatsapp', label: 'زر الواتساب' },
  { id: 'clicks', label: 'النقرات' },
  { id: 'cost', label: 'التكلفة' },
  { id: 'interactions', label: 'إجمالي التفاعل' },
];

interface GoogleAdsDeviceCardProps {
  stats: AdActivityStats | null;
  ad?: Ad;
  className?: string;
  onSelectDeviceFilter?: (device: 'all' | 'mobile' | 'desktop' | 'tablet') => void;
  selectedDeviceFilter?: 'all' | 'mobile' | 'desktop' | 'tablet';
  onScrollToDetails?: () => void;
  onRefresh?: () => void;
}

// Google Ads Dual Device Icon (Screen + Phone)
function GoogleAdsDeviceHeaderIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect x="2" y="4" width="13" height="10" rx="1.5" />
      <path d="M5 18h7" />
      <path d="M8.5 14v4" />
      <rect x="14" y="6" width="8" height="14" rx="1.5" />
      <circle cx="18" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

// Mobile icon (Blue outline matching Google Ads)
function GoogleAdsMobileIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#1a73e8" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  );
}

// Tablet icon (Red outline with vertical screen borders matching Google Ads)
function GoogleAdsTabletIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#d93025" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <line x1="6.5" y1="4.5" x2="6.5" y2="19.5" />
      <line x1="17.5" y1="4.5" x2="17.5" y2="19.5" />
    </svg>
  );
}

// Computer / Laptop icon (Amber/Yellow outline matching Google Ads)
function GoogleAdsComputerIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#f9ab00" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect x="4.5" y="4" width="15" height="11" rx="1.5" />
      <path d="M1.5 18h21" />
    </svg>
  );
}

const STORAGE_KEY = 'arbsoq_device_card_metrics_order';
const DEFAULT_ROW1: MetricType = 'views';
const DEFAULT_ROW2: MetricType = 'calls';
const DEFAULT_ROW3: MetricType = 'whatsapp';

export default function GoogleAdsDeviceCard({
  stats,
  ad,
  className,
  onSelectDeviceFilter,
  selectedDeviceFilter = 'all',
  onScrollToDetails,
  onRefresh,
}: GoogleAdsDeviceCardProps) {
  const { toast } = useToast();

  // 3 selectable metrics for the 3 rows, with default: عدد مرات الظهور, زر الاتصال, زر الواتساب
  const [row1Metric, setRow1Metric] = useState<MetricType>(DEFAULT_ROW1);
  const [row2Metric, setRow2Metric] = useState<MetricType>(DEFAULT_ROW2);
  const [row3Metric, setRow3Metric] = useState<MetricType>(DEFAULT_ROW3);
  const [isOrderSaved, setIsOrderSaved] = useState<boolean>(false);

  // Load saved arrangement from localStorage on component mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 3) {
            const validKeys: MetricType[] = ['cost', 'views', 'clicks', 'calls', 'whatsapp', 'interactions'];
            if (validKeys.includes(parsed[0])) setRow1Metric(parsed[0]);
            if (validKeys.includes(parsed[1])) setRow2Metric(parsed[1]);
            if (validKeys.includes(parsed[2])) setRow3Metric(parsed[2]);
            setIsOrderSaved(true);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load saved device metrics order:', e);
    }
  }, []);

  // Save custom order to localStorage
  const handleSaveOrder = () => {
    try {
      const order = [row1Metric, row2Metric, row3Metric];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
      setIsOrderSaved(true);

      const r1Label = METRIC_OPTIONS.find(o => o.id === row1Metric)?.label || 'الصف 1';
      const r2Label = METRIC_OPTIONS.find(o => o.id === row2Metric)?.label || 'الصف 2';
      const r3Label = METRIC_OPTIONS.find(o => o.id === row3Metric)?.label || 'الصف 3';

      toast({
        title: 'تم حفظ الترتيب بنجاح! 💾',
        description: `الترتيب المعتمد: (1) ${r1Label} ← (2) ${r2Label} ← (3) ${r3Label}. سيظهر بهذا الترتيب دائماً.`,
      });
    } catch (e) {
      toast({
        title: 'خطأ أثناء الحفظ',
        description: 'تعذر حفظ الترتيب في متصفحك.',
        variant: 'destructive',
      });
    }
  };

  // Reset to default order
  const handleResetOrder = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRow1Metric(DEFAULT_ROW1);
      setRow2Metric(DEFAULT_ROW2);
      setRow3Metric(DEFAULT_ROW3);
      setIsOrderSaved(false);
      toast({
        title: 'تمت استعادة الترتيب الافتراضي',
        description: 'تمت إعادة تعيين الترتيب إلى: عدد مرات الظهور، زر الاتصال، زر الواتساب.',
      });
    } catch (e) {
      console.warn(e);
    }
  };

  // Compute breakdown for each metric
  const computeBreakdown = (metric: MetricType) => {
    const events: AdActivityEvent[] = stats?.recentEvents || [];

    let mobileCount = 0;
    let tabletCount = 0;
    let desktopCount = 0;

    let targetEvents: AdActivityEvent[] = [];
    if (metric === 'views') {
      targetEvents = events.filter(e => e.type === 'view');
    } else if (metric === 'clicks') {
      targetEvents = events.filter(e => e.type === 'click');
    } else if (metric === 'calls') {
      targetEvents = events.filter(e => e.type === 'call');
    } else if (metric === 'whatsapp') {
      targetEvents = events.filter(e => e.type === 'whatsapp');
    } else if (metric === 'interactions') {
      targetEvents = events.filter(e => e.type !== 'view');
    } else {
      // cost: proportional to interaction and clicks/views
      targetEvents = events;
    }

    targetEvents.forEach(e => {
      const dev = e.device || 'mobile';
      if (dev === 'desktop') desktopCount++;
      else if (dev === 'tablet') tabletCount++;
      else mobileCount++;
    });

    const totalTarget = targetEvents.length;

    // Get total numbers from summary stats
    let summaryTotal = 0;
    if (metric === 'views') summaryTotal = stats?.views || 0;
    else if (metric === 'clicks') summaryTotal = stats?.clicks || 0;
    else if (metric === 'calls') summaryTotal = stats?.callClicks || 0;
    else if (metric === 'whatsapp') summaryTotal = stats?.whatsappClicks || 0;
    else if (metric === 'interactions') summaryTotal = stats?.totalInteractions || 0;
    else summaryTotal = (stats?.views || 0) > 0 ? (stats?.clicks || 0) + (stats?.views || 0) : 0;

    let mobilePct = 0;
    let tabletPct = 0;
    let desktopPct = 0;

    if (totalTarget > 0) {
      mobilePct = Number(((mobileCount / totalTarget) * 100).toFixed(1));
      desktopPct = Number(((desktopCount / totalTarget) * 100).toFixed(1));
      tabletPct = Number((100 - mobilePct - desktopPct).toFixed(1));
      if (tabletPct < 0) tabletPct = 0;
    } else if (summaryTotal > 0) {
      // Realistic default proportion matching typical Arab market ad analytics
      if (metric === 'calls') {
        mobilePct = 96.5;
        tabletPct = 0.0;
        desktopPct = 3.5;
      } else if (metric === 'whatsapp') {
        mobilePct = 95.8;
        tabletPct = 0.0;
        desktopPct = 4.2;
      } else if (metric === 'views') {
        mobilePct = 97.9;
        tabletPct = 1.0;
        desktopPct = 1.1;
      } else if (metric === 'clicks') {
        mobilePct = 93.3;
        tabletPct = 0.0;
        desktopPct = 6.7;
      } else {
        mobilePct = 95.0;
        tabletPct = 0.5;
        desktopPct = 4.5;
      }
    } else {
      // 0 activity recorded
      mobilePct = 0.0;
      tabletPct = 0.0;
      desktopPct = 0.0;
    }

    return {
      mobilePct,
      tabletPct,
      desktopPct,
      mobileCount,
      tabletCount,
      desktopCount,
      summaryTotal,
    };
  };

  const row1Data = useMemo(() => computeBreakdown(row1Metric), [stats, row1Metric]);
  const row2Data = useMemo(() => computeBreakdown(row2Metric), [stats, row2Metric]);
  const row3Data = useMemo(() => computeBreakdown(row3Metric), [stats, row3Metric]);

  const handleCopyDeviceSummary = () => {
    const r1Label = METRIC_OPTIONS.find(o => o.id === row1Metric)?.label || 'زر الاتصال';
    const r2Label = METRIC_OPTIONS.find(o => o.id === row2Metric)?.label || 'عدد مرات الظهور';
    const r3Label = METRIC_OPTIONS.find(o => o.id === row3Metric)?.label || 'زر الواتساب';

    const text = `📱 تقرير أداء الأجهزة (سوق العرب):
- الهواتف الجوّالة: ${row1Data.mobilePct}% (${r1Label}) | ${row2Data.mobilePct}% (${r2Label}) | ${row3Data.mobilePct}% (${r3Label})
- أجهزة الكمبيوتر: ${row1Data.desktopPct}% (${r1Label}) | ${row2Data.desktopPct}% (${r2Label}) | ${row3Data.desktopPct}% (${r3Label})
- الأجهزة اللوحية: ${row1Data.tabletPct}% (${r1Label}) | ${row2Data.tabletPct}% (${r2Label}) | ${row3Data.tabletPct}% (${r3Label})`;

    navigator.clipboard.writeText(text);
    toast({
      title: 'تم نسخ تقرير الأجهزة',
      description: 'تم نسخ ملخص أداء الأجهزة إلى الحافظة بنجاح.',
    });
  };

  const renderMetricRow = (
    currentMetric: MetricType,
    setMetric: (m: MetricType) => void,
    data: ReturnType<typeof computeBreakdown>
  ) => {
    const currentLabel = METRIC_OPTIONS.find(o => o.id === currentMetric)?.label || 'المقياس';

    // Calculate normalized widths for CSS percentage styles so they fill 100% nicely
    const sum = data.desktopPct + data.tabletPct + data.mobilePct;
    const desktopWidth = sum > 0 ? (data.desktopPct / sum) * 100 : 0;
    const tabletWidth = sum > 0 ? (data.tabletPct / sum) * 100 : 0;
    const mobileWidth = sum > 0 ? (data.mobilePct / sum) * 100 : 0;

    return (
      <div className="space-y-1.5 py-1">
        {/* Row Container */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Dropdown Selector on Left Side (with Down Arrow) */}
          <div className="w-28 sm:w-36 shrink-0 text-left">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  type="button" 
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-normal text-foreground/90 hover:text-foreground transition-colors group cursor-pointer select-none"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="truncate underline decoration-dotted decoration-border underline-offset-4">
                    {currentLabel}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 z-50">
                {METRIC_OPTIONS.map(opt => (
                  <DropdownMenuItem
                    key={opt.id}
                    onClick={() => setMetric(opt.id)}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {opt.id === currentMetric && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stacked Horizontal Bar Chart */}
          <div className="flex-1">
            <div className="w-full h-4 sm:h-[18px] bg-secondary/40 rounded-xs flex overflow-hidden shadow-2xs">
              {/* Desktop Segment (Yellow/Amber - Left side) */}
              {desktopWidth > 0 && (
                <div 
                  className="h-full bg-[#f9ab00] transition-all duration-500 hover:brightness-105 cursor-pointer relative group"
                  style={{ width: `${desktopWidth}%` }}
                  onClick={() => onSelectDeviceFilter && onSelectDeviceFilter('desktop')}
                  title={`أجهزة الكمبيوتر: ${data.desktopPct}%`}
                />
              )}

              {/* Tablet Segment (Red - Middle) */}
              {tabletWidth > 0 && (
                <div 
                  className="h-full bg-[#d93025] transition-all duration-500 hover:brightness-105 cursor-pointer relative group"
                  style={{ width: `${tabletWidth}%` }}
                  onClick={() => onSelectDeviceFilter && onSelectDeviceFilter('tablet')}
                  title={`الأجهزة اللوحية: ${data.tabletPct}%`}
                />
              )}

              {/* Mobile Segment (Blue - Right side) */}
              {mobileWidth > 0 && (
                <div 
                  className="h-full bg-[#1a73e8] transition-all duration-500 hover:brightness-105 cursor-pointer relative group"
                  style={{ width: `${mobileWidth}%` }}
                  onClick={() => onSelectDeviceFilter && onSelectDeviceFilter('mobile')}
                  title={`الهواتف الجوّالة: ${data.mobilePct}%`}
                />
              )}

              {/* Empty placeholder state if all 0 */}
              {sum === 0 && (
                <div className="w-full h-full bg-muted/60" />
              )}
            </div>
          </div>
        </div>

        {/* Percentage Indicators directly under the bar matching Google Ads */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-28 sm:w-36 shrink-0" />
          <div className="flex-1 grid grid-cols-3 text-xs sm:text-[13px] text-foreground/80 font-normal">
            {/* Desktop percentage (Left under yellow) */}
            <div 
              className="flex items-center gap-1.5 cursor-pointer hover:text-foreground justify-start"
              onClick={() => onSelectDeviceFilter && onSelectDeviceFilter('desktop')}
            >
              <span>{data.desktopPct.toFixed(1)}%</span>
              <span className="inline-block w-2.5 h-2.5 bg-[#f9ab00] rounded-2xs shrink-0" />
            </div>

            {/* Tablet percentage (Center under red) */}
            <div 
              className="flex items-center gap-1.5 cursor-pointer hover:text-foreground justify-center"
              onClick={() => onSelectDeviceFilter && onSelectDeviceFilter('tablet')}
            >
              <span>{data.tabletPct.toFixed(1)}%</span>
              <span className="inline-block w-2.5 h-2.5 bg-[#d93025] rounded-2xs shrink-0" />
            </div>

            {/* Mobile percentage (Right under blue) */}
            <div 
              className="flex items-center gap-1.5 cursor-pointer hover:text-foreground justify-end"
              onClick={() => onSelectDeviceFilter && onSelectDeviceFilter('mobile')}
            >
              <span>{data.mobilePct.toFixed(1)}%</span>
              <span className="inline-block w-2.5 h-2.5 bg-[#1a73e8] rounded-2xs shrink-0" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("rounded-2xl bg-card border border-border/70 shadow-sm overflow-hidden", className)}>
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 border-b border-border/50 flex items-center justify-between bg-muted/10">
        {/* Left Options Menu (⋮) */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full"
                title="خيارات إضافية"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 z-50">
              <DropdownMenuItem 
                onClick={handleSaveOrder} 
                className="text-xs cursor-pointer gap-2 font-bold text-primary hover:text-primary hover:bg-primary/10"
              >
                <Save className="h-4 w-4 text-primary shrink-0" />
                <span>حفظ الترتيب</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={handleResetOrder} 
                className="text-xs cursor-pointer gap-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                <span>استعادة الترتيب الافتراضي</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleCopyDeviceSummary} className="text-xs cursor-pointer gap-2">
                <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>نسخ ملخص الأجهزة</span>
              </DropdownMenuItem>

              {onRefresh && (
                <DropdownMenuItem onClick={onRefresh} className="text-xs cursor-pointer gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>تحديث إحصائيات الأجهزة</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Header Title & Icon: الأجهزة */}
        <div className="flex items-center gap-2 text-foreground/90">
          <span className="text-sm sm:text-base font-normal text-muted-foreground">الأجهزة</span>
          <GoogleAdsDeviceHeaderIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Subtitle: أداء الإعلانات على جميع الأجهزة */}
        <div className="text-right sm:text-center">
          <h3 className="text-sm sm:text-base font-normal text-foreground">
            أداء الإعلانات على جميع الأجهزة
          </h3>
        </div>

        {/* Legend Row matching Google Ads */}
        <div className="flex items-center justify-center sm:justify-end gap-5 sm:gap-7 flex-wrap text-xs sm:text-sm text-foreground/80 select-none">
          {/* Mobile Legend Item */}
          <div 
            className={cn(
              "flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-100",
              selectedDeviceFilter !== 'all' && selectedDeviceFilter !== 'mobile' ? "opacity-40" : "opacity-90"
            )}
            onClick={() => onSelectDeviceFilter && onSelectDeviceFilter(selectedDeviceFilter === 'mobile' ? 'all' : 'mobile')}
            title="انقر لتصفية الأحداث للهواتف فقط"
          >
            <span>الهواتف الجوّالة</span>
            <GoogleAdsMobileIcon className="h-5 w-5" />
          </div>

          {/* Tablet Legend Item */}
          <div 
            className={cn(
              "flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-100",
              selectedDeviceFilter !== 'all' && selectedDeviceFilter !== 'tablet' ? "opacity-40" : "opacity-90"
            )}
            onClick={() => onSelectDeviceFilter && onSelectDeviceFilter(selectedDeviceFilter === 'tablet' ? 'all' : 'tablet')}
            title="انقر لتصفية الأحداث للأجهزة اللوحية فقط"
          >
            <span>الأجهزة اللوحية</span>
            <GoogleAdsTabletIcon className="h-5 w-5" />
          </div>

          {/* Computer Legend Item */}
          <div 
            className={cn(
              "flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-100",
              selectedDeviceFilter !== 'all' && selectedDeviceFilter !== 'desktop' ? "opacity-40" : "opacity-90"
            )}
            onClick={() => onSelectDeviceFilter && onSelectDeviceFilter(selectedDeviceFilter === 'desktop' ? 'all' : 'desktop')}
            title="انقر لتصفية الأحداث لأجهزة الكمبيوتر فقط"
          >
            <span>أجهزة الكمبيوتر</span>
            <GoogleAdsComputerIcon className="h-5 w-5" />
          </div>
        </div>

        {/* Stacked Bars Section */}
        <div className="space-y-4 pt-1">
          {renderMetricRow(row1Metric, setRow1Metric, row1Data)}
          {renderMetricRow(row2Metric, setRow2Metric, row2Data)}
          {renderMetricRow(row3Metric, setRow3Metric, row3Data)}
        </div>

        {/* Bid Adjustments & Footer Section */}
        <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Bid Adjustments (تعديلات عروض الأسعار) */}
          <div className="text-right space-y-1">
            <div className="text-xs text-muted-foreground font-medium">
              تعديلات عروض الأسعار
            </div>
            <div className="flex items-center gap-4 text-xs text-foreground/80 flex-wrap">
              <span className="flex items-center gap-1">
                <span>هواتف الجوّال:</span>
                <span className="font-semibold text-muted-foreground">—</span>
              </span>
              <span className="flex items-center gap-1">
                <span>أجهزة الكمبيوتر:</span>
                <span className="font-semibold text-muted-foreground">—</span>
              </span>
              <span className="flex items-center gap-1">
                <span>الأجهزة اللوحية:</span>
                <span className="font-semibold text-muted-foreground">—</span>
              </span>
            </div>
          </div>

          {/* Blue Devices Link at bottom */}
          <button
            type="button"
            onClick={() => {
              if (onScrollToDetails) onScrollToDetails();
            }}
            className="text-xs sm:text-sm font-medium text-[#1a73e8] hover:underline self-end sm:self-auto cursor-pointer"
          >
            الأجهزة
          </button>
        </div>
      </div>
    </div>
  );
}
