'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type ViewType = 'grid' | 'list';

type ViewContextType = {
  view: ViewType;
  setView: (view: ViewType) => void;
};

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  // Default view is 'list' as requested
  const [view, setView] = useState<ViewType>('list');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app_view_mode') as ViewType | null;
      if (saved === 'grid' || saved === 'list') {
        setView(saved);
      }
    } catch (_) {}
  }, []);

  const handleSetView = (newView: ViewType) => {
    setView(newView);
    try {
      localStorage.setItem('app_view_mode', newView);
    } catch (_) {}
  };

  return (
    <ViewContext.Provider value={{ view, setView: handleSetView }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}
