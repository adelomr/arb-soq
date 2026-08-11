'use client';

import { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { markets, Market } from '@/lib/markets';
import { detectMarketFromTimezone, getInitialMarket } from '@/lib/location';
import { useToast } from '@/hooks/use-toast';

interface MarketContextType {
  market: Market;
  setMarket: (market: Market) => void;
  loading: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  sortAdsByDistance: () => void;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: ReactNode }) {
  // 1. القيمة الابتدائية: تعتمد فوراً على المنطقة الزمنية للمستخدم بدلاً من اختيار السعودية افتراضياً
  const [market, setMarketState] = useState<Market>(getInitialMarket);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const setMarket = useCallback((newMarket: Market) => {
    setMarketState(newMarket);
    if (typeof window !== 'undefined') {
      // نحفظ فقط تحت مفتاح "اختيار المستخدم اليدوي" الصريح
      localStorage.setItem('userSelectedMarketId', newMarket.id);
    }
  }, []);

  const detectMarket = useCallback(async (): Promise<Market | null> => {
    setLoading(true);

    // 1. تجربة API الداخلي للسيرفر /api/location (سريع ويعتمد على ترويسات السيرفر والـ IP)
    try {
      const res = await fetch('/api/location', { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.marketId) {
          const found = markets.find(m => m.id === data.marketId);
          if (found) {
            setMarketState(found);
            setLoading(false);
            return found;
          }
        }
      }
    } catch {
      // الانتقال للمزود التالي
    }

    // 2. تجربة ipwho.is (مجاني، لا يتطلب API key، يدعم CORS، وسريع جداً)
    try {
      const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.country_code) {
          const code = data.country_code.toLowerCase();
          const found = markets.find(m => m.id === code || m.flagCode.toLowerCase() === code);
          if (found) {
            setMarketState(found);
            setLoading(false);
            return found;
          }
        }
      }
    } catch {
      // الانتقال للمزود التالي
    }

    // 3. تجربة ipapi.co كبديل احتياطي ثالث
    try {
      const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(2500) });
      if (response.ok) {
        const data = await response.json();
        const countryCode = data.country_code?.toLowerCase();
        const found = markets.find(m => m.id === countryCode || m.flagCode.toLowerCase() === countryCode);
        if (found) {
          setMarketState(found);
          setLoading(false);
          return found;
        }
      }
    } catch {
      // الانتقال للمزود التالي
    }

    // 4. تجربة ip-api.com كبديل احتياطي رابع
    try {
      const response = await fetch('https://ip-api.com/json/?fields=status,countryCode', { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.countryCode) {
          const countryCode = data.countryCode.toLowerCase();
          const found = markets.find(m => m.id === countryCode || m.flagCode.toLowerCase() === countryCode);
          if (found) {
            setMarketState(found);
            setLoading(false);
            return found;
          }
        }
      }
    } catch {
      // الانتقال للمزود التالي
    }

    // 5. البديل الاحتياطي الخامس: المنطقة الزمنية (Timezone)
    const tzMarket = detectMarketFromTimezone();
    if (tzMarket) {
      setMarketState(tzMarket);
      setLoading(false);
      return tzMarket;
    }

    setLoading(false);
    return null;
  }, []);

  useEffect(() => {
    const initializeMarket = async () => {
      setLoading(true);

      // 1. Priority: URL Parameter (أعلى أولوية)
      const marketIdFromUrl = searchParams.get('market');
      if (marketIdFromUrl) {
        const foundMarket = markets.find(m => m.id === marketIdFromUrl);
        if (foundMarket) {
          setMarketState(foundMarket);
          // احفظه كاختيار يدوي صريح من المستخدم
          localStorage.setItem('userSelectedMarketId', foundMarket.id);
          setLoading(false);
          return;
        }
      }

      // 2. Priority: اختيار المستخدم اليدوي الصريح فقط (من قائمة تغيير السوق)
      // نفرّق بين الاختيار اليدوي والاكتشاف التلقائي المحفوظ
      const userPickedMarketId = localStorage.getItem('userSelectedMarketId');
      if (userPickedMarketId) {
        const foundMarket = markets.find(m => m.id === userPickedMarketId);
        if (foundMarket) {
          setMarketState(foundMarket);
          setLoading(false);
          return;
        }
      }

      // 3. Priority: المنطقة الزمنية للمتصفح (سريعة جداً، لا تتطلب طلب شبكة)
      const tzMarket = detectMarketFromTimezone();
      if (tzMarket) {
        setMarketState(tzMarket);
        setLoading(false);
        return;
      }

      // 4. Priority: الاكتشاف عبر IP (أبطأ، يُستخدم فقط إذا فشل كل ما سبق)
      await detectMarket();
      setLoading(false);
    };

    if (typeof window !== 'undefined') {
      initializeMarket();
    }
  }, [searchParams, detectMarket]);

  const sortAdsByDistance = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: 'خطأ', description: 'خدمات الموقع غير مدعومة في هذا المتصفح.', variant: 'destructive' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });

        // Refresh market to match detected location
        await detectMarket();

        toast({ title: 'نجاح', description: 'تم تحديد موقعك وتحديث السوق بنجاح.' });
      },
      (error) => {
        let message = 'حدث خطأ غير معروف.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'لقد رفضت الإذن بالوصول إلى موقعك.';
        }
        toast({ title: 'فشل تحديد الموقع', description: message, variant: 'destructive' });
      }
    );
  }, [toast, detectMarket]);

  const value = useMemo(() => ({
    market,
    setMarket,
    loading,
    userLocation,
    sortAdsByDistance,
    setUserLocation,
  }), [market, setMarket, loading, userLocation, sortAdsByDistance]);

  return (
    <MarketContext.Provider value={value}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
