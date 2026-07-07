'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

type ViewType = 'grid' | 'list';

type ViewContextType = {
  view: ViewType;
  setView: (view: ViewType) => void;
};

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewType>('grid');

  return (
    <ViewContext.Provider value={{ view, setView }}>
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
