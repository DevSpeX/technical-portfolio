'use client';

import {
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useMemo } from 'react';

/**
 * Physically calibrated spring presets for precision UI transitions.
 * Tuned for crisp, non-bouncy engineering surfaces without sluggish overshoot.
 */
export const SPRINGS = {
  taut: {
    type: 'spring',
    stiffness: 420,
    damping: 36,
    mass: 0.85,
  },
  precision: {
    type: 'spring',
    stiffness: 280,
    damping: 30,
    mass: 1,
  },
  gentle: {
    type: 'spring',
    stiffness: 180,
    damping: 26,
    mass: 1.1,
  },
  detent: {
    type: 'spring',
    stiffness: 520,
    damping: 38,
    mass: 0.7,
  },
} as const satisfies Record<string, Transition>;

export const EASINGS = {
  precisionOut: [0.16, 1, 0.3, 1],
  standard: [0.4, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const REDUCED_TRANSITION: Transition = {
  duration: 0.14,
  ease: 'linear',
};

export const DEFAULT_VIEWPORT = {
  once: true,
  amount: 0.15,
} as const;

export interface StaggerOptions {
  readonly staggerChildren?: number;
  readonly delayChildren?: number;
  readonly reducedMotion?: boolean;
}

export function createStaggerContainerVariants(
  options: StaggerOptions = {},
): Variants {
  const {
    staggerChildren = 0.06,
    delayChildren = 0.04,
    reducedMotion = false,
  } = options;

  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.12,
          staggerChildren: 0,
          delayChildren: 0,
        },
      },
    };
  }

  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };
}

export interface FadeUpOptions {
  readonly distance?: number;
  readonly reducedMotion?: boolean;
  readonly transition?: Transition;
}

export function createFadeUpVariants(options: FadeUpOptions = {}): Variants {
  const {
    distance = 16,
    reducedMotion = false,
    transition = SPRINGS.precision,
  } = options;

  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: REDUCED_TRANSITION,
      },
    };
  }

  return {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition,
    },
  };
}

export interface ScaleInOptions {
  readonly initialScale?: number;
  readonly reducedMotion?: boolean;
  readonly transition?: Transition;
}

export function createScaleInVariants(options: ScaleInOptions = {}): Variants {
  const {
    initialScale = 0.97,
    reducedMotion = false,
    transition = SPRINGS.taut,
  } = options;

  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: REDUCED_TRANSITION,
      },
    };
  }

  return {
    hidden: { opacity: 0, scale: initialScale },
    visible: {
      opacity: 1,
      scale: 1,
      transition,
    },
  };
}

export interface SlideInOptions {
  readonly axis?: 'x' | 'y';
  readonly offset?: number;
  readonly reducedMotion?: boolean;
  readonly transition?: Transition;
}

export function createSlideInVariants(options: SlideInOptions = {}): Variants {
  const {
    axis = 'x',
    offset = 20,
    reducedMotion = false,
    transition = SPRINGS.precision,
  } = options;

  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: REDUCED_TRANSITION,
      },
    };
  }

  if (axis === 'y') {
    return {
      hidden: { opacity: 0, y: offset },
      visible: {
        opacity: 1,
        y: 0,
        transition,
      },
    };
  }

  return {
    hidden: { opacity: 0, x: offset },
    visible: {
      opacity: 1,
      x: 0,
      transition,
    },
  };
}

export interface AccessibleMotionState {
  readonly prefersReducedMotion: boolean;
  readonly transition: Transition;
  readonly staggerContainer: Variants;
  readonly fadeUp: Variants;
  readonly scaleIn: Variants;
  readonly viewport: typeof DEFAULT_VIEWPORT;
}

/**
 * Returns reduced-motion-aware presets bound to the user's system setting.
 * Ensures elements always resolve to their visible final state.
 */
export function useAccessibleMotion(): AccessibleMotionState {
  const reducedMotionPreference = useReducedMotion();
  const prefersReducedMotion = Boolean(reducedMotionPreference);

  return useMemo<AccessibleMotionState>(
    () => ({
      prefersReducedMotion,
      transition: prefersReducedMotion ? REDUCED_TRANSITION : SPRINGS.precision,
      staggerContainer: createStaggerContainerVariants({
        reducedMotion: prefersReducedMotion,
      }),
      fadeUp: createFadeUpVariants({
        reducedMotion: prefersReducedMotion,
      }),
      scaleIn: createScaleInVariants({
        reducedMotion: prefersReducedMotion,
      }),
      viewport: DEFAULT_VIEWPORT,
    }),
    [prefersReducedMotion],
  );
}
