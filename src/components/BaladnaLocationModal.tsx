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
import {
  BALADNA_STORAGE_KEY,
  BALADNA_COORDS_KEY,
  getCurrentGpsPosition,
  reverseGeocodeCoordinates,
  saveAndSyncLocation,
  loadSavedLocation,
  LocationData,
} from '@/lib/locationEngine';
import { useAuth } from '@/context/AuthContext';

export { BALADNA_STORAGE_KEY, BALADNA_COORDS_KEY };

interface BaladnaLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSaved?: (locationName: string) => void;
}

export default function BaladnaLocationModal({
  isOpen,
  onClose,
  onLocationSaved,
}: BaladnaLocationModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [cityName, setCityName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedDetails, setDetectedDetails] = useState<string | null>(null);
  const [latestLocationData, setLatestLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = loadSavedLocation();
      if (saved) {
        setLatestLocationData(saved);
        setCityName(saved.village || saved.city || saved.fullAddress || '');
        if (saved.latitude && saved.longitude) {
          setCoords({ lat: saved.latitude, lng: saved.longitude });
        }
      } else {
        const legacy = localStorage.getItem(BALADNA_STORAGE_KEY) || '';
        setCityName(legacy);
      }
      setDetectedDetails(null);
    }
  }, [isOpen]);

  const handleDetectGPS = async () => {
    setIsDetecting(true);
    setDetectedDetails(null);

    try {
      // 1. تحديد موقع الـ GPS بأعلى دقة
      const gps = await getCurrentGpsPosition();
      setCoords({ lat: gps.latitude, lng: gps.longitude });

      // 2. تطبيق خوارزمية أندرويد الدقيقة
      const geocoded = await reverseGeocodeCoordinates(
        gps.latitude,
        gps.longitude,
        gps.accuracy
      );
      setLatestLocationData(geocoded);

      const bestName =
        geocoded.village || geocoded.city || geocoded.governorate || 'موقعي الحالي';
      setCityName(bestName);
      setDetectedDetails(geocoded.fullAddress);

      toast({
        title: 'تم تحديد موقعك بدقة 🛰️',
        description: `تم التعرف على: ${geocoded.fullAddress}`,
      });
    } catch (err: any) {
      toast({
        title: 'تنبيه الـ GPS',
        description: err?.message || 'تعذر تحديد الموقع تلقائياً.',
        variant: 'destructive',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSave = async () => {
    const trimmed = cityName.trim();
    if (!trimmed) {
      toast({
        title: 'اسم البلد مطلوب',
        description: 'يرجى إدخال اسم مدينتك أو قريتك، أو تحديدها عبر GPS.',
        variant: 'destructive',
      });
      return;
    }

    const payload: LocationData = latestLocationData
      ? {
          ...latestLocationData,
          city: latestLocationData.city || trimmed,
          village: latestLocationData.village || trimmed,
          fullAddress: latestLocationData.fullAddress || trimmed,
          latitude: coords?.lat || latestLocationData.latitude || 0,
          longitude: coords?.lng || latestLocationData.longitude || 0,
        }
      : {
          village: '',
          city: trimmed,
          governorate: '',
          country: '',
          fullAddress: trimmed,
          latitude: coords?.lat || 0,
          longitude: coords?.lng || 0,
          scope: 'city',
          updatedAt: Date.now(),
        };

    await saveAndSyncLocation(payload, user?.uid);

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
              💡 <strong>معلومة:</strong> يمكنك أيضاً الدخول على أيقونة <strong>الضبط ⚙️</strong> في الشريط السفلي لضبط الموقع الجغرافي بدقة واختيار النطاق.
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
