'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, LocateFixed, Loader2, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface BaladnaLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSaved?: (locationName: string) => void;
}

export const BALADNA_STORAGE_KEY = 'arb_soq_my_balad_name';
export const BALADNA_COORDS_KEY = 'arb_soq_my_balad_coords';

export default function BaladnaLocationModal({
  isOpen,
  onClose,
  onLocationSaved,
}: BaladnaLocationModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [cityName, setCityName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedDetails, setDetectedDetails] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(BALADNA_STORAGE_KEY) || '';
      const savedCoords = localStorage.getItem(BALADNA_COORDS_KEY);
      setCityName(saved);
      if (savedCoords) {
        try {
          setCoords(JSON.parse(savedCoords));
        } catch {
          setCoords(null);
        }
      }
      setDetectedDetails(null);
    }
  }, [isOpen]);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'غير مدعوم',
        description: 'متصفحك لا يدعم تحديد الموقع الجغرافي.',
        variant: 'destructive',
      });
      return;
    }

    setIsDetecting(true);
    setDetectedDetails(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          // جلب اسم المدينة والقرية بالعربية عبر BigDataCloud
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ar`
          );
          const data = await res.json();

          const locality = data.locality || data.city || data.principalSubdivision || '';
          const subDiv = data.principalSubdivision || '';
          const country = data.countryName || '';

          // أفضل اسم للقرية أو المدينة
          const bestName = locality || subDiv || country || 'موقعي الحالي';
          setCityName(bestName);

          const fullDetails = [locality, subDiv, country].filter(Boolean).join('، ');
          setDetectedDetails(fullDetails);

          toast({
            title: 'تم تحديد موقعك بنجاح',
            description: `تم التعرف على: ${fullDetails}`,
          });
        } catch (e) {
          // محاولة ثانية عبر OpenStreetMap إذا فشل المصدر الأول
          try {
            const osmRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
            );
            const osmData = await osmRes.json();
            const addr = osmData.address || {};
            const local = addr.village || addr.town || addr.city || addr.suburb || addr.state || '';
            if (local) {
              setCityName(local);
              setDetectedDetails(osmData.display_name || local);
            }
          } catch {
            setCityName('موقعي الحالي');
          }
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        let msg = 'تعذر الوصول إلى الموقع الجغرافي. يمكنك كتابة اسم بلدك يدوياً.';
        if (error.code === 1) {
          msg = 'يرجى إعطاء صلاحية الموقع لتحديد بلدك تلقائياً، أو كتابته يدوياً.';
        }
        toast({
          title: 'تنبيه الموقع',
          description: msg,
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = () => {
    const trimmed = cityName.trim();
    if (!trimmed) {
      toast({
        title: 'اسم البلد مطلوب',
        description: 'يرجى إدخال اسم مدينتك أو قريتك، أو تحديدها عبر GPS.',
        variant: 'destructive',
      });
      return;
    }

    localStorage.setItem(BALADNA_STORAGE_KEY, trimmed);
    if (coords) {
      localStorage.setItem(BALADNA_COORDS_KEY, JSON.stringify(coords));
    }

    // إشعار التطبيق بالتحديث الفوري
    window.dispatchEvent(new CustomEvent('baladna-location-changed', { detail: { name: trimmed, coords } }));

    toast({
      title: 'تم حفظ بلدك بنجاح ✨',
      description: `سيتم الآن عرض إعلانات (${trimmed}) في سوق بلدنا.`,
    });

    onClose();
    if (onLocationSaved) {
      onLocationSaved(trimmed);
    } else {
      router.push('/sooq-baladna');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-right font-body bg-card border-border" dir="rtl">
        <DialogHeader className="text-right space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <MapPin className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold font-headline">
              تحديد بلدنا / منطقتي 📍
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            حدد مدينتك أو قريتك لتخصيص زر <strong>(سوق بلدنا)</strong> وعرض إعلانات منطقتك الأقرب إليك دائماً.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* زر التحديد التلقائي عبر GPS */}
          <Button
            type="button"
            variant="outline"
            onClick={handleDetectGPS}
            disabled={isDetecting}
            className="w-full h-12 flex items-center justify-center gap-2 font-bold border-primary/40 hover:bg-primary/5 hover:border-primary text-foreground transition-all"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>جارٍ تحديد موقعك الجغرافي بدقة...</span>
              </>
            ) : (
              <>
                <LocateFixed className="w-5 h-5 text-primary" />
                <span>تحديد موقعي الجغرافي تلقائياً (GPS)</span>
              </>
            )}
          </Button>

          {/* تفاصيل الموقع المكتشف إن وجدت */}
          {detectedDetails && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                تم التعرف على: <strong className="text-foreground">{detectedDetails}</strong>
              </span>
            </div>
          )}

          {/* حقل الإدخال اليدوي والتعديل */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              اسم مدينتك / قريتك / منطقتك:
            </label>
            <div className="relative">
              <Input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="مثال: المنصورة، الرياض، طنطا، قرية ميت برة..."
                className="h-11 text-base pr-10 font-medium"
                dir="rtl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
              <MapPin className="w-5 h-5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              يمكنك كتابة اسم أي قرية أو مدينة وسيقوم التطبيق بالبحث عن الإعلانات المتطابقة والأقرب إليها.
            </p>
          </div>

          {/* تلميح الضغطة المطولة */}
          <div className="p-2.5 rounded-lg bg-muted/50 border border-border text-[11.5px] text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary shrink-0" />
            <span>
              💡 <strong>معلومة:</strong> يمكنك في أي وقت الضغط مطولاً على أيقونة <strong>سوق بلدنا</strong> في الشريط السفلي لتغيير موقعك فوراً.
            </span>
          </div>
        </div>

        <DialogFooter className="flex flex-row-reverse items-center justify-start gap-2 pt-2 border-t border-border/50">
          <Button
            type="button"
            onClick={handleSave}
            className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 px-6 h-11"
          >
            <Check className="w-4 h-4 ml-1.5" />
            حفظ البلد وعرض الإعلانات
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-11 font-medium text-muted-foreground hover:text-foreground"
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
