'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion';
import { cn } from '@/shared/lib/cn';

export type SpotlightTone = 'cobalt' | 'emerald' | 'amber' | 'neutral';
export type SpotlightTag = 'div' | 'article' | 'section';

export interface SpotlightCardProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly tone?: SpotlightTone;
  readonly spotlightSize?: number;
  readonly as?: SpotlightTag;
}

interface SpotlightCssVars {
  readonly border: string;
  readonly surface: string;
}

const TONE_CSS_VARS: Record<SpotlightTone, SpotlightCssVars> = {
  cobalt: {
    border: 'color-mix(in oklab, var(--accent-primary) 58%, transparent)',
    surface: 'color-mix(in oklab, var(--accent-primary) 9%, transparent)',
  },
  emerald: {
    border: 'color-mix(in oklab, var(--accent-emerald) 55%, transparent)',
    surface: 'color-mix(in oklab, var(--accent-emerald) 8%, transparent)',
  },
  amber: {
    border: 'color-mix(in oklab, var(--accent-amber) 55%, transparent)',
    surface: 'color-mix(in oklab, var(--accent-amber) 8%, transparent)',
  },
  neutral: {
    border: 'color-mix(in oklab, var(--border-strong) 75%, transparent)',
    surface: 'color-mix(in oklab, var(--text-primary) 5%, transparent)',
  },
};

/**
 * Modular surface card with a cursor-tracking radial border and surface sheen.
 * Mutates `--mouse-x`, `--mouse-y`, and `--spotlight-opacity` directly on the
 * DOM element inside `requestAnimationFrame` for zero React re-renders.
 */
export function SpotlightCard({
  children,
  className,
  tone = 'cobalt',
  spotlightSize = 380,
  as: Component = 'div',
}: SpotlightCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const latestCoordsRef = useRef<{ x: number; y: number } | null>(null);

  const cancelPendingFrame = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelPendingFrame();
    };
  }, [cancelPendingFrame]);

  const handlePointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (prefersReducedMotion || event.pointerType !== 'mouse') {
        return;
      }

      const el = cardRef.current;
      if (!el) {
        return;
      }

      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
      el.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
      el.style.setProperty('--spotlight-opacity', '1');
    },
    [prefersReducedMotion],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (prefersReducedMotion || event.pointerType !== 'mouse') {
        return;
      }

      const el = cardRef.current;
      if (!el) {
        return;
      }

      const rect = el.getBoundingClientRect();
      latestCoordsRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      if (rafRef.current !== null) {
        return;
      }

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const coords = latestCoordsRef.current;
        const target = cardRef.current;
        if (!coords || !target) {
          return;
        }

        target.style.setProperty('--mouse-x', `${coords.x}px`);
        target.style.setProperty('--mouse-y', `${coords.y}px`);
      });
    },
    [prefersReducedMotion],
  );

  const handlePointerLeave = useCallback(() => {
    cancelPendingFrame();
    const el = cardRef.current;
    if (!el) {
      return;
    }

    el.style.setProperty('--spotlight-opacity', '0');
  }, [cancelPendingFrame]);

  const vars = TONE_CSS_VARS[tone];
  const cardStyle = {
    '--spotlight-size': `${spotlightSize}px`,
    '--spotlight-border-color': vars.border,
    '--spotlight-surface-color': vars.surface,
  } as CSSProperties;

  const setRef = useCallback((node: HTMLElement | null) => {
    cardRef.current = node as HTMLDivElement | null;
  }, []);

  return (
    <Component
      ref={setRef}
      style={cardStyle}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn(
        'spotlight-card overflow-hidden rounded-xl border border-border-subtle bg-elevated transition-colors duration-200 hover:border-border',
        className,
      )}
    >
      <div aria-hidden="true" className="spotlight-surface" />
      <div aria-hidden="true" className="spotlight-border" />
      <div className="relative z-10 h-full">{children}</div>
    </Component>
  );
}
