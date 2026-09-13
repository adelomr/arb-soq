'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  FALLBACK_EGP_RATES,
  BASE_CURRENCY,
  convertEgpTo as convertEgpToUtil,
  convertToEgp as convertToEgpUtil,
  formatCurrencyAmount,
  fetchLiveExchangeRates,
  resolveCurrencyCode,
  getMarketCurrency,
} from '@/lib/currency-service';

interface ConvertedBalanceResult {
  amount: number;
  formatted: string;
  symbol: string;
  code: string;
}

interface CurrencyContextType {
  rates: Record<string, number>;
  loading: boolean;
  baseCurrency: string;
  convertEgpTo: (amountInEgp: number, targetCurrencyOrMarketId?: string) => number;
  convertToEgp: (amountInForeign: number, sourceCurrencyOrMarketId?: string) => number;
  formatConvertedBalance: (amountInEgp: number, targetCurrencyOrMarketId?: string) => ConvertedBalanceResult;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_EGP_RATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // استرجاع أسعار محفوظة محلياً فوراً لمنع وميض الأرقام
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('arb_soq_egp_rates');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.rates) {
            setRates((prev) => ({ ...prev, ...parsed.rates }));
          }
        }
      } catch {
        // تجاهل
      }
    }

    // جلب أسعار الصرف الحية من الإنترنت
    fetchLiveExchangeRates()
      .then((liveRates) => {
        if (isMounted && liveRates) {
          setRates(liveRates);
          setLoading(false);
          try {
            localStorage.setItem('arb_soq_egp_rates', JSON.stringify({
              timestamp: Date.now(),
              rates: liveRates,
            }));
          } catch {
            // تجاهل
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const convertEgpTo = useCallback(
    (amountInEgp: number, targetCurrencyOrMarketId?: string): number => {
      return convertEgpToUtil(amountInEgp, targetCurrencyOrMarketId || 'EGP', rates);
    },
    [rates]
  );

  const convertToEgp = useCallback(
    (amountInForeign: number, sourceCurrencyOrMarketId?: string): number => {
      return convertToEgpUtil(amountInForeign, sourceCurrencyOrMarketId || 'EGP', rates);
    },
    [rates]
  );

  const formatConvertedBalance = useCallback(
    (amountInEgp: number, targetCurrencyOrMarketId?: string): ConvertedBalanceResult => {
      const info = getMarketCurrency(targetCurrencyOrMarketId);
      const converted = convertEgpToUtil(amountInEgp, targetCurrencyOrMarketId || 'EGP', rates);
      return {
        amount: converted,
        formatted: formatCurrencyAmount(converted),
        symbol: info.symbol,
        code: info.code,
      };
    },
    [rates]
  );

  const value = useMemo(
    () => ({
      rates,
      loading,
      baseCurrency: BASE_CURRENCY,
      convertEgpTo,
      convertToEgp,
      formatConvertedBalance,
    }),
    [rates, loading, convertEgpTo, convertToEgp, formatConvertedBalance]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // في حال استخدامه خارج الـ Provider يُعاد كائن احتياطي آمن
    return {
      rates: FALLBACK_EGP_RATES,
      loading: false,
      baseCurrency: BASE_CURRENCY,
      convertEgpTo: (amt: number, target?: string) => convertEgpToUtil(amt, target || 'EGP', FALLBACK_EGP_RATES),
      convertToEgp: (amt: number, source?: string) => convertToEgpUtil(amt, source || 'EGP', FALLBACK_EGP_RATES),
      formatConvertedBalance: (amt: number, target?: string) => {
        const info = getMarketCurrency(target);
        const converted = convertEgpToUtil(amt, target || 'EGP', FALLBACK_EGP_RATES);
        return {
          amount: converted,
          formatted: formatCurrencyAmount(converted),
          symbol: info.symbol,
          code: info.code,
        };
      },
    };
  }
  return context;
}
