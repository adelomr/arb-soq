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
import { Label } from '@/components/ui/label';
import {
  MapPin,
  LocateFixed,
  Loader2,
  Check,
  CheckCircle2,
  Circle,
  Globe,
  Building2,
  Building,
  Home,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  BALADNA_STORAGE_KEY,
  BALADNA_COORDS_KEY,
  detectUserLocation,
  saveAndSyncLocation,
  loadSavedLocation,
  buildFullAddress,
  LocationData,
} from '@/lib/locationEngine';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export { BALADNA_STORAGE_KEY, BALADNA_COORDS_KEY };

interface BaladnaLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSaved?: (locationName: string) => void;
}

type LocationScope = 'village' | 'city' | 'governorate' | 'country';

export default function BaladnaLocationModal({
  isOpen,
  onClose,
  onLocationSaved,
}: BaladnaLocationModalProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const router = useRouter();

  // المربعات الأربعة (Targeting 4 Boxes)
  const [country, setCountry] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [village, setVillage] = useState('');

  // تحديد أي مربع هو المعتمد لسوق بلدنا
  const [selectedScope, setSelectedScope] = useState<LocationScope>('village');

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedDetails, setDetectedDetails] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = loadSavedLocation();
      if (saved) {
        setCountry(saved.country && saved.country !== 'غير محدد' ? saved.country : '');
        setGovernorate(saved.governorate && saved.governorate !== 'غير محدد' ? saved.governorate : '');
        setCity(saved.city && saved.city !== 'غير محدد' ? saved.city : '');
        setVillage(saved.village && saved.village !== 'غير محدد' ? saved.village : '');
        if (saved.scope) {
          setSelectedScope(saved.scope as LocationScope);
        } else if (saved.village && saved.village !== 'غير محدد') {
          setSelectedScope('village');
        } else if (saved.city && saved.city !== 'غير محدد') {
          setSelectedScope('city');
        } else if (saved.governorate && saved.governorate !== 'غير محدد') {
          setSelectedScope('governorate');
        } else if (saved.country && saved.country !== 'غير محدد') {
          setSelectedScope('country');
        }

        if (saved.latitude && saved.longitude) {
          setCoords({ lat: saved.latitude, lng: saved.longitude });
        }
      } else if (userProfile) {
        setCountry(userProfile.country || '');
        setGovernorate(userProfile.governorate || userProfile.province || '');
        setCity(userProfile.city || '');
        setVillage(userProfile.village || '');
        if (userProfile.village) setSelectedScope('village');
        else if (userProfile.city) setSelectedScope('city');
        else if (userProfile.governorate || userProfile.province) setSelectedScope('governorate');
        else if (userProfile.country) setSelectedScope('country');
      }
      setDetectedDetails(null);
    }
  }, [isOpen, userProfile]);

  const handleDetectGPS = async () => {
    setIsDetecting(true);
    setDetectedDetails(null);

    try {
      // 1. تحديد الموقع بدقة وتحويل الإحداثيات لأسماء عربية
      const locationData = await detectUserLocation();

      // 2. تعبئة المربعات الأربعة تلقائياً
      const c = locationData.country && locationData.country !== 'غير محدد' ? locationData.country : '';
      const g = locationData.governorate && locationData.governorate !== 'غير محدد' ? locationData.governorate : '';
      const ct = locationData.city && locationData.city !== 'غير محدد' ? locationData.city : '';
      const v = locationData.village && locationData.village !== 'غير محدد' ? locationData.village : '';

      setCountry(c);
      setGovernorate(g);
      setCity(ct);
      setVillage(v);

      // تحديد النطاق الأنسب تلقائياً
      if (locationData.scope) {
        setSelectedScope(locationData.scope as LocationScope);
      } else if (v) {
        setSelectedScope('village');
      } else if (ct) {
        setSelectedScope('city');
      } else if (g) {
        setSelectedScope('governorate');
      } else if (c) {
        setSelectedScope('country');
      }

      if (locationData.latitude && locationData.longitude) {
        setCoords({ lat: locationData.latitude, lng: locationData.longitude });
      }

      setDetectedDetails(locationData.fullAddress);

      toast({
        title: 'تم تحديد موقعك بدقة 🛰️',
        description: `تم تحويل الإحداثيات وتعبئة المربعات: ${locationData.fullAddress}`,
      });
    } catch (err: any) {
      toast({
        title: 'تنبيه الـ GPS',
        description: err?.message || 'تعذر تحديد الموقع تلقائياً. تأكد من تشغيل الـ GPS.',
        variant: 'destructive',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // الحصول على القيمة الحالية للمربع المختار
  const getScopeTargetName = () => {
    if (selectedScope === 'village' && village.trim()) return village.trim();
    if (selectedScope === 'city' && city.trim()) return city.trim();
    if (selectedScope === 'governorate' && governorate.trim()) return governorate.trim();
    if (selectedScope === 'country' && country.trim()) return country.trim();
    return village.trim() || city.trim() || governorate.trim() || country.trim() || 'موقعي';
  };

  const getScopeLabelAr = (scope: LocationScope) => {
    switch (scope) {
      case 'village': return 'القرية / الحي';
      case 'city': return 'المدينة / المركز';
      case 'governorate': return 'المحافظة / المنطقة';
      case 'country': return 'الدولة';
    }
  };

  const fullAddress = buildFullAddress(village, city, governorate, country);
  const currentSelectedName = getScopeTargetName();

  const handleSave = async () => {
    if (!country && !governorate && !city && !village) {
      toast({
        title: 'بيانات الموقع فارغة',
        description: 'يرجى الضغط على زر تحديد الموقع أو كتابة منطقتك في المربعات.',
        variant: 'destructive',
      });
      return;
    }

    const bestTarget = currentSelectedName;

    const payload: LocationData = {
      country: country || 'غير محدد',
      governorate: governorate || 'غير محدد',
      city: city || 'غير محدد',
      village: village || 'غير محدد',
      fullAddress,
      latitude: coords?.lat || 0,
      longitude: coords?.lng || 0,
      scope: selectedScope,
      updatedAt: Date.now(),
    };

    await saveAndSyncLocation(payload, user?.uid);

    toast({
      title: 'تم حفظ وتفعيل سوق بلدنا بنجاح ✨',
      description: `تم تعيين (${bestTarget}) على مستوى ${getScopeLabelAr(selectedScope)} كموقع لسوق بلدنا.`,
    });

    onClose();
    if (onLocationSaved) {
      onLocationSaved(bestTarget);
    } else {
      router.push('/sooq-baladna');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] sm:w-full text-right font-body bg-card border-border rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto flex flex-col" dir="rtl">
        <DialogHeader className="text-right space-y-1.5 shrink-0">
          <div className="flex items-center gap-2 text-primary">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold font-headline">
                إعدادات الموقع وسوق بلدنا 📍
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                حدد موقعك تلقائياً ثم اختر أي مربع من المربعات الأربعة ليكون هو نطاق إعلانات سوق بلدنا.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1">
          {/* زر التحديد التلقائي عبر GPS */}
          <Button
            type="button"
            variant="outline"
            onClick={handleDetectGPS}
            disabled={isDetecting}
            className="w-full h-12 flex items-center justify-center gap-2 font-bold border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary text-foreground rounded-2xl transition-all shadow-sm"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-xs sm:text-sm">جارٍ قراءة الإحداثيات وتحويلها لأسماء...</span>
              </>
            ) : (
              <>
                <LocateFixed className="w-5 h-5 text-primary" />
                <span className="text-xs sm:text-sm">تحديد موقعي وتعبئة المربعات تلقائياً (GPS)</span>
              </>
            )}
          </Button>

          {/* تفاصيل الموقع المكتشف */}
          {detectedDetails && (
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>
                العنوان المكتشف: <strong className="text-foreground">{detectedDetails}</strong>
              </span>
            </div>
          )}

          {/* المربعات الأربعة مع إمكانية اختيار أي مربع لسوق بلدنا */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground block">
                مربعات الموقع (اضغط لاختيار موقع سوق بلدنا):
              </Label>
              <span className="text-[10px] text-muted-foreground">
                اختر المربع المستهدف لسوق بلدنا
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. الدولة */}
              <div
                onClick={() => setSelectedScope('country')}
                className={cn(
                  "p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                  selectedScope === 'country'
                    ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                    : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    الدولة
                  </Label>
                  {selectedScope === 'country' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> سوق بلدنا
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Circle className="w-2.5 h-2.5" /> اختيار
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="مصر، السعودية..."
                  className="h-8 text-xs font-medium bg-background"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* 2. المحافظة / المنطقة */}
              <div
                onClick={() => setSelectedScope('governorate')}
                className={cn(
                  "p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                  selectedScope === 'governorate'
                    ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                    : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    المحافظة / المنطقة
                  </Label>
                  {selectedScope === 'governorate' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> سوق بلدنا
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Circle className="w-2.5 h-2.5" /> اختيار
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  placeholder="الدقهلية، الرياض..."
                  className="h-8 text-xs font-medium bg-background"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* 3. المدينة / المركز */}
              <div
                onClick={() => setSelectedScope('city')}
                className={cn(
                  "p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                  selectedScope === 'city'
                    ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                    : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Building className="w-3.5 h-3.5 text-primary" />
                    المدينة / المركز
                  </Label>
                  {selectedScope === 'city' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> سوق بلدنا
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Circle className="w-2.5 h-2.5" /> اختيار
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="المنصورة، الرياض..."
                  className="h-8 text-xs font-medium bg-background"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* 4. القرية / الحي */}
              <div
                onClick={() => setSelectedScope('village')}
                className={cn(
                  "p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                  selectedScope === 'village'
                    ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                    : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Home className="w-3.5 h-3.5 text-primary" />
                    القرية / الحي
                  </Label>
                  {selectedScope === 'village' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> سوق بلدنا
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Circle className="w-2.5 h-2.5" /> اختيار
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="حي الجامعة، ميت برة..."
                  className="h-8 text-xs font-medium bg-background"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>

          {/* بطاقة ملخص المربع المعتمد لسوق بلدنا */}
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/25 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                <span className="text-xs font-bold text-foreground">
                  الموقع المعتمد لسوق بلدنا:
                </span>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full border border-primary/20">
                مستوى {getScopeLabelAr(selectedScope)}
              </span>
            </div>
            <p className="text-xs font-bold text-foreground truncate pt-0.5">
              📍 {currentSelectedName || 'يرجى كتابة الاسم في المربع المختار'}
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-row-reverse items-center justify-start gap-2 pt-3 border-t border-border/50 shrink-0">
          <Button
            type="button"
            onClick={handleSave}
            className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 px-6 h-11 rounded-2xl flex-1 text-sm shadow-md"
          >
            <Check className="w-4 h-4 ml-1.5" />
            حفظ وتفعيل سوق بلدنا
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-11 px-4 font-medium text-muted-foreground hover:text-foreground rounded-2xl text-xs"
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
