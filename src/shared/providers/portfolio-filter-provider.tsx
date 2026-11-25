'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ProjectCategory } from '@/config';

export type ProjectFilterCategory = 'all' | ProjectCategory;

export interface PortfolioFilterContextValue {
  readonly activeCategory: ProjectFilterCategory;
  readonly setActiveCategory: (category: ProjectFilterCategory) => void;
  readonly resetFilter: () => void;
}

const PortfolioFilterContext =
  createContext<PortfolioFilterContextValue | null>(null);

export interface PortfolioFilterProviderProps {
  readonly children: ReactNode;
}

/**
 * Shares the active project category filter across sections and the global
 * Command Palette so keyboard commands and UI filter pills stay synchronized.
 */
export function PortfolioFilterProvider({
  children,
}: PortfolioFilterProviderProps) {
  const [activeCategory, setActiveCategory] =
    useState<ProjectFilterCategory>('all');

  const resetFilter = useCallback(() => {
    setActiveCategory('all');
  }, []);

  const contextValue = useMemo<PortfolioFilterContextValue>(
    () => ({
      activeCategory,
      setActiveCategory,
      resetFilter,
    }),
    [activeCategory, resetFilter],
  );

  return (
    <PortfolioFilterContext.Provider value={contextValue}>
      {children}
    </PortfolioFilterContext.Provider>
  );
}

export function usePortfolioFilter(): PortfolioFilterContextValue {
  const context = useContext(PortfolioFilterContext);

  if (!context) {
    throw new Error(
      'usePortfolioFilter must be used within PortfolioFilterProvider.',
    );
  }

  return context;
}
