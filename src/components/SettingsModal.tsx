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
import { Label } from '@/components/ui/label';
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
  Globe,
  Building2,
  Building,
  Home,
  Sparkles,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import {
  detectUserLocation,
  saveAndSyncLocation,
  loadSavedLocation,
  buildFullAddress,
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

  // المربعات الأربعة (Targeting 4 Boxes)
  const [country, setCountry] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [village, setVillage] = useState('');

  // تحديد أي مربع هو المعتمد لسوق بلدنا
  const [selectedScope, setSelectedScope] = useState<'village' | 'city' | 'governorate' | 'country'>('village');

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      const saved = loadSavedLocation();
      if (saved) {
        setCountry(saved.country && saved.country !== 'غير محدد' ? saved.country : '');
        setGovernorate(saved.governorate && saved.governorate !== 'غير محدد' ? saved.governorate : '');
        setCity(saved.city && saved.city !== 'غير محدد' ? saved.city : '');
        setVillage(saved.village && saved.village !== 'غير محدد' ? saved.village : '');
        if (saved.scope) {
          setSelectedScope(saved.scope as any);
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
    }
  }, [isOpen, userProfile, defaultTab]);

  // 1. الضغط على زر "تحديد موقعي"
  const handleLocateMeClick = () => {
    setShowPermissionDialog(true);
  };

  // 2. عند موافقة المستخدم: تفعيل البحث بالخلفية وتحويل الإحداثيات إلى أسماء وتعبئة المربعات الأربعة
  const handleConfirmLocationPermission = async () => {
    setShowPermissionDialog(false);
    setIsDetecting(true);

    try {
      // استدعاء محرك تحديد الموقع الذكي والـ Geocoder العربي
      const loc = await detectUserLocation();

      // تعبئة المربعات الأربعة بالأسماء المستخرجة
      const c = loc.country && loc.country !== 'غير محدد' ? loc.country : '';
      const g = loc.governorate && loc.governorate !== 'غير محدد' ? loc.governorate : '';
      const ct = loc.city && loc.city !== 'غير محدد' ? loc.city : '';
      const v = loc.village && loc.village !== 'غير محدد' ? loc.village : '';

      setCountry(c);
      setGovernorate(g);
      setCity(ct);
      setVillage(v);

      if (loc.scope) {
        setSelectedScope(loc.scope as any);
      } else if (v) {
        setSelectedScope('village');
      } else if (ct) {
        setSelectedScope('city');
      } else if (g) {
        setSelectedScope('governorate');
      } else if (c) {
        setSelectedScope('country');
      }

      if (loc.latitude && loc.longitude) {
        setCoords({ lat: loc.latitude, lng: loc.longitude });
      }

      toast({
        title: 'تم تحديد موقعك بدقة 🛰️',
        description: `تم تحويل الإحداثيات وتعبئة المربعات: ${loc.fullAddress}`,
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

  // الحصول على القيمة الحالية للمربع المختار
  const getScopeTargetName = () => {
    if (selectedScope === 'village' && village.trim()) return village.trim();
    if (selectedScope === 'city' && city.trim()) return city.trim();
    if (selectedScope === 'governorate' && governorate.trim()) return governorate.trim();
    if (selectedScope === 'country' && country.trim()) return country.trim();
    return village.trim() || city.trim() || governorate.trim() || country.trim() || 'موقعي';
  };

  const getScopeLabelAr = (scope: 'village' | 'city' | 'governorate' | 'country') => {
    switch (scope) {
      case 'village': return 'القرية / الحي';
      case 'city': return 'المدينة / المركز';
      case 'governorate': return 'المحافظة / المنطقة';
      case 'country': return 'الدولة';
    }
  };

  const fullAddress = buildFullAddress(village, city, governorate, country);
  const currentSelectedName = getScopeTargetName();

  // 3. زر حفظ الموقع المعتمد للمستخدم
  const handleSaveLocation = async () => {
    if (!country && !governorate && !city && !village) {
      toast({
        title: 'موقعك مطلوب',
        description: 'يرجى الضغط على زر تحديد الموقع أو كتابة منطقتك في المربعات.',
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
        fullAddress,
        latitude: coords?.lat || 0,
        longitude: coords?.lng || 0,
        scope: selectedScope,
        updatedAt: Date.now(),
      };

      await saveAndSyncLocation(payload, user?.uid);

      toast({
        title: 'تم حفظ وتفعيل سوق بلدنا بنجاح ✨',
        description: `الموقع المعتمد لسوق بلدنا: ${currentSelectedName} (${getScopeLabelAr(selectedScope)})`,
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
          className="max-w-md w-[94vw] sm:w-full p-0 overflow-hidden text-right font-body bg-card border-border shadow-2xl rounded-3xl max-h-[90vh] flex flex-col"
          dir="rtl"
        >
          {/* Header with Title & Tab Switcher */}
          <DialogHeader className="p-4 pb-3 border-b border-border/60 bg-muted/30 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold font-headline">
                    الضبط والحساب
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-muted-foreground">
                    إدارة حسابك وإعدادات الموقع الجغرافي
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center p-1 mt-3 bg-muted rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
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
                  "flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
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
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border/80">
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
              /* ================= 2. قسم ضبط الموقع والمربعات الأربعة ================= */
              <div className="space-y-4 py-1">
                {/* زر التحديد التلقائي عبر الـ GPS */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLocateMeClick}
                  disabled={isDetecting}
                  className="w-full h-12 flex items-center justify-center gap-2 font-bold border-primary/40 bg-primary/5 hover:bg-primary/10 text-foreground rounded-2xl transition-all shadow-sm"
                >
                  {isDetecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-xs">جارٍ قراءة الإحداثيات وتحويلها لأسماء...</span>
                    </>
                  ) : (
                    <>
                      <LocateFixed className="w-5 h-5 text-primary" />
                      <span className="text-xs font-bold">تحديد موقعي وتعبئة المربعات تلقائياً (GPS)</span>
                    </>
                  )}
                </Button>

                {/* المربعات الأربعة (Targeting 4 Boxes) مع إمكانية اختيار أي مربع لسوق بلدنا */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground block">
                      مربعات الموقع (اضغط لاختيار موقع سوق بلدنا):
                    </Label>
                    {coords && (
                      <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-full border border-border">
                        📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 1. الدولة */}
                    <div
                      onClick={() => setSelectedScope('country')}
                      className={cn(
                        "p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                        selectedScope === 'country'
                          ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                          : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-foreground flex items-center gap-1 cursor-pointer">
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
                        className="h-8 text-xs bg-background"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* 2. المحافظة */}
                    <div
                      onClick={() => setSelectedScope('governorate')}
                      className={cn(
                        "p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                        selectedScope === 'governorate'
                          ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                          : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-foreground flex items-center gap-1 cursor-pointer">
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
                        className="h-8 text-xs bg-background"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* 3. المدينة */}
                    <div
                      onClick={() => setSelectedScope('city')}
                      className={cn(
                        "p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                        selectedScope === 'city'
                          ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                          : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-foreground flex items-center gap-1 cursor-pointer">
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
                        className="h-8 text-xs bg-background"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* 4. القرية / الحي */}
                    <div
                      onClick={() => setSelectedScope('village')}
                      className={cn(
                        "p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer relative space-y-1.5",
                        selectedScope === 'village'
                          ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                          : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-foreground flex items-center gap-1 cursor-pointer">
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
                        className="h-8 text-xs bg-background"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>

                {/* بطاقة ملخص المربع المعتمد لسوق بلدنا والعنوان */}
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
                  {fullAddress && fullAddress !== 'غير محدد' && (
                    <p className="text-[10px] text-muted-foreground truncate pt-0.5">
                      العنوان الكامل: {fullAddress}
                    </p>
                  )}
                </div>

                {/* زر حفظ الموقع */}
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveLocation}
                    disabled={isSaving || isDetecting}
                    className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-11 rounded-2xl shadow-md text-xs gap-1.5"
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
        <AlertDialogContent className="max-w-sm w-[90vw] text-right font-body bg-card border-border rounded-3xl p-6" dir="rtl">
          <AlertDialogHeader className="text-right space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <Navigation className="w-5 h-5" />
              </div>
              <AlertDialogTitle className="text-base font-bold font-headline">
                طلب إذن الموقع الجغرافي
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              هل توافق على قراءة موقعك الجغرافي لتحويل الإحداثيات لأسماء وتعبئة المربعات الأربعة؟
              <br />
              <span className="text-[11px] text-foreground font-semibold mt-2 block">
                ⚠️ يرجى التأكد من تشغيل الموقع (GPS) في هاتفك أو متصفحك.
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
    </>
  );
}
