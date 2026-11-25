'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import {
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { useSoundFX } from '@/features/audio-engine';
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion';
import { cn } from '@/shared/lib/cn';

export type MagneticButtonVariant = 'primary' | 'secondary' | 'ghost';
export type MagneticButtonSize = 'sm' | 'md' | 'lg';

interface MagneticButtonBaseProps {
  readonly children: ReactNode;
  readonly variant?: MagneticButtonVariant;
  readonly size?: MagneticButtonSize;
  readonly strength?: number;
  readonly className?: string;
  readonly ariaLabel?: string;
  readonly ariaPressed?: boolean;
  readonly ariaExpanded?: boolean;
  readonly ariaHaspopup?: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | boolean;
}

export interface MagneticButtonAsButtonProps extends MagneticButtonBaseProps {
  readonly href?: undefined;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly disabled?: boolean;
  readonly onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

export interface MagneticButtonAsLinkProps extends MagneticButtonBaseProps {
  readonly href: string;
  readonly target?: string;
  readonly rel?: string;
  readonly onClick?: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
}

export type MagneticButtonProps =
  | MagneticButtonAsButtonProps
  | MagneticButtonAsLinkProps;

const VARIANT_CLASSES: Record<MagneticButtonVariant, string> = {
  primary:
    'border-accent/45 bg-accent-soft text-ink hover:border-accent hover:bg-accent/20',
  secondary:
    'border-border bg-elevated text-ink-secondary hover:border-border-strong hover:text-ink',
  ghost:
    'border-transparent bg-transparent text-ink-secondary hover:border-border-subtle hover:bg-elevated/70 hover:text-ink',
};

const SIZE_CLASSES: Record<MagneticButtonSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'min-h-10 px-4 py-2.5 text-sm gap-2 rounded-lg',
  lg: 'min-h-11 px-5 py-3 text-sm gap-2.5 rounded-xl',
};

const MAGNETIC_SPRING = {
  stiffness: 320,
  damping: 22,
  mass: 0.5,
} as const;

/**
 * Tactile interactive button/link primitive with GPU-composited cursor
 * attraction via Motion springs and zero React re-renders during pointer move.
 */
export function MagneticButton(props: MagneticButtonProps) {
  const {
    children,
    variant = 'primary',
    size = 'md',
    strength = 10,
    className,
    ariaLabel,
    ariaPressed,
    ariaExpanded,
    ariaHaspopup,
  } = props;

  const prefersReducedMotion = usePrefersReducedMotion();
  const { playHover, playClick } = useSoundFX();
  const rectRef = useRef<DOMRect | null>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, MAGNETIC_SPRING);
  const springY = useSpring(rawY, MAGNETIC_SPRING);

  const isDisabled = 'disabled' in props ? Boolean(props.disabled) : false;
  const motionDisabled = prefersReducedMotion || isDisabled;

  const resetOffset = useCallback(() => {
    rectRef.current = null;
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  const handlePointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (isDisabled || event.pointerType !== 'mouse') {
        return;
      }
      playHover();
      if (!motionDisabled) {
        rectRef.current = event.currentTarget.getBoundingClientRect();
      }
    },
    [isDisabled, motionDisabled, playHover],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (motionDisabled || event.pointerType !== 'mouse') {
        return;
      }

      const rect =
        rectRef.current ?? event.currentTarget.getBoundingClientRect();
      rectRef.current = rect;

      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const relX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const relY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

      const clampedX = Math.max(-1, Math.min(1, relX));
      const clampedY = Math.max(-1, Math.min(1, relY));

      rawX.set(clampedX * strength);
      rawY.set(clampedY * strength);
    },
    [motionDisabled, rawX, rawY, strength],
  );

  const handleBlur = useCallback(() => {
    resetOffset();
  }, [resetOffset]);

  const sharedClassName = cn(
    'relative inline-flex select-none items-center justify-center border font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    isDisabled && 'pointer-events-none opacity-50',
    className,
  );

  const motionStyle = motionDisabled
    ? undefined
    : { x: springX, y: springY };

  const tapFeedback = motionDisabled ? undefined : { scale: 0.98 };

  if (typeof props.href === 'string') {
    const handleAnchorClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (!isDisabled) {
        playClick();
      }
      props.onClick?.(event);
    };

    return (
      <motion.a
        href={props.href}
        target={props.target}
        rel={props.rel}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        onClick={handleAnchorClick}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetOffset}
        onBlur={handleBlur}
        style={motionStyle}
        whileTap={tapFeedback}
        className={sharedClassName}
      >
        {children}
      </motion.a>
    );
  }

  const handleButtonClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) {
      playClick();
    }
    props.onClick?.(event);
  };

  return (
    <motion.button
      type={props.type ?? 'button'}
      disabled={props.disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      onClick={handleButtonClick}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetOffset}
      onBlur={handleBlur}
      style={motionStyle}
      whileTap={tapFeedback}
      className={sharedClassName}
    >
      {children}
    </motion.button>
  );
}
