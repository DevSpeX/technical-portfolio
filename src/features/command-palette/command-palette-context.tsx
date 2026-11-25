'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSmoothScroll } from '@/shared/providers/smooth-scroll-provider';

export interface CommandPaletteContextValue {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export interface CommandPaletteProviderProps {
  readonly children: ReactNode;
}

/**
 * Manages global `Cmd/Ctrl + K` keyboard bindings, modal open state, and
 * Lenis smooth-scroll pausing while the Command Palette is open.
 */
export function CommandPaletteProvider({
  children,
}: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { stop, start } = useSmoothScroll();

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) {
        return;
      }

      const isCommandK =
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        (event.code === 'KeyK' || event.key.toLowerCase() === 'k');

      if (!isCommandK) {
        return;
      }

      event.preventDefault();
      setIsOpen((prev) => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      stop();
      return () => {
        start();
      };
    }

    start();
    return undefined;
  }, [isOpen, stop, start]);

  const contextValue = useMemo<CommandPaletteContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
    }),
    [isOpen, open, close, toggle],
  );

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);

  if (!context) {
    throw new Error(
      'useCommandPalette must be used within CommandPaletteProvider.',
    );
  }

  return context;
}
