
'use client';

import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { markets, Market } from '@/lib/markets';
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
  const [market, setMarketState] = useState<Market>(markets[0]); // Default to first market
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const setMarket = useCallback((newMarket: Market) => {
    setMarketState(newMarket);
  }, []);

  useEffect(() => {
    const marketIdFromUrl = searchParams.get('market');
    if (marketIdFromUrl) {
      const foundMarket = markets.find(m => m.id === marketIdFromUrl);
      if (foundMarket && foundMarket.id !== market.id) {
        setMarket(foundMarket);
      }
      setLoading(false);
    } else {
      const detectMarket = async () => {
        setLoading(true);
        try {
          // Fetch user's country from a free IP geolocation API
          const response = await fetch('https://ipapi.co/json/');
          if (!response.ok) {
              throw new Error('Failed to fetch location');
          }
          const data = await response.json();
          const countryCode = data.country_code?.toLowerCase();
          
          const detectedMarket = markets.find(m => m.id === countryCode);
          if (detectedMarket) {
            setMarket(detectedMarket);
          }
        } catch (error) {
          console.warn("لم نتمكن من تحديد السوق تلقائيًا، تم التعيين إلى السعودية.", error);
          // Silently fail and keep the default market
        } finally {
          setLoading(false);
        }
      };
      detectMarket();
    }
  }, [searchParams, setMarket, market.id]);

  const sortAdsByDistance = useCallback(() => {
    if (!navigator.geolocation) {
        toast({ title: 'خطأ', description: 'خدمات الموقع غير مدعومة في هذا المتصفح.', variant: 'destructive' });
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });
            toast({ title: 'نجاح', description: 'تم تحديد موقعك. سيتم الآن فرز الإعلانات حسب القرب.' });
        },
        (error) => {
            let message = 'حدث خطأ غير معروف.';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'لقد رفضت الإذن بالوصول إلى موقعك.';
            }
            toast({ title: 'فشل تحديد الموقع', description: message, variant: 'destructive' });
        }
    );
  }, [toast]);


  const value = {
    market,
    setMarket,
    loading,
    userLocation,
    sortAdsByDistance,
    setUserLocation,
  };

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
