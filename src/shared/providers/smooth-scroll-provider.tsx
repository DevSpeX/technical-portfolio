'use client';

import Lenis from 'lenis';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion';

export type ScrollTarget = string | number | HTMLElement;

export interface ScrollToOptions {
  readonly offset?: number;
  readonly immediate?: boolean;
  readonly duration?: number;
}

export interface SmoothScrollContextValue {
  readonly lenis: Lenis | null;
  readonly isSmoothEnabled: boolean;
  readonly scrollTo: (target: ScrollTarget, options?: ScrollToOptions) => void;
  readonly stop: () => void;
  readonly start: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

export interface SmoothScrollProviderProps {
  readonly children: ReactNode;
}

/**
 * Manages the global Lenis smooth-scroll lifecycle and automatically falls back
 * to native scrolling when the user prefers reduced motion.
 */
export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      lenisRef.current = null;
      setLenisInstance(null);
      return;
    }

    const instance = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
    });

    lenisRef.current = instance;
    setLenisInstance(instance);

    let frameId = 0;

    const onAnimationFrame = (time: number): void => {
      instance.raf(time);
      frameId = window.requestAnimationFrame(onAnimationFrame);
    };

    frameId = window.requestAnimationFrame(onAnimationFrame);

    return () => {
      window.cancelAnimationFrame(frameId);
      instance.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, [prefersReducedMotion]);

  const scrollTo = useCallback(
    (target: ScrollTarget, options: ScrollToOptions = {}) => {
      const instance = lenisRef.current;

      if (instance) {
        instance.scrollTo(target, {
          offset: options.offset ?? 0,
          immediate: options.immediate ?? false,
          duration: options.duration,
        });
        return;
      }

      if (typeof window === 'undefined') {
        return;
      }

      const behavior: ScrollBehavior =
        prefersReducedMotion || options.immediate ? 'auto' : 'smooth';

      if (typeof target === 'number') {
        window.scrollTo({ top: target + (options.offset ?? 0), behavior });
        return;
      }

      const element =
        typeof target === 'string' ? document.querySelector(target) : target;

      if (element instanceof HTMLElement) {
        element.scrollIntoView({ behavior, block: 'start' });
      }
    },
    [prefersReducedMotion],
  );

  const stop = useCallback(() => {
    lenisRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    lenisRef.current?.start();
  }, []);

  const contextValue = useMemo<SmoothScrollContextValue>(
    () => ({
      lenis: lenisInstance,
      isSmoothEnabled: lenisInstance !== null,
      scrollTo,
      stop,
      start,
    }),
    [lenisInstance, scrollTo, stop, start],
  );

  return (
    <SmoothScrollContext.Provider value={contextValue}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll(): SmoothScrollContextValue {
  const context = useContext(SmoothScrollContext);

  if (!context) {
    throw new Error('useSmoothScroll must be used within SmoothScrollProvider.');
  }

  return context;
}
