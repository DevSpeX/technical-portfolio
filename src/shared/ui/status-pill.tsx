import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export type StatusTone = 'cobalt' | 'emerald' | 'amber' | 'neutral';

export interface StatusPillProps {
  readonly label: string;
  readonly tone?: StatusTone;
  readonly icon?: ReactNode;
  readonly className?: string;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  cobalt:
    'border-[color-mix(in_oklab,var(--accent-primary)_32%,var(--border-default))] bg-accent-soft text-accent',
  emerald:
    'border-[color-mix(in_oklab,var(--accent-emerald)_32%,var(--border-default))] bg-emerald-soft text-emerald',
  amber:
    'border-[color-mix(in_oklab,var(--accent-amber)_32%,var(--border-default))] bg-amber-soft text-amber',
  neutral: 'border-border bg-elevated text-ink-secondary',
};

const DOT_CLASSES: Record<StatusTone, string> = {
  cobalt: 'bg-accent',
  emerald: 'bg-emerald',
  amber: 'bg-amber',
  neutral: 'bg-ink-muted',
};

/**
 * Accessible status indicator that always pairs color with iconography and text.
 */
export function StatusPill({
  label,
  tone = 'neutral',
  icon,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs tracking-tight',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center">
          {icon}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASSES[tone])}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
