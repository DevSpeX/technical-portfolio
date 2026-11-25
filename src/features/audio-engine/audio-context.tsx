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
import { SoundEngine } from './sound-engine';

const STORAGE_KEY = 'florian-portfolio:audio-muted';

export interface SoundFXContextValue {
  readonly isMuted: boolean;
  readonly isEnabled: boolean;
  readonly setMuted: (muted: boolean) => void;
  readonly toggleMute: () => void;
  readonly playHover: () => void;
  readonly playClick: () => void;
  readonly playCommandOpen: () => void;
  readonly playCommandClose: () => void;
  readonly playInspectorToggle: (activating?: boolean) => void;
}

const AudioContextReact = createContext<SoundFXContextValue | null>(null);

function readStoredMuted(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // Default to muted (OFF) unless the user explicitly enabled audio.
    if (stored === 'false') {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

function writeStoredMuted(muted: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // Ignore storage quota or private-mode access errors.
  }
}

export interface AudioProviderProps {
  readonly children: ReactNode;
}

/**
 * Provides procedural Web Audio UI feedback across the application.
 * Defaults to muted (OFF) to respect browser autoplay policies and visitor comfort.
 */
export function AudioProvider({ children }: AudioProviderProps) {
  const [isMuted, setIsMutedState] = useState<boolean>(true);
  const engineRef = useRef<SoundEngine | null>(null);

  const getEngine = useCallback((): SoundEngine => {
    if (!engineRef.current) {
      engineRef.current = new SoundEngine(true);
    }
    return engineRef.current;
  }, []);

  // Hydrate persisted mute preference on the client without SSR mismatch
  useEffect(() => {
    const persistedMuted = readStoredMuted();
    setIsMutedState(persistedMuted);
    getEngine().setMuted(persistedMuted);

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [getEngine]);

  const setMuted = useCallback(
    (muted: boolean) => {
      const engine = getEngine();
      engine.setMuted(muted);
      setIsMutedState(muted);
      writeStoredMuted(muted);

      if (!muted) {
        engine.unlock();
      }
    },
    [getEngine],
  );

  const toggleMute = useCallback(() => {
    setIsMutedState((prevMuted) => {
      const nextMuted = !prevMuted;
      const engine = getEngine();
      engine.setMuted(nextMuted);
      writeStoredMuted(nextMuted);

      if (!nextMuted) {
        engine.unlock();
        engine.playClick();
      }

      return nextMuted;
    });
  }, [getEngine]);

  const playHover = useCallback(() => {
    getEngine().playHover();
  }, [getEngine]);

  const playClick = useCallback(() => {
    getEngine().playClick();
  }, [getEngine]);

  const playCommandOpen = useCallback(() => {
    getEngine().playCommandOpen();
  }, [getEngine]);

  const playCommandClose = useCallback(() => {
    getEngine().playCommandClose();
  }, [getEngine]);

  const playInspectorToggle = useCallback(
    (activating?: boolean) => {
      getEngine().playInspectorToggle(activating);
    },
    [getEngine],
  );

  const contextValue = useMemo<SoundFXContextValue>(
    () => ({
      isMuted,
      isEnabled: !isMuted,
      setMuted,
      toggleMute,
      playHover,
      playClick,
      playCommandOpen,
      playCommandClose,
      playInspectorToggle,
    }),
    [
      isMuted,
      setMuted,
      toggleMute,
      playHover,
      playClick,
      playCommandOpen,
      playCommandClose,
      playInspectorToggle,
    ],
  );

  return (
    <AudioContextReact.Provider value={contextValue}>
      {children}
    </AudioContextReact.Provider>
  );
}

export function useSoundFX(): SoundFXContextValue {
  const context = useContext(AudioContextReact);

  if (!context) {
    throw new Error('useSoundFX must be used within AudioProvider.');
  }

  return context;
}
