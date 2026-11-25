'use client';

import { Layers, X } from 'lucide-react';
import { useInspector } from './inspector-context';

/**
 * Compact technical HUD bar anchored at the bottom-left while Architecture
 * X-Ray mode is active, surfacing live module telemetry and a quick exit.
 */
export function InspectorHudBar() {
  const { isActive, registeredModules, setActive } = useInspector();

  if (!isActive) {
    return null;
  }

  return (
    <aside
      aria-label="Architecture X-Ray HUD"
      className="pointer-events-none fixed bottom-4 left-4 z-40 max-w-[calc(100vw-2rem)]"
    >
      <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-elevated/92 px-3.5 py-2 font-mono text-[11px] text-ink shadow-2xl backdrop-blur-md">
        <span className="inline-flex items-center gap-2 font-semibold tracking-wider text-accent">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-accent motion-safe:animate-pulse"
          />
          <span>X-RAY ACTIVE</span>
        </span>

        <span aria-hidden="true" className="h-3.5 w-px bg-border" />

        <span className="inline-flex items-center gap-1.5 text-ink-secondary">
          <Layers aria-hidden="true" className="h-3.5 w-3.5 text-ink-muted" />
          <span>{registeredModules.length} Modules</span>
        </span>

        <span aria-hidden="true" className="hidden h-3.5 w-px bg-border sm:inline-block" />

        <div className="hidden items-center gap-2.5 text-[10px] text-ink-muted sm:flex">
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald" />
            <span>RSC</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Client</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber" />
            <span>Edge</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setActive(false)}
          aria-label="Architecture X-Ray Modus beenden"
          className="inline-flex min-h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
        >
          <span>Exit</span>
          <kbd className="rounded border border-border-subtle bg-elevated px-1 text-[10px] text-ink-muted">
            Alt+I
          </kbd>
          <X aria-hidden="true" className="h-3 w-3" />
        </button>
      </div>
    </aside>
  );
}
