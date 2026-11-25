'use client';

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
import { useSoundFX } from '@/features/audio-engine';
import { InspectorHudBar } from './inspector-hud-bar';

export interface InspectorContextValue {
  readonly isActive: boolean;
  readonly setActive: (active: boolean) => void;
  readonly toggle: () => void;
  readonly registeredModules: readonly string[];
  readonly registerModule: (name: string) => void;
  readonly unregisterModule: (name: string) => void;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

export interface InspectorProviderProps {
  readonly children: ReactNode;
}

/**
 * Manages the global Architecture X-Ray inspector overlay state, keyboard
 * shortcut (`Alt + I`), document attribute binding, and module registry.
 */
export function InspectorProvider({ children }: InspectorProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [registeredModules, setRegisteredModules] = useState<readonly string[]>(
    [],
  );
  const moduleCountsRef = useRef<Map<string, number>>(new Map());
  const prevIsActiveRef = useRef(false);
  const { playInspectorToggle } = useSoundFX();

  useEffect(() => {
    if (prevIsActiveRef.current !== isActive) {
      prevIsActiveRef.current = isActive;
      playInspectorToggle(isActive);
    }
  }, [isActive, playInspectorToggle]);

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const setActive = useCallback((active: boolean) => {
    setIsActive(active);
  }, []);

  const registerModule = useCallback((name: string) => {
    const counts = moduleCountsRef.current;
    const currentCount = counts.get(name) ?? 0;
    counts.set(name, currentCount + 1);

    if (currentCount === 0) {
      setRegisteredModules(Array.from(counts.keys()));
    }
  }, []);

  const unregisterModule = useCallback((name: string) => {
    const counts = moduleCountsRef.current;
    const currentCount = counts.get(name) ?? 0;

    if (currentCount <= 1) {
      counts.delete(name);
      setRegisteredModules(Array.from(counts.keys()));
      return;
    }

    counts.set(name, currentCount - 1);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.inspector = isActive
      ? 'active'
      : 'inactive';

    return () => {
      delete document.documentElement.dataset.inspector;
    };
  }, [isActive]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || isEditableTarget(event.target)) {
        return;
      }

      const isAltI =
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        (event.code === 'KeyI' || event.key.toLowerCase() === 'i');

      if (!isAltI) {
        return;
      }

      event.preventDefault();
      setIsActive((prev) => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const contextValue = useMemo<InspectorContextValue>(
    () => ({
      isActive,
      setActive,
      toggle,
      registeredModules,
      registerModule,
      unregisterModule,
    }),
    [
      isActive,
      setActive,
      toggle,
      registeredModules,
      registerModule,
      unregisterModule,
    ],
  );

  return (
    <InspectorContext.Provider value={contextValue}>
      {children}
      <InspectorHudBar />
    </InspectorContext.Provider>
  );
}

export function useInspector(): InspectorContextValue {
  const context = useContext(InspectorContext);

  if (!context) {
    throw new Error('useInspector must be used within InspectorProvider.');
  }

  return context;
}
