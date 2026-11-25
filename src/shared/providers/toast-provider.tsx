'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/shared/lib/cn';

export type ToastTone = 'cobalt' | 'emerald' | 'amber' | 'neutral';

export interface ToastInput {
  readonly title: string;
  readonly description?: string;
  readonly tone?: ToastTone;
  readonly durationMs?: number;
}

export interface ToastItem extends ToastInput {
  readonly id: string;
  readonly tone: ToastTone;
  readonly durationMs: number;
}

export interface ToastContextValue {
  readonly toasts: readonly ToastItem[];
  readonly toast: (input: ToastInput) => string;
  readonly dismiss: (id: string) => void;
}

interface AriaNotifyDocument {
  ariaNotify?: (announcement: string) => void;
}

const DEFAULT_DURATION_MS = 4200;

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, string> = {
  cobalt:
    'border-[color-mix(in_oklab,var(--accent-primary)_40%,var(--border-default))] bg-elevated/95 text-ink',
  emerald:
    'border-[color-mix(in_oklab,var(--accent-emerald)_40%,var(--border-default))] bg-elevated/95 text-ink',
  amber:
    'border-[color-mix(in_oklab,var(--accent-amber)_40%,var(--border-default))] bg-elevated/95 text-ink',
  neutral: 'border-border bg-elevated/95 text-ink',
};

const TONE_ICON_COLOR: Record<ToastTone, string> = {
  cobalt: 'text-accent',
  emerald: 'text-emerald',
  amber: 'text-amber',
  neutral: 'text-ink-secondary',
};

function ToastIcon({ tone }: { readonly tone: ToastTone }) {
  const iconClass = cn('h-4 w-4 shrink-0', TONE_ICON_COLOR[tone]);

  if (tone === 'emerald') {
    return <CheckCircle2 aria-hidden="true" className={iconClass} />;
  }

  if (tone === 'amber') {
    return <AlertTriangle aria-hidden="true" className={iconClass} />;
  }

  return <Info aria-hidden="true" className={iconClass} />;
}

interface ToastCardProps {
  readonly item: ToastItem;
  readonly onDismiss: (id: string, returnFocusFromButton?: boolean) => void;
  readonly registerButtonRef: (id: string, node: HTMLButtonElement | null) => void;
}

function ToastCard({
  item,
  onDismiss,
  registerButtonRef,
}: ToastCardProps) {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || item.durationMs <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      onDismiss(item.id, false);
    }, item.durationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isPaused, item.durationMs, item.id, onDismiss]);

  const handleBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    setIsPaused(false);
  };

  return (
    <div
      role="status"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={handleBlur}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 shadow-2xl backdrop-blur-md',
        TONE_STYLES[item.tone],
      )}
    >
      <div className="mt-0.5">
        <ToastIcon tone={item.tone} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-ink">
          {item.title}
        </p>
        {item.description ? (
          <p className="mt-0.5 break-words font-mono text-xs leading-relaxed text-ink-secondary">
            {item.description}
          </p>
        ) : null}
      </div>

      <button
        ref={(node) => registerButtonRef(item.id, node)}
        type="button"
        onClick={() => onDismiss(item.id, true)}
        aria-label={`Benachrichtigung "${item.title}" schließen`}
        className="inline-flex min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-ink-muted transition-colors hover:border-border hover:bg-surface hover:text-ink"
      >
        <X aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export interface ToastProviderProps {
  readonly children: ReactNode;
}

/**
 * Provides non-intrusive, accessible toast notifications backed by a manual
 * top-layer popover stack and centralized polite screen-reader announcements.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const counterRef = useRef(0);
  const priorFocusRef = useRef<HTMLElement | null>(null);

  const registerButtonRef = useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (node) {
        buttonRefs.current.set(id, node);
      } else {
        buttonRefs.current.delete(id);
      }
    },
    [],
  );

  const announce = useCallback((message: string) => {
    if (typeof document === 'undefined') {
      return;
    }

    const doc = document as Document & AriaNotifyDocument;
    if (typeof doc.ariaNotify === 'function') {
      doc.ariaNotify(message);
      return;
    }

    setAnnouncement('');
    window.requestAnimationFrame(() => {
      setAnnouncement(message);
    });
  }, []);

  const dismiss = useCallback(
    (id: string, manualFromButton = false) => {
      setToasts((prev) => {
        const index = prev.findIndex((item) => item.id === id);
        if (index === -1) {
          return prev;
        }

        const next = prev.filter((item) => item.id !== id);

        if (manualFromButton) {
          const nextToast = next[index] ?? next[index - 1];
          window.requestAnimationFrame(() => {
            if (nextToast) {
              buttonRefs.current.get(nextToast.id)?.focus();
            } else if (
              priorFocusRef.current &&
              priorFocusRef.current.isConnected
            ) {
              priorFocusRef.current.focus();
            }
          });
        }

        return next;
      });
    },
    [],
  );

  const toast = useCallback(
    (input: ToastInput): string => {
      counterRef.current += 1;
      const id = `toast-${counterRef.current}`;
      const newItem: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        tone: input.tone ?? 'cobalt',
        durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
      };

      if (
        typeof document !== 'undefined' &&
        document.activeElement instanceof HTMLElement &&
        !popoverRef.current?.contains(document.activeElement)
      ) {
        priorFocusRef.current = document.activeElement;
      }

      setToasts((prev) => [...prev.slice(-3), newItem]);

      const spokenText = input.description
        ? `${input.title}. ${input.description}`
        : input.title;
      announce(spokenText);

      return id;
    },
    [announce],
  );

  useEffect(() => {
    const el = popoverRef.current;
    if (!el || !('showPopover' in el) || !('hidePopover' in el)) {
      return;
    }

    try {
      if (toasts.length > 0) {
        if (!el.matches(':popover-open')) {
          el.showPopover();
        }
      } else if (el.matches(':popover-open')) {
        el.hidePopover();
      }
    } catch {
      // Ignore transient popover state errors during unmount or rapid updates.
    }
  }, [toasts.length]);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      toasts,
      toast,
      dismiss: (id) => dismiss(id, false),
    }),
    [toasts, toast, dismiss],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div role="region" aria-label="Benachrichtigungen">
        <p className="sr-only">Statusmeldungen</p>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>

        <div
          ref={popoverRef}
          popover="manual"
          className={cn(
            'toast-viewport pointer-events-none flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2.5',
            toasts.length === 0 && 'hidden',
          )}
        >
          {toasts.map((item) => (
            <ToastCard
              key={item.id}
              item={item}
              onDismiss={dismiss}
              registerButtonRef={registerButtonRef}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider.');
  }

  return context;
}
