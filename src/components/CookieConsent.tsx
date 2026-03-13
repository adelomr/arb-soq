
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

const t = {
    cookieConsent: "يستخدم هذا الموقع ملفات تعريف الارتباط لضمان حصولك على أفضل تجربة.",
    accept: "موافق",
}

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
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg p-4 z-50">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-foreground">
          <Cookie className="h-5 w-5 shrink-0" />
          <p>{t.cookieConsent}</p>
        </div>
        <Button onClick={handleAccept}>{t.accept}</Button>
      </div>
    </div>
  );
}
