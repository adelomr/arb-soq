'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  MapPin,
  LocateFixed,
  Loader2,
  Check,
  CheckCircle2,
  Circle,
  Navigation,
  Settings,
  Globe,
  Building2,
  Building,
  Home,
  Sparkles,
  Compass,
} from 'lucide-react';
import {
  detectUserLocation,
  saveAndSyncLocation,
  loadSavedLocation,
  buildFullAddress,
  LocationData,
} from '@/lib/locationEngine';
import { cn } from '@/lib/utils';

type LocationScope = 'village' | 'city' | 'governorate' | 'country';

export default function SettingsClient() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  // المربعات الأربعة (Targeting 4 Boxes)
  const [country, setCountry] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [village, setVillage] = useState('');

  // تحديد أي مربع هو المعتمد لسوق بلدنا
  const [selectedScope, setSelectedScope] = useState<LocationScope>('village');

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
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
  }, [userProfile]);

  const handleLocateMeClick = () => {
    setShowPermissionDialog(true);
  };

  const handleConfirmLocationPermission = async () => {
    setShowPermissionDialog(false);
    setIsDetecting(true);

    try {
      // استدعاء نظام تحديد الموقع الذكي (حاوية الأندرويد + الـ Geocoder العربي)
      const locationData = await detectUserLocation();

      // تعبئة المربعات الأربعة بالأسماء العربية
      const c = locationData.country && locationData.country !== 'غير محدد' ? locationData.country : '';
      const g = locationData.governorate && locationData.governorate !== 'غير محدد' ? locationData.governorate : '';
      const ct = locationData.city && locationData.city !== 'غير محدد' ? locationData.city : '';
      const v = locationData.village && locationData.village !== 'غير محدد' ? locationData.village : '';

      setCountry(c);
      setGovernorate(g);
      setCity(ct);
      setVillage(v);

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

      toast({
        title: 'تم تحديد موقعك بدقة 🛰️',
        description: `تم تحويل الإحداثيات إلى أسماء: ${locationData.fullAddress}`,
      });
    } catch (err: any) {
      toast({
        title: 'تنبيه الموقع الجغرافي',
        description: err?.message || 'يرجى التأكد من تشغيل الـ GPS في جهازك والمحاولة مجدداً.',
        variant: 'destructive',
      });
    } finally {
      setIsDetecting(false);
    }
  };

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

  const fullAddressPreview = buildFullAddress(village, city, governorate, country);
  const currentSelectedName = getScopeTargetName();

  const handleSave = async () => {
    if (!country && !governorate && !city && !village) {
      toast({
        title: 'بيانات الموقع فارغة',
        description: 'يرجى الضغط على زر تحديد الموقع أو كتابة بيانات منطقتك في المربعات.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: LocationData = {
        country: country || 'غير محدد',
        governorate: governorate || 'غير محدد',
        city: city || 'غير محدد',
        village: village || 'غير محدد',
        fullAddress: fullAddressPreview,
        latitude: coords?.lat || 0,
        longitude: coords?.lng || 0,
        scope: selectedScope,
        updatedAt: Date.now(),
      };

      await saveAndSyncLocation(payload, user?.uid);

      toast({
        title: 'تم حفظ وتفعيل سوق بلدنا بنجاح ✨',
        description: `الموقع المعتمد: ${currentSelectedName} (${getScopeLabelAr(selectedScope)})`,
      });
    } catch (err: any) {
      toast({
        title: 'خطأ في الحفظ',
        description: err?.message || 'حدث خطأ أثناء حفظ الموقع.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" dir="rtl">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        {/* عنوان الصفحة الرئيسي */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-headline">
              إعدادات الموقع الجغرافي وسوق بلدنا
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              حدد موقعك واختر أي مستوى ترغب باستهدافه ليكون موقعك في سوق بلدنا
            </p>
          </div>
        </div>

        {/* بطاقة الإعدادات الرئيسية */}
        <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
          {/* قسم التحديد التلقائي بالـ GPS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-primary" />
                  التحديد التلقائي للموقع (GPS)
                </Label>
                <p className="text-xs text-muted-foreground">
                  استخراج الإحداثيات وتعبئة المربعات الأربعة تلقائياً
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleLocateMeClick}
              disabled={isDetecting}
              className="w-full h-12 flex items-center justify-center gap-2 font-bold border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary text-foreground rounded-2xl transition-all shadow-sm"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm">جارٍ قراءة الإحداثيات وتحويلها لأسماء...</span>
                </>
              ) : (
                <>
                  <LocateFixed className="w-5 h-5 text-primary" />
                  <span>تحديد موقعي وتعبئة المربعات تلقائياً</span>
                </>
              )}
            </Button>
          </div>

          {/* المربعات الأربعة مع إمكانية اختيار أي مربع لسوق بلدنا */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                مربعات الموقع (اضغط لاختيار موقع سوق بلدنا):
              </Label>
              {coords && (
                <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2.5 py-1 rounded-full border border-border">
                  📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* المربع 1: الدولة */}
              <div
                onClick={() => setSelectedScope('country')}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                  selectedScope === 'country'
                    ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                    : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    1. الدولة
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
                  placeholder="مثال: مصر، السعودية..."
                  className="h-10 bg-background/80 text-sm font-medium border-border/60"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* المربع 2: المحافظة / المنطقة */}
              <div
                onClick={() => setSelectedScope('governorate')}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                  selectedScope === 'governorate'
                    ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                    : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    2. المحافظة / المنطقة
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
                  placeholder="مثال: الدقهلية، منطقة الرياض..."
                  className="h-10 bg-background/80 text-sm font-medium border-border/60"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* المربع 3: المدينة / المركز */}
              <div
                onClick={() => setSelectedScope('city')}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                  selectedScope === 'city'
                    ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                    : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Building className="w-3.5 h-3.5 text-primary" />
                    3. المدينة / المركز
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
                  placeholder="مثال: المنصورة، الرياض..."
                  className="h-10 bg-background/80 text-sm font-medium border-border/60"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* المربع 4: القرية / الحي / الشارع */}
              <div
                onClick={() => setSelectedScope('village')}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                  selectedScope === 'village'
                    ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                    : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Home className="w-3.5 h-3.5 text-primary" />
                    4. القرية / الحي / الشارع
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
                  placeholder="مثال: حي العليا، قرية ميت برة..."
                  className="h-10 bg-background/80 text-sm font-medium border-border/60"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>

          {/* بطاقة ملخص المربع المعتمد لسوق بلدنا والعنوان */}
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                <span className="text-xs font-bold text-foreground">
                  الموقع المعتمد لسوق بلدنا:
                </span>
              </div>
              <span className="text-[11px] font-bold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full border border-primary/20">
                مستوى {getScopeLabelAr(selectedScope)}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground truncate">
              📍 {currentSelectedName || 'يرجى كتابة الاسم في المربع المختار'}
            </p>
            {fullAddressPreview && fullAddressPreview !== 'غير محدد' && (
              <p className="text-xs text-muted-foreground truncate pt-0.5">
                العنوان الكامل: {fullAddressPreview}
              </p>
            )}
          </div>

          {/* زر حفظ الموقع */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isDetecting}
              className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-12 rounded-2xl shadow-lg text-sm transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  <span>جارٍ حفظ الموقع...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 ml-2" />
                  <span>حفظ واعتماد سوق بلدنا والموقع</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* حوار تأكيد الإذن */}
      <AlertDialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <AlertDialogContent className="max-w-sm w-[90vw] text-right font-body bg-card border-border rounded-3xl p-6" dir="rtl">
          <AlertDialogHeader className="text-right space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <Navigation className="w-5 h-5" />
              </div>
              <AlertDialogTitle className="text-base font-bold font-headline">
                تحديد الموقع الجغرافي (GPS)
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              سيتم قراءة إحداثيات موقعك عبر نظام الـ GPS وتحويلها تلقائياً إلى أسماء الدولة، المحافظة، المدينة، والقرية/الحي وتعبئة المربعات الأربعة.
              <br />
              <span className="text-[11px] text-foreground font-semibold mt-2 block">
                ⚠️ يرجى التأكد من تشغيل خدمة الموقع (GPS) في هاتفك.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse items-center justify-start gap-2 pt-3">
            <AlertDialogAction
              onClick={handleConfirmLocationPermission}
              className="flex-1 bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-11 rounded-2xl text-xs"
            >
              موافق، حدد موقعي
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={() => setShowPermissionDialog(false)}
              className="h-11 px-4 rounded-2xl text-xs font-semibold"
            >
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
