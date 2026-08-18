'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutGrid, Plus, MapPin, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import RequireAuthModal from '@/components/RequireAuthModal';
import SettingsModal from '@/components/SettingsModal';
import { loadSavedLocation, getBestLocationName, BALADNA_STORAGE_KEY } from '@/lib/locationEngine';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, getUserNotifications } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('يجب تسجيل الدخول حتى تتمكن من إضافة إعلان');
  const [authModalRedirect, setAuthModalRedirect] = useState('/submit');
  const [mounted, setMounted] = useState(false);
  const [savedLocationName, setSavedLocationName] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    const updateLocation = () => {
      const saved = loadSavedLocation();
      if (saved) {
        const name = getBestLocationName(saved);
        if (name && name !== 'تحديد الموقع' && name !== 'غير محدد') {
          setSavedLocationName(name);
          return;
        }
      }
      const legacy = localStorage.getItem(BALADNA_STORAGE_KEY) || '';
      if (legacy && legacy !== 'غير محدد') {
        setSavedLocationName(legacy);
        return;
      }
      if (userProfile) {
        const name = userProfile.village || userProfile.city || userProfile.governorate || '';
        if (name) {
          setSavedLocationName(name);
          return;
        }
      }
      setSavedLocationName('');
    };

    updateLocation();

    window.addEventListener('arb-soq-location-updated', updateLocation);
    window.addEventListener('baladna-location-changed', updateLocation);
    return () => {
      window.removeEventListener('arb-soq-location-updated', updateLocation);
      window.removeEventListener('baladna-location-changed', updateLocation);
    };
  }, [userProfile]);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = getUserNotifications(user.uid, (notifications) => {
        const unread = notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      });
      return () => unsubscribe();
    } else {
      setUnreadCount(0);
    }
  }, [user, getUserNotifications]);

  // Don't render on admin dashboard or inside embedded iframes if needed
  if (!mounted) return null;
  if (pathname?.startsWith('/admin')) return null;
  // إخفاء شريط التنقل السريع في صفحات الهبوط (الصفحات المخصصة)
  if (pathname?.startsWith('/p/')) return null;

  const isAuthenticated = !!user;

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push('/submit');
    } else {
      setAuthModalMessage('يجب تسجيل الدخول حتى تتمكن من إضافة إعلان جديد');
      setAuthModalRedirect('/submit');
      setShowAuthModal(true);
    }
  };

  const isHomeActive = pathname === '/';
  const isCategoriesActive = pathname?.startsWith('/categories') || pathname?.startsWith('/category');
  const isAddActive = pathname === '/submit';
  const isBaladnaActive = pathname?.startsWith('/sooq-baladna');
  const isSettingsActive = showSettingsModal || pathname === '/settings' || pathname?.startsWith('/profile') || pathname?.startsWith('/dashboard');

  return (
    <>
      <nav
        dir="rtl"
        aria-label="شريط التنقل السريع"
        className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/80 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)] transition-all duration-300 select-none pb-[max(env(safe-area-inset-bottom,0px),6px)] pt-1"
      >
        <div className="max-w-md mx-auto px-2 flex items-center justify-between relative">
          
          {/* 1. الرئيسية */}
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 group relative",
              isHomeActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <div className="relative p-0.5">
              <Home className={cn("w-5 h-5 transition-transform duration-200", isHomeActive ? "scale-110 stroke-[2.4]" : "group-hover:scale-105")} />
              {isHomeActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn("text-[11px] tracking-tight transition-all duration-200 mt-0.5", isHomeActive ? "font-bold text-primary" : "font-medium")}>
              الرئيسية
            </span>
          </Link>

          {/* 2. الأقسام */}
          <Link
            href="/categories"
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 group relative",
              isCategoriesActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <div className="relative p-0.5">
              <LayoutGrid className={cn("w-5 h-5 transition-transform duration-200", isCategoriesActive ? "scale-110 stroke-[2.4]" : "group-hover:scale-105")} />
              {isCategoriesActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn("text-[11px] tracking-tight transition-all duration-200 mt-0.5", isCategoriesActive ? "font-bold text-primary" : "font-medium")}>
              الأقسام
            </span>
          </Link>

          {/* 3. زر أضف إعلان (FAB بارز في المنتصف) */}
          <div className="flex-1 flex flex-col items-center justify-center relative -top-2.5">
            <button
              onClick={handleAddClick}
              aria-label="أضف إعلان مجاناً"
              className={cn(
                "relative group flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-primary via-primary to-accent text-primary-foreground shadow-lg shadow-primary/35 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 active:scale-90 border-[3px] border-background",
                isAddActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <Plus className="w-6 h-6 stroke-[2.8] transition-transform duration-300 group-hover:rotate-90" />
              <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <span className={cn("text-[10px] font-bold text-primary tracking-tight mt-0.5", isAddActive && "text-accent")}>
              أضف إعلان
            </span>
          </div>

          {/* 4. إعلانات بلدنا */}
          <Link
            href="/sooq-baladna"
            title={savedLocationName ? `إعلانات ${savedLocationName}` : 'إعلانات بلدنا'}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 group relative",
              isBaladnaActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <div className="relative p-0.5">
              <MapPin className={cn("w-5 h-5 transition-transform duration-200", isBaladnaActive ? "scale-110 stroke-[2.4] text-primary" : "group-hover:scale-105")} />
              {isBaladnaActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn("text-[11px] tracking-tight transition-all duration-200 mt-0.5 truncate max-w-[70px]", isBaladnaActive ? "font-bold text-primary" : "font-medium")}>
              {savedLocationName ? savedLocationName : 'إعلانات بلدنا'}
            </span>
          </Link>

          {/* 5. الضبط والحساب (أيقونة الترس المدمجة لحسابي والموقع) */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            aria-label="الضبط والحساب"
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 group relative",
              isSettingsActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <div className="relative p-0.5">
              <Settings
                className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isSettingsActive ? "scale-110 stroke-[2.4] rotate-90 text-primary" : "group-hover:rotate-45 group-hover:scale-105"
                )}
              />

              {/* شارة الإشعارات غير المقروءة */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground ring-2 ring-background animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}

              {isSettingsActive && unreadCount === 0 && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn("text-[11px] tracking-tight transition-all duration-200 mt-0.5", isSettingsActive ? "font-bold text-primary" : "font-medium")}>
              {isAuthenticated ? 'الضبط' : 'دخول / ضبط'}
            </span>
          </button>

        </div>
      </nav>

      {/* نافذة التنبيه بتسجيل الدخول عند محاولة إضافة إعلان كزائر */}
      <RequireAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authModalMessage}
        redirectUrl={authModalRedirect}
      />

      {/* نافذة ضبط التطبيق والحساب والموقع الجغرافي المدمجة */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        defaultTab="account"
      />
    </>
  );
}
