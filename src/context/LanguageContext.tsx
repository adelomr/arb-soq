'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useFontSize } from './FontSizeContext';

type Language = 'ar';
type Direction = 'rtl';

type LanguageContextType = {
  language: Language;
  direction: Direction;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const value = {
    language: 'ar' as Language,
    direction: 'rtl' as Direction,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function FontSizeApplier({ children }: { children: ReactNode }) {
    const { scale } = useFontSize();

    useEffect(() => {
        const root = document.documentElement;
        root.style.fontSize = `${scale * 16}px`;
    }, [scale]);

    return <>{children}</>;
}
