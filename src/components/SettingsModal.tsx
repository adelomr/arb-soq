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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  MapPin,
  LocateFixed,
  Loader2,
  Check,
  Navigation,
  Sparkles,
} from 'lucide-react';
import {
  getCurrentGpsPosition,
  reverseGeocodeCoordinates,
  saveAndSyncLocation,
  loadSavedLocation,
  getBestLocationName,
  LocationData,
  BALADNA_STORAGE_KEY,
} from '@/lib/locationEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [latestData, setLatestData] = useState<LocationData | null>(null);

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = loadSavedLocation();
      if (saved) {
        setLatestData(saved);
        const name = getBestLocationName(saved) || saved.fullAddress || '';
        setLocationName(name);
        if (saved.latitude && saved.longitude) {
          setCoords({ lat: saved.latitude, lng: saved.longitude });
        }
      } else if (userProfile) {
        const name = userProfile.village || userProfile.city || userProfile.governorate || '';
        setLocationName(name);
      } else {
        const legacy = localStorage.getItem(BALADNA_STORAGE_KEY) || '';
        setLocationName(legacy);
      }
    }
  }, [isOpen, userProfile]);

  // 1. الضغط على زر "تحديد موقعي": إظهار رسالة طلب الصلاحية والتأكيد
  const handleLocateMeClick = () => {
    setShowPermissionDialog(true);
  };

  // 2. عند موافقة المستخدم: تفعيل البحث بالخلفية ووضع التسمية الأقرب في مربع النص
  const handleConfirmLocationPermission = async () => {
    setShowPermissionDialog(false);
    setIsDetecting(true);

    try {
      // جلب إحداثيات GPS
      const gps = await getCurrentGpsPosition();
      setCoords({ lat: gps.latitude, lng: gps.longitude });

      // البحث عن أقرب تسمية لموقع المستخدم (القرية أو المدينة أو المحافظة)
      const geocoded = await reverseGeocodeCoordinates(
        gps.latitude,
        gps.longitude,
        gps.accuracy
      );
      setLatestData(geocoded);

      // استخراج أقرب وأدق تسمية
      const nearestName =
        geocoded.village ||
        geocoded.city ||
        geocoded.governorate ||
        geocoded.fullAddress;

      // وضع التسمية تلقائياً في مربع النص
      setLocationName(nearestName);

      toast({
        title: 'تم تحديد موقعك بنجاح 📍',
        description: `أقرب مكان تم التعرف عليه: ${nearestName}`,
      });
    } catch (err: any) {
      toast({
        title: 'تنبيه الموقع الجغرافي',
        description: err?.message || 'يرجى التأكد من تفعيل خدمة الموقع (GPS) في هاتفك والمحاولة مجدداً.',
        variant: 'destructive',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // 3. زر حفظ الموقع المعتمد للمستخدم
  const handleSave = async () => {
    const trimmed = locationName.trim();
    if (!trimmed) {
      toast({
        title: 'موقعك مطلوب',
        description: 'يرجى كتابة اسم موقعك أو الضغط على "تحديد موقعي".',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: LocationData = latestData
        ? {
            ...latestData,
            city: latestData.city || trimmed,
            village: latestData.village || trimmed,
            fullAddress: latestData.fullAddress || trimmed,
            latitude: coords?.lat || latestData.latitude || 0,
            longitude: coords?.lng || latestData.longitude || 0,
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
        title: 'تم حفظ موقعك بنجاح ✨',
        description: `سيتم الآن عرض الإعلانات الأقرب إليك في (${trimmed}).`,
      });

      onClose();
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
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-w-md w-[92vw] sm:w-full p-5 text-right font-body bg-card border-border shadow-2xl rounded-2xl"
          dir="rtl"
        >
          <DialogHeader className="text-right space-y-1 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2 text-primary">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold font-headline">
                ضبط الموقع الجغرافي
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              حدد موقعك الدقيق لتشاهد وتصل إلى الإعلانات القريبة منك جداً
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* مربع النص وبجانبه أيقونة الموقع وزر "تحديد موقعي" */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                موقعك الجغرافي (القرية أو المدينة):
              </label>

              <div className="flex items-center gap-2">
                {/* مربع النص لعرض وكتابة التسمية الأقرب */}
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="اكتب قريتك أو مدينتك هنا..."
                    className="h-11 text-sm font-medium pr-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                    }}
                  />
                  <MapPin className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* زر تحديد موقعي بجانب مربع النص */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLocateMeClick}
                  disabled={isDetecting}
                  className="h-11 px-3.5 rounded-xl border-primary/40 hover:bg-primary/10 hover:border-primary text-primary font-bold shrink-0 flex items-center gap-1.5 text-xs shadow-sm"
                >
                  {isDetecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>جارٍ التحديد...</span>
                    </>
                  ) : (
                    <>
                      <LocateFixed className="w-4 h-4 text-primary" />
                      <span>تحديد موقعي</span>
                    </>
                  )}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                يمكنك الضغط على <strong>تحديد موقعي</strong> لجلب التسمية تلقائياً أو كتابتها يدوياً في المربع.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-row-reverse items-center justify-start gap-2 pt-2 border-t border-border/60">
            {/* زر حفظ الموقع */}
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isDetecting}
              className="flex-1 bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-11 rounded-xl shadow-md text-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-1.5" />
                  <span>جارٍ الحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 ml-1.5" />
                  <span>حفظ الموقع</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-11 px-4 font-medium text-muted-foreground hover:text-foreground rounded-xl text-xs"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* رسالة طلب تفعيل الموقع والصلاحية عند الضغط على "تحديد موقعي" */}
      <AlertDialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <AlertDialogContent className="max-w-sm w-[90vw] text-right font-body bg-card border-border rounded-2xl" dir="rtl">
          <AlertDialogHeader className="text-right space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Navigation className="w-5 h-5" />
              </div>
              <AlertDialogTitle className="text-base font-bold font-headline">
                طلب إذن الموقع الجغرافي
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              هل توافق على تفعيل وتحديد موقعك الجغرافي لعرض الإعلانات الأقرب إليك؟
              <br />
              <span className="text-[11px] text-foreground font-semibold mt-1 block">
                ⚠️ يرجى التأكد من تشغيل الموقع (GPS) في هاتفك.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse items-center justify-start gap-2 pt-2">
            <AlertDialogAction
              onClick={handleConfirmLocationPermission}
              className="flex-1 bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-10 rounded-xl text-xs"
            >
              موافق، حدد موقعي
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={() => setShowPermissionDialog(false)}
              className="h-10 px-4 rounded-xl text-xs font-semibold"
            >
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
