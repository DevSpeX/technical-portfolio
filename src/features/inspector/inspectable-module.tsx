'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { useInspector } from './inspector-context';

export type InspectableLayerTone = 'rsc' | 'client' | 'hybrid' | 'edge';

export type InspectableElementTag =
  | 'div'
  | 'section'
  | 'header'
  | 'footer'
  | 'article';

export interface InspectableModuleProps {
  readonly name: string;
  readonly layer: string;
  readonly renderMetric?: string;
  readonly tone?: InspectableLayerTone;
  readonly as?: InspectableElementTag;
  readonly id?: string;
  readonly tabIndex?: number;
  readonly className?: string;
  readonly children: ReactNode;
}

interface TonePalette {
  readonly border: string;
  readonly tint: string;
  readonly corner: string;
  readonly badge: string;
  readonly nameColor: string;
  readonly dot: string;
}

const TONE_PALETTES: Record<InspectableLayerTone, TonePalette> = {
  rsc: {
    border: 'border-emerald/45',
    tint: 'bg-emerald/[0.025]',
    corner: 'border-emerald/85',
    badge: 'border-emerald/40 bg-elevated/95 text-ink',
    nameColor: 'text-emerald',
    dot: 'bg-emerald',
  },
  client: {
    border: 'border-accent/45',
    tint: 'bg-accent/[0.025]',
    corner: 'border-accent/85',
    badge: 'border-accent/40 bg-elevated/95 text-ink',
    nameColor: 'text-accent',
    dot: 'bg-accent',
  },
  hybrid: {
    border: 'border-border-strong/70',
    tint: 'bg-ink/[0.02]',
    corner: 'border-ink-secondary/80',
    badge: 'border-border-strong bg-elevated/95 text-ink',
    nameColor: 'text-ink',
    dot: 'bg-ink-secondary',
  },
  edge: {
    border: 'border-amber/45',
    tint: 'bg-amber/[0.025]',
    corner: 'border-amber/85',
    badge: 'border-amber/40 bg-elevated/95 text-ink',
    nameColor: 'text-amber',
    dot: 'bg-amber',
  },
};

function inferLayerTone(layer: string): InspectableLayerTone {
  if (/rsc|server/i.test(layer)) {
    return 'rsc';
  }
  if (/edge/i.test(layer)) {
    return 'edge';
  }
  if (/hybrid/i.test(layer)) {
    return 'hybrid';
  }
  return 'client';
}

/**
 * Wraps any Server or Client boundary to expose an interactive Architecture
 * X-Ray blueprint overlay when the global inspector mode is toggled on.
 */
export function InspectableModule({
  name,
  layer,
  renderMetric,
  tone,
  as: Component = 'div',
  id,
  tabIndex,
  className,
  children,
}: InspectableModuleProps) {
  const { isActive, registerModule, unregisterModule } = useInspector();

  useEffect(() => {
    registerModule(name);
    return () => {
      unregisterModule(name);
    };
  }, [name, registerModule, unregisterModule]);

  const resolvedTone = tone ?? inferLayerTone(layer);
  const palette = TONE_PALETTES[resolvedTone];

  return (
    <Component
      id={id}
      tabIndex={tabIndex}
      data-inspector-module={isActive ? name : undefined}
      className={cn(isActive && 'relative', className)}
    >
      {children}

      {isActive ? (
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 z-20 select-none rounded-[inherit] border border-dashed transition-opacity duration-150',
            palette.border,
            palette.tint,
          )}
        >
          {/* Corner registration crosshairs */}
          <span
            className={cn(
              'absolute -top-px -left-px h-2.5 w-2.5 border-t-2 border-l-2',
              palette.corner,
            )}
          />
          <span
            className={cn(
              'absolute -top-px -right-px h-2.5 w-2.5 border-t-2 border-r-2',
              palette.corner,
            )}
          />
          <span
            className={cn(
              'absolute -bottom-px -left-px h-2.5 w-2.5 border-b-2 border-l-2',
              palette.corner,
            )}
          />
          <span
            className={cn(
              'absolute -right-px -bottom-px h-2.5 w-2.5 border-r-2 border-b-2',
              palette.corner,
            )}
          />

          {/* HUD metadata pill */}
          <div
            className={cn(
              'absolute top-2 left-3 inline-flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] leading-tight shadow-lg backdrop-blur-md',
              palette.badge,
            )}
          >
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', palette.dot)} />
            <span className={cn('font-semibold', palette.nameColor)}>
              &lt;{name} /&gt;
            </span>
            <span className="text-border-strong">·</span>
            <span className="truncate text-ink-secondary">{layer}</span>
            {renderMetric ? (
              <>
                <span className="text-border-strong">·</span>
                <span className="rounded bg-surface px-1.5 py-0.5 text-[9px] text-ink-muted">
                  {renderMetric}
                </span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </Component>
  );
}
