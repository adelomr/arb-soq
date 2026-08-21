
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';

const t = {
    cookieConsent: "يستخدم هذا الموقع ملفات تعريف الارتباط لضمان حصولك على أفضل تجربة تصفح واستخدام.",
    accept: "موافق",
};

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // This effect runs only on the client side
    const consent = localStorage.getItem('cookie_consent');
    if (consent !== 'true') {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      dir="rtl"
      className="fixed bottom-20 md:bottom-6 inset-x-3 sm:inset-x-auto sm:left-6 sm:max-w-md bg-card/95 backdrop-blur-xl border border-border/90 shadow-2xl rounded-2xl p-4 z-[100] transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Cookie className="h-5 w-5" />
            </div>
            <span className="font-bold text-sm text-foreground">ملفات تعريف الارتباط</span>
          </div>
          <button 
            onClick={handleAccept}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t.cookieConsent}
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button size="sm" onClick={handleAccept} className="w-full sm:w-auto font-medium shadow-sm">
            {t.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}

