'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutGrid, Plus, MapPin, User, LogIn, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import RequireAuthModal from '@/components/RequireAuthModal';
import BaladnaLocationModal, { BALADNA_STORAGE_KEY } from '@/components/BaladnaLocationModal';
import SettingsModal from '@/components/SettingsModal';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, getUserNotifications } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('يجب تسجيل الدخول حتى تتمكن من إضافة إعلان');
  const [authModalRedirect, setAuthModalRedirect] = useState('/submit');
  const [mounted, setMounted] = useState(false);
  const [savedBalad, setSavedBalad] = useState<string>('');

  // Long press refs
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const updateSavedBalad = () => {
      const b = localStorage.getItem(BALADNA_STORAGE_KEY) || '';
      setSavedBalad(b);
    };
    updateSavedBalad();

    window.addEventListener('baladna-location-changed', updateSavedBalad);
    window.addEventListener('arb-soq-location-updated', updateSavedBalad);
    return () => {
      window.removeEventListener('baladna-location-changed', updateSavedBalad);
      window.removeEventListener('arb-soq-location-updated', updateSavedBalad);
    };
  }, []);

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

  const handleAccountClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      router.push('/login?redirectUrl=/profile');
    }
  };

  // معالجة الضغطة المطولة على زر سوق بلدنا
  const handleBaladnaTouchStart = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(60);
        }
      } catch {
        // Ignored
      }
      setShowLocationModal(true);
    }, 550); // 550ms للضغطة المطولة
  };

  const handleBaladnaTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleBaladnaClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      isLongPressRef.current = false;
      return;
    }

    // إذا لم يكن المستخدم قد حدد بلده مسبقاً، نفتح له نافذة التحديد لأول مرة
    const currentSaved = localStorage.getItem(BALADNA_STORAGE_KEY);
    if (!currentSaved) {
      e.preventDefault();
      setShowLocationModal(true);
      return;
    }
    // إذا كان محدداً، ينتقل لصفحة سوق بلدنا بشكل طبيعي
  };

  const isHomeActive = pathname === '/';
  const isCategoriesActive = pathname?.startsWith('/categories') || pathname?.startsWith('/category');
  const isAddActive = pathname === '/submit';
  const isBaladnaActive = pathname?.startsWith('/sooq-baladna');
  const isSettingsActive = showSettingsModal || pathname === '/settings';
  const isAccountActive = pathname?.startsWith('/profile') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/login');

  return (
    <>
      <nav
        dir="rtl"
        aria-label="شريط التنقل السريع"
        className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/80 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)] transition-all duration-300 select-none pb-[max(env(safe-area-inset-bottom,0px),6px)] pt-1"
      >
        <div className="max-w-lg mx-auto px-1 flex items-center justify-around relative">
          
          {/* 1. الرئيسية */}
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all duration-200 group relative",
              isHomeActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <div className="relative p-0.5">
              <Home className={cn("w-5 h-5 transition-transform duration-200", isHomeActive ? "scale-110 stroke-[2.4]" : "group-hover:scale-105")} />
              {isHomeActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn("text-[10px] sm:text-[11px] tracking-tight transition-all duration-200 mt-0.5", isHomeActive ? "font-bold text-primary" : "font-medium")}>
              الرئيسية
            </span>
          </Link>

          {/* 2. الأقسام */}
          <Link
            href="/categories"
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all duration-200 group relative",
              isCategoriesActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <div className="relative p-0.5">
              <LayoutGrid className={cn("w-5 h-5 transition-transform duration-200", isCategoriesActive ? "scale-110 stroke-[2.4]" : "group-hover:scale-105")} />
              {isCategoriesActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn("text-[10px] sm:text-[11px] tracking-tight transition-all duration-200 mt-0.5", isCategoriesActive ? "font-bold text-primary" : "font-medium")}>
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

          {/* 4. سوق بلدنا */}
          <Link
            href="/sooq-baladna"
            onClick={handleBaladnaClick}
            onTouchStart={handleBaladnaTouchStart}
            onTouchEnd={handleBaladnaTouchEnd}
            onMouseDown={handleBaladnaTouchStart}
            onMouseUp={handleBaladnaTouchEnd}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowLocationModal(true);
            }}
            title={savedBalad ? `سوق بلدنا (${savedBalad}) - اضغط مطولاً لتغيير البلد` : 'سوق بلدنا - اضغط مطولاً لتحديد بلدك'}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all duration-200 group relative",
              isBaladnaActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <div className="relative p-0.5">
              <MapPin className={cn("w-5 h-5 transition-transform duration-200", isBaladnaActive ? "scale-110 stroke-[2.4] text-primary" : "group-hover:scale-105")} />
              {savedBalad && !isBaladnaActive && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-background" title={`محدد: ${savedBalad}`} />
              )}
              {isBaladnaActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn("text-[10px] sm:text-[11px] tracking-tight transition-all duration-200 mt-0.5 truncate max-w-[58px]", isBaladnaActive ? "font-bold text-primary" : "font-medium")}>
              {savedBalad ? savedBalad : 'سوق بلدنا'}
            </span>
          </Link>

          {/* 5. الضبط (أيقونة الترس المضافة لفتح ضبط الموقع الجغرافي والإعدادات) */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            aria-label="الضبط"
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all duration-200 group relative",
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
              {isSettingsActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn("text-[10px] sm:text-[11px] tracking-tight transition-all duration-200 mt-0.5", isSettingsActive ? "font-bold text-primary" : "font-medium")}>
              الضبط
            </span>
          </button>

          {/* 6. حسابي / دخول */}
          <Link
            href={isAuthenticated ? "/profile" : "/login?redirectUrl=/profile"}
            onClick={handleAccountClick}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all duration-200 group relative",
              isAccountActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <div className="relative p-0.5">
              {isAuthenticated ? (
                <User className={cn("w-5 h-5 transition-transform duration-200", isAccountActive ? "scale-110 stroke-[2.4]" : "group-hover:scale-105")} />
              ) : (
                <LogIn className={cn("w-5 h-5 transition-transform duration-200", isAccountActive ? "scale-110 stroke-[2.4]" : "group-hover:scale-105")} />
              )}

              {/* شارة الإشعارات غير المقروءة */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground ring-2 ring-background animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}

              {isAccountActive && unreadCount === 0 && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn("text-[10px] sm:text-[11px] tracking-tight transition-all duration-200 mt-0.5", isAccountActive ? "font-bold text-primary" : "font-medium")}>
              {isAuthenticated ? 'حسابي' : 'دخول'}
            </span>
          </Link>

        </div>
      </nav>

      {/* نافذة التنبيه بتسجيل الدخول عند محاولة إضافة إعلان كزائر */}
      <RequireAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authModalMessage}
        redirectUrl={authModalRedirect}
      />

      {/* نافذة تحديد وحفظ البلد / القرية لسوق بلدنا */}
      <BaladnaLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />

      {/* نافذة ضبط التطبيق والموقع الجغرافي الاحترافية */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        defaultTab="location"
      />
    </>
  );
}
