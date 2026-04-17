
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
  const [market, setMarketState] = useState<Market>(markets[0]); // Initial default, will be updated by useEffect
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const setMarket = useCallback((newMarket: Market) => {
    setMarketState(newMarket);
    if (typeof window !== 'undefined') {
        localStorage.setItem('selectedMarketId', newMarket.id);
    }
  }, []);


  const detectMarket = useCallback(async () => {
    setLoading(true);
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Failed to fetch location');
        const data = await response.json();
        const countryCode = data.country_code?.toLowerCase();
        
        const detectedMarket = markets.find(m => m.id === countryCode);
        if (detectedMarket) {
            setMarketState(detectedMarket);
            return detectedMarket;
        }
    } catch (error) {
        console.warn("Market detection failed:", error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeMarket = async () => {
        setLoading(true);
        
        // 1. Priority: URL Parameter
        const marketIdFromUrl = searchParams.get('market');
        if (marketIdFromUrl) {
            const foundMarket = markets.find(m => m.id === marketIdFromUrl);
            if (foundMarket) {
                setMarketState(foundMarket);
                localStorage.setItem('selectedMarketId', foundMarket.id);
                setLoading(false);
                return;
            }
        }

        // 2. Priority: LocalStorage
        const savedMarketId = localStorage.getItem('selectedMarketId');
        if (savedMarketId) {
            const foundMarket = markets.find(m => m.id === savedMarketId);
            if (foundMarket) {
                setMarketState(foundMarket);
                setLoading(false);
                return;
            }
        }

        // 3. Priority: Auto-Detection
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
