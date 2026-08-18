'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Navigation,
  Settings,
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

export default function SettingsClient() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [latestData, setLatestData] = useState<LocationData | null>(null);

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
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
  }, [userProfile]);

  const handleLocateMeClick = () => {
    setShowPermissionDialog(true);
  };

  const handleConfirmLocationPermission = async () => {
    setShowPermissionDialog(false);
    setIsDetecting(true);

    try {
      const gps = await getCurrentGpsPosition();
      setCoords({ lat: gps.latitude, lng: gps.longitude });

      const geocoded = await reverseGeocodeCoordinates(
        gps.latitude,
        gps.longitude,
        gps.accuracy
      );
      setLatestData(geocoded);

      const nearestName =
        geocoded.village ||
        geocoded.city ||
        geocoded.governorate ||
        geocoded.fullAddress;

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
        description: `الموقع المعتمد: ${trimmed}`,
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

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-headline">ضبط الموقع الجغرافي</h1>
            <p className="text-xs text-muted-foreground">
              حدد موقعك الدقيق لتشاهد وتصل إلى الإعلانات القريبة منك جداً
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              موقعك الجغرافي (القرية أو المدينة):
            </label>

            <div className="flex items-center gap-2">
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
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isDetecting}
              className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-11 rounded-xl shadow-md text-sm"
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
          </div>
        </div>
      </main>

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

      <Footer />
    </div>
  );
}
