'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  MapPin,
  LocateFixed,
  Loader2,
  Check,
  Navigation,
  User,
  LayoutDashboard,
  Store,
  BadgeDollarSign,
  LogOut,
  LogIn,
  BadgeCheck,
  Shield,
  Settings,
  UserPlus,
  ChevronLeft,
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
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'account' | 'location';
}

export default function SettingsModal({ isOpen, onClose, defaultTab = 'account' }: SettingsModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, signOutUser } = useAuth();

  const isAdmin = userProfile?.role === 'admin';
  const hasStore = !!userProfile?.store;

  const [activeTab, setActiveTab] = useState<'account' | 'location'>(defaultTab);
  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [latestData, setLatestData] = useState<LocationData | null>(null);

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
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
  }, [isOpen, userProfile, defaultTab]);

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
  const handleSaveLocation = async () => {
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

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = async () => {
    onClose();
    await signOutUser();
    toast({
      title: 'تم تسجيل الخروج',
      description: 'نراك قريباً في سوق العرب!',
    });
  };

  const isAuthenticated = !!user;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-w-md w-[94vw] sm:w-full p-0 overflow-hidden text-right font-body bg-card border-border shadow-2xl rounded-2xl max-h-[88vh] flex flex-col"
          dir="rtl"
        >
          {/* Header with Title & Tab Switcher */}
          <DialogHeader className="p-4 pb-3 border-b border-border/60 bg-muted/30 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold font-headline">
                    الضبط والحساب
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-muted-foreground">
                    إدارة حسابك وإعدادات الموقع والتطبيق
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center p-1 mt-3 bg-muted rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'account'
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <User className="w-3.5 h-3.5" />
                <span>حسابي</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('location')}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'location'
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>ضبط الموقع</span>
              </button>
            </div>
          </DialogHeader>

          {/* Modal Body */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {activeTab === 'account' ? (
              /* ================= 1. قسم حسابي ================= */
              <div className="space-y-4">
                {isAuthenticated ? (
                  <>
                    {/* User Card */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/80">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={userProfile?.avatarUrl || user?.photoURL || undefined} alt={userProfile?.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {userProfile?.name?.[0]?.toUpperCase() || 'م'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-foreground truncate">{userProfile?.name || 'مستخدم سوق العرب'}</h4>
                          {userProfile?.verified && (
                            <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user?.email || userProfile?.phone || ''}</p>
                      </div>
                    </div>

                    {/* Account Links */}
                    <div className="space-y-1">
                      {isAdmin && (
                        <button
                          onClick={() => handleNavigate('/admin')}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/80 text-foreground transition-colors text-xs font-medium group"
                        >
                          <div className="flex items-center gap-2.5 text-primary">
                            <Shield className="w-4 h-4" />
                            <span className="font-bold">لوحة الإدارة (Admin)</span>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform" />
                        </button>
                      )}

                      <button
                        onClick={() => handleNavigate('/profile')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/80 text-foreground transition-colors text-xs font-medium group"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="w-4 h-4 text-primary" />
                          <span>الملف الشخصي وبياناتي</span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform" />
                      </button>

                      <button
                        onClick={() => handleNavigate('/dashboard')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/80 text-foreground transition-colors text-xs font-medium group"
                      >
                        <div className="flex items-center gap-2.5">
                          <LayoutDashboard className="w-4 h-4 text-primary" />
                          <span>لوحة التحكم وإعلاناتي</span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform" />
                      </button>

                      {hasStore ? (
                        <button
                          onClick={() => handleNavigate(`/store/${user.uid}`)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/80 text-foreground transition-colors text-xs font-medium group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Store className="w-4 h-4 text-primary" />
                            <span>متجري الإلكتروني</span>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleNavigate('/store/create')}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/80 text-foreground transition-colors text-xs font-medium group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Store className="w-4 h-4 text-primary" />
                            <span>إنشاء متجر خاص</span>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform" />
                        </button>
                      )}

                      <button
                        onClick={() => handleNavigate('/pricing')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/80 text-foreground transition-colors text-xs font-medium group"
                      >
                        <div className="flex items-center gap-2.5">
                          <BadgeDollarSign className="w-4 h-4 text-primary" />
                          <span>الباقات والترقيات</span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform" />
                      </button>

                      <div className="pt-2 border-t border-border/60">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors text-xs font-bold group"
                        >
                          <div className="flex items-center gap-2.5">
                            <LogOut className="w-4 h-4" />
                            <span>تسجيل الخروج</span>
                          </div>
                          <ChevronLeft className="w-4 h-4 opacity-50" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Guest View */
                  <div className="space-y-4 py-2 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-1">
                      <User className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">أهلاً بك في سوق العرب</h4>
                      <p className="text-xs text-muted-foreground px-4">
                        سجل دخولك لإضافة إعلاناتك والتواصل مع البائعين وإدارة حسابك
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        type="button"
                        onClick={() => handleNavigate('/login?redirectUrl=/profile')}
                        className="w-full bg-primary text-primary-foreground font-bold h-10 rounded-xl text-xs gap-1.5 shadow-sm"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>تسجيل الدخول</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleNavigate('/login?mode=signup')}
                        className="w-full border-primary/30 text-primary hover:bg-primary/10 font-bold h-10 rounded-xl text-xs gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>حساب جديد</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ================= 2. قسم ضبط الموقع ================= */
              <div className="space-y-4 py-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    موقعك الجغرافي (القرية أو الحي أو المدينة):
                  </label>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="اكتب قريتك أو مدينتك هنا..."
                        className="h-11 text-sm font-medium pr-9 rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveLocation();
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

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    اضغط على <strong>تحديد موقعي</strong> لجلب أقرب قرية أو شارع بالـ GPS تلقائياً، أو اكتب اسم موقعك يدوياً ثم اضغط حفظ.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveLocation}
                    disabled={isSaving || isDetecting}
                    className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-11 rounded-xl shadow-md text-xs gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جارٍ الحفظ...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>حفظ الموقع المعتمد</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
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
