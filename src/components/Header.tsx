

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, PlusCircle, User, LayoutDashboard, LogOut, Globe, LogIn, Sun, Moon, Minus, Plus, Undo2, Shield, Bell, Trash2, Info, Wallet, Megaphone, X, BadgeDollarSign, Store, Edit, ShoppingCart, MapPin } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import type { Notification, Announcement } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { useFontSize } from '@/context/FontSizeContext';
import { useMarket } from '@/context/MarketContext';
import { markets } from '@/lib/markets';
import { useCart } from '@/context/CartContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { appIconUrl } from '@/lib/data';

const FlagIcon = ({ code }: { code: string }) => (
  <Image 
    src={`https://flagsapi.com/${code}/shiny/64.png`} 
    alt={`${code} flag`}
    width={24}
    height={18}
    className="w-6 h-auto rounded-sm"
  />
);

export const navTranslations = {
    ar: {
      dashboard: 'لوحة التحكم',
      submitAd: 'إضافة إعلان',
      appName: 'سوق العرب',
      profile: 'الملف الشخصي',
      logout: 'تسجيل الخروج',
      login: 'تسجيل الدخول',
      decreaseFont: "تصغير الخط",
      resetFont: "إعادة تعيين الخط",
      increaseFont: "تكبير الخط",
      toggleTheme: "تبديل الوضع",
      changeLanguage: "تغيير اللغة",
      toggleMenu: "تبديل القائمة",
      changeMarket: "تغيير السوق",
      adminDashboard: "لوحة تحكم المسؤول",
      notifications: "الإشعارات",
      noNotifications: "لا توجد إشعارات جديدة.",
      deleteNotification: "حذف الإشعار",
      generalNotification: "عام",
      privateNotification: "خاص",
      mobileMenuTitle: "القائمة الرئيسية",
      mobileMenuDescription: "تنقل عبر أقسام الموقع.",
      wallet: "المحفظة",
      pricing: "العروض",
      closeNotificationBar: "إغلاق شريط الإشعارات",
      createStore: "إنشاء متجر",
      myStore: "متجري",
      editStore: "تعديل المتجر",
      contactUs: "اتصل بنا",
      cookieConsent: "يستخدم هذا الموقع ملفات تعريف الارتباط لضمان حصولك على أفضل تجربة.",
      accept: "موافق",
      cart: "سلة المشتريات",
      linkCopied: 'تم نسخ الرابط!',
      laborMarket: 'سوق العمال',
      nearestToMe: 'الأقرب مني',
      blog: 'المنتدى',
    },
};

const NotificationBar = () => {
    const { getAnnouncement } = useAuth();
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            const data = await getAnnouncement();
            if (data && data.isEnabled) {
                const storedState = typeof window !== 'undefined' ? localStorage.getItem(`announcement_${data.id}_closed`) : 'false';
                if (storedState !== 'true') {
                    setAnnouncement(data);
                    setVisible(true);
                }
            }
        };
        fetchAnnouncement();
    }, [getAnnouncement]);

    const handleClose = () => {
        if (announcement && typeof window !== 'undefined') {
            localStorage.setItem(`announcement_${announcement.id}_closed`, 'true');
        }
        setVisible(false);
    };

    if (!visible || !announcement) {
        return null;
    }

    const t = navTranslations.ar;
    const message = announcement.message.ar;
    const linkText = announcement.linkText ? announcement.linkText.ar : '';

    const barStyle: React.CSSProperties = {
        backgroundColor: announcement.backgroundColor || '#186959',
        color: announcement.textColor || '#FFFFFF',
    };
    
    const linkStyle: React.CSSProperties = {
        color: announcement.textColor || '#FFFFFF',
    }

    return (
        <div 
            className="relative" 
            style={barStyle}
        >
            <div className="container mx-auto px-4 py-2 text-sm text-center">
                <div className="flex items-center justify-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    <p>
                        {message}
                        {announcement.link && linkText && (
                            <Link href={announcement.link} className='font-bold underline ml-2' style={linkStyle}>
                                {linkText}
                            </Link>
                        )}
                    </p>
                </div>
            </div>
            <button
                onClick={handleClose}
                className='absolute top-1/2 -translate-y-1/2 rounded-full p-1 right-4'
                aria-label={t.closeNotificationBar}
                style={{ color: announcement.textColor || undefined }}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};


export default function Header() {
  const [isClient, setIsClient] = useState(false);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const { user, userProfile, signOutUser, getUserNotifications, deleteNotification, markNotificationsAsRead } = useAuth();
  const { theme, setTheme } = useTheme();
  const { increase: increaseFontSize, decrease: decreaseFontSize, reset: resetFontSize } = useFontSize();
  const { market, setMarket, sortAdsByDistance } = useMarket();
  const { cart } = useCart();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadCountRef = useRef(0);
  
  const currentLabels = navTranslations.ar;
  const direction = 'rtl';

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = getUserNotifications(user.uid, (newNotifications) => {
        setNotifications(newNotifications);
        const newUnreadCount = newNotifications.filter(n => !n.isRead).length;
        setUnreadCount(newUnreadCount);
      });

      return () => unsubscribe();
    }
  }, [user, getUserNotifications]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Audio) {
        if (unreadCount > 0 && unreadCount > prevUnreadCountRef.current) {
            const audio = new Audio('https://cdn.pixabay.com/audio/2022/10/13/audio_a46a6d9197.mp3');
            audio.play().catch(error => console.error("Error playing notification sound:", error));
        }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const isAuthenticated = !!user;
  const isAdmin = userProfile?.role === 'admin';
  const hasStore = !!userProfile?.store;
  const dateLocale = ar;

  const handleOpenNotifications = (open: boolean) => {
    if (open && user?.uid && unreadCount > 0) {
      markNotificationsAsRead(user.uid);
    }
  }

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
      e.stopPropagation();
      e.preventDefault();
      deleteNotification(notificationId);
  }
  
  const laborMarketHref = userProfile?.profession ? `/worker/${user?.uid}` : '/labor-market';

  if (!isClient) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center justify-between">
          {/* Skeleton or placeholder for server render */}
        </div>
      </header>
    );
  }

  return (
    <>
      <NotificationBar />
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 md:gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg font-headline">
              <Image src={appIconUrl} alt="App Icon" width={64} height={64} className="h-12 w-12 sm:h-16 sm:w-16" />
              <span className="hidden sm:inline text-xl">{currentLabels.appName}</span>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" onClick={() => sortAdsByDistance()} className="hidden sm:inline-flex h-10 items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{currentLabels.nearestToMe}</span>
              </Button>
              <div className="hidden sm:flex items-center gap-1 bg-secondary/50 border p-1 rounded-lg">
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={decreaseFontSize}
                      className="h-8 w-8"
                      >
                      <Minus className="h-4 w-4" />
                      <span className="sr-only">{currentLabels.decreaseFont}</span>
                  </Button>
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={resetFontSize}
                      className="h-8 w-8"
                      >
                      <Undo2 className="h-4 w-4" />
                      <span className="sr-only">{currentLabels.resetFont}</span>
                  </Button>
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={increaseFontSize}
                      className="h-8 w-8"
                      >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">{currentLabels.increaseFont}</span>
                  </Button>
              </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9 sm:h-10 sm:w-10"
              >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{currentLabels.toggleTheme}</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 sm:h-10 px-2 sm:px-3 justify-between max-w-[120px] xs:max-w-none">
                    <span className="hidden xs:inline flex-1 text-left truncate">{market.name.ar}</span>
                    <FlagIcon code={market.flagCode} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                  <ScrollArea className="h-72">
                      {markets.map((m) => (
                          <DropdownMenuItem key={m.id} onSelect={() => setMarket(m)}>
                              <FlagIcon code={m.flagCode} />
                              <span className="mx-2">{m.name.ar}</span>
                          </DropdownMenuItem>
                      ))}
                  </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated ? (
              <>
                <Button asChild className="hidden sm:flex h-10">
                  <Link href="/submit">
                    <PlusCircle className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {currentLabels.submitAd}
                  </Link>
                </Button>

                <Link href="/cart" passHref>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full border">
                    <ShoppingCart className="h-5 w-5" />
                    {cart.length > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {cart.length}
                      </Badge>
                    )}
                     <span className="sr-only">{currentLabels.cart}</span>
                  </Button>
                </Link>

                <DropdownMenu onOpenChange={handleOpenNotifications}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 md:w-96">
                    <DropdownMenuLabel>{currentLabels.notifications}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-64">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <DropdownMenuItem key={notification.id} className="flex items-start gap-2 cursor-default">
                            <div className={`mt-1 p-1.5 rounded-full ${notification.type === 'general' ? 'bg-blue-500/20' : 'bg-primary/20'}`}>
                                  <Info className={`h-4 w-4 ${notification.type === 'general' ? 'text-blue-500' : 'text-primary'}`} />
                              </div>
                            <div className="flex-1">
                              <p className="text-sm">{notification.message}</p>
                              <div className="text-xs text-muted-foreground">
                                {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: dateLocale }) : ''}
                                <Badge variant="outline" className="mx-2">{notification.type === 'general' ? currentLabels.generalNotification : currentLabels.privateNotification}</Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleDeleteNotification(e, notification.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="text-center text-sm text-muted-foreground p-4">
                          {currentLabels.noNotifications}
                        </div>
                      )}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userProfile?.avatarUrl || undefined} alt={userProfile?.name} />
                        <AvatarFallback>{userProfile?.name?.[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin"><Shield className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />{currentLabels.adminDashboard}</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard"><LayoutDashboard className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />{currentLabels.dashboard}</Link>
                    </DropdownMenuItem>
                     {hasStore ? (
                        <DropdownMenuItem asChild>
                           <Link href={`/store/${user.uid}`}><Store className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />{currentLabels.myStore}</Link>
                        </DropdownMenuItem>
                    ) : (
                       <DropdownMenuItem asChild>
                         <Link href="/store/create"><Store className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />{currentLabels.createStore}</Link>
                       </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/wallet"><Wallet className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />{currentLabels.wallet}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing"><BadgeDollarSign className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />{currentLabels.pricing}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile"><User className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />{currentLabels.profile}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOutUser}>
                      <LogOut className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                      {currentLabels.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild className="h-9 sm:h-10">
                  <Link href="/login">
                    <LogIn className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {currentLabels.login}
                  </Link>
                </Button>
            )}

            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden h-9 w-9 sm:h-10 sm:w-10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{currentLabels.toggleMenu}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={direction === 'rtl' ? 'right' : 'left'} className="pr-0">
                <SheetHeader>
                  <SheetTitle className="sr-only">{currentLabels.mobileMenuTitle}</SheetTitle>
                  <SheetDescription className="sr-only">{currentLabels.mobileMenuDescription}</SheetDescription>
                  <Link href="/" className="flex items-center gap-2 font-bold text-lg font-headline mb-6">
                    <Image src={appIconUrl} alt="App Icon" width={32} height={32} className="h-8 w-8" />
                    <span>{currentLabels.appName}</span>
                  </Link>
                </SheetHeader>
                <div className="flex flex-col gap-4">
                  {isAdmin && (
                      <Link
                          href="/admin"
                          onClick={() => setSheetOpen(false)}
                          className={cn(
                          'font-medium transition-colors hover:text-primary',
                          pathname === '/admin' ? 'text-primary' : 'text-muted-foreground'
                          )}
                      >
                          {currentLabels.adminDashboard}
                      </Link>
                  )}
                   <Link
                      href="/pricing"
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                      'font-medium transition-colors hover:text-primary',
                      pathname === '/pricing' ? 'text-primary' : 'text-muted-foreground'
                      )}
                  >
                      {currentLabels.pricing}
                  </Link>
                   <Link
                      href={laborMarketHref}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                      'font-medium transition-colors hover:text-primary',
                      pathname === '/labor-market' || pathname.startsWith('/worker/') ? 'text-primary' : 'text-muted-foreground'
                      )}
                  >
                      {currentLabels.laborMarket}
                  </Link>
                  <Link
                      href="/forum"
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                      'font-medium transition-colors hover:text-primary',
                      pathname.startsWith('/forum') ? 'text-primary' : 'text-muted-foreground'
                      )}
                  >
                      {currentLabels.blog}
                  </Link>
                  <Separator />
                  <Button asChild>
                      <Link href="/submit" onClick={() => setSheetOpen(false)}>
                          <PlusCircle className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                          {currentLabels.submitAd}
                      </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
