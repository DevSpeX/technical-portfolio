'use client';

import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);
  return () => {
    mediaQuery.removeEventListener('change', onStoreChange);
  };
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Subscribes to the user's `prefers-reduced-motion` media query in an SSR-safe manner.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
