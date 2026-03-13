'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

type FontSizeContextType = {
  scale: number;
  increase: () => void;
  decrease: () => void;
  reset: () => void;
};

const MIN_SCALE = 0.8;
const MAX_SCALE = 1.4;
const STEP = 0.1;
const DEFAULT_SCALE = 1;

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState<number>(DEFAULT_SCALE);

  const increase = () => {
    setScale(currentScale => Math.min(MAX_SCALE, currentScale + STEP));
  };

  const decrease = () => {
    setScale(currentScale => Math.max(MIN_SCALE, currentScale - STEP));
  };

  const reset = () => {
    setScale(DEFAULT_SCALE);
  };

  const value = {
    scale,
    increase,
    decrease,
    reset,
  };

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}
