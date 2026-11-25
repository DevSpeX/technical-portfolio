'use client';

import {
  Activity,
  Bot,
  Cpu,
  Gamepad2,
  GitBranch,
  Layers,
  Pause,
  Play,
  Server,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { SpotlightCard, type SpotlightTone } from '@/shared/components';
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion';
import { cn } from '@/shared/lib/cn';
import { REDUCED_TRANSITION, SPRINGS } from '@/shared/lib/motion';

type ArchitectureNodeId = 'architecture' | 'ai-agents' | 'fullstack' | 'gamedev';

interface ArchitectureNode {
  readonly id: ArchitectureNodeId;
  readonly code: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly tone: SpotlightTone;
  readonly accentText: string;
  readonly accentBorder: string;
  readonly accentBg: string;
  readonly accentDot: string;
  readonly status: string;
  readonly metricLabel: string;
  readonly metricValue: string;
  readonly summary: string;
  readonly primitives: readonly string[];
  readonly x: number;
  readonly y: number;
  readonly icon: 'layers' | 'bot' | 'server' | 'gamepad';
}

interface ArchitectureEdge {
  readonly id: string;
  readonly from: ArchitectureNodeId;
  readonly to: ArchitectureNodeId;
  readonly label: string;
}

const ARCHITECTURE_NODES: readonly [
  ArchitectureNode,
  ...ArchitectureNode[],
] = [
  {
    id: 'architecture',
    code: 'NODE_01',
    label: 'Architektur-Design',
    shortLabel: 'Architecture',
    tone: 'cobalt',
    accentText: 'text-accent',
    accentBorder: 'border-accent/55',
    accentBg: 'bg-accent-soft',
    accentDot: 'bg-accent',
    status: 'CONTRACTS VERIFIED',
    metricLabel: 'Type Safety',
    metricValue: '100% strict',
    summary:
      'Explizite Server/Client-Grenzen, Schema-Verträge und deterministische Zustandsmodelle als Fundament vor der ersten UI-Zeile.',
    primitives: ['RSC Boundaries', 'Domain Schemas', 'Zero-Trust APIs'],
    x: 24,
    y: 26,
    icon: 'layers',
  },
  {
    id: 'ai-agents',
    code: 'NODE_02',
    label: 'AI-Agent-Workflows',
    shortLabel: 'AI Workflows',
    tone: 'emerald',
    accentText: 'text-emerald',
    accentBorder: 'border-emerald/55',
    accentBg: 'bg-emerald-soft',
    accentDot: 'bg-emerald',
    status: 'DAG PIPELINE READY',
    metricLabel: 'Stream Overhead',
    metricValue: '< 12 ms',
    summary:
      'Orchestrierte Tool-Pipelines mit strukturierten Outputs, Guardrails, OpenTelemetry-Traces und reproduzierbaren Eval-Loops.',
    primitives: ['DAG Runner', 'Tool-Calling', 'Eval Telemetry'],
    x: 76,
    y: 26,
    icon: 'bot',
  },
  {
    id: 'fullstack',
    code: 'NODE_03',
    label: 'Full-Stack & Linux',
    shortLabel: 'Full-Stack',
    tone: 'cobalt',
    accentText: 'text-accent',
    accentBorder: 'border-accent/55',
    accentBg: 'bg-accent-soft',
    accentDot: 'bg-accent',
    status: 'RUNTIME NOMINAL',
    metricLabel: 'ISR / Edge',
    metricValue: '3600s cache',
    summary:
      'Produktionsreife Next.js-15-Plattformen, PostgreSQL/Redis-Backends und deklarative Linux-Systeme mit sauberer Observability.',
    primitives: ['Next.js 15', 'PostgreSQL', 'Void / Arch Linux'],
    x: 24,
    y: 74,
    icon: 'server',
  },
  {
    id: 'gamedev',
    code: 'NODE_04',
    label: 'Game & Runtime Systems',
    shortLabel: 'Game Systems',
    tone: 'amber',
    accentText: 'text-amber',
    accentBorder: 'border-amber/55',
    accentBg: 'bg-amber-soft',
    accentDot: 'bg-amber',
    status: 'FRAME LOCKED',
    metricLabel: 'Tick Cadence',
    metricValue: '120 Hz',
    summary:
      'Fixed-Timestep-Simulationen, Zero-Allocation-Hotpaths in Unity/C# sowie Canvas/WebGL-Laufzeiten mit präziser Eingabe-Latenz.',
    primitives: ['Unity / C#', 'Fixed Timestep', 'WebGL / Canvas'],
    x: 76,
    y: 74,
    icon: 'gamepad',
  },
];

const ARCHITECTURE_EDGES: readonly ArchitectureEdge[] = [
  {
    id: 'arch-ai',
    from: 'architecture',
    to: 'ai-agents',
    label: 'Typed Tool Contracts',
  },
  {
    id: 'arch-fs',
    from: 'architecture',
    to: 'fullstack',
    label: 'RSC & Schema Layer',
  },
  {
    id: 'ai-fs',
    from: 'ai-agents',
    to: 'fullstack',
    label: 'SSE Telemetry Stream',
  },
  {
    id: 'fs-game',
    from: 'fullstack',
    to: 'gamedev',
    label: 'Shared Simulation Core',
  },
  {
    id: 'ai-game',
    from: 'ai-agents',
    to: 'gamedev',
    label: 'Automated Playtest & Balance',
  },
];

function NodeIcon({
  icon,
  className,
}: {
  readonly icon: ArchitectureNode['icon'];
  readonly className?: string;
}) {
  switch (icon) {
    case 'layers':
      return <Layers aria-hidden="true" className={className} />;
    case 'bot':
      return <Bot aria-hidden="true" className={className} />;
    case 'server':
      return <Server aria-hidden="true" className={className} />;
    case 'gamepad':
      return <Gamepad2 aria-hidden="true" className={className} />;
  }
}

/**
 * Interactive live-animated "System Architecture & Telemetry" node/status graph.
 * Clicking or focusing any node inspects its contracts, primitives, and live edges.
 */
export function SystemArchitectureGraph() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeId, setActiveId] = useState<ArchitectureNodeId>('architecture');
  const [isAutoCycling, setIsAutoCycling] = useState(true);

  const shouldCycle = isAutoCycling && !prefersReducedMotion;

  useEffect(() => {
    if (!shouldCycle) {
      return;
    }

    const order: readonly ArchitectureNodeId[] = [
      'architecture',
      'ai-agents',
      'fullstack',
      'gamedev',
    ];

    const timer = window.setInterval(() => {
      setActiveId((prev) => {
        const idx = order.indexOf(prev);
        return order[(idx + 1) % order.length] ?? 'architecture';
      });
    }, 4200);

    return () => {
      window.clearInterval(timer);
    };
  }, [shouldCycle]);

  const activeNode =
    ARCHITECTURE_NODES.find((node) => node.id === activeId) ??
    ARCHITECTURE_NODES[0];

  const connectedEdges = ARCHITECTURE_EDGES.filter(
    (edge) => edge.from === activeId || edge.to === activeId,
  );

  const connectedNodeIds = new Set<ArchitectureNodeId>([activeId]);
  for (const edge of connectedEdges) {
    connectedNodeIds.add(edge.from);
    connectedNodeIds.add(edge.to);
  }

  const nodeById = new Map(ARCHITECTURE_NODES.map((node) => [node.id, node]));

  const selectNode = (id: ArchitectureNodeId) => {
    setActiveId(id);
    setIsAutoCycling(false);
  };

  return (
    <SpotlightCard tone={activeNode.tone} spotlightSize={420} className="h-full">
      <div className="flex h-full flex-col justify-between p-4 sm:p-5">
        {/* Widget Telemetry Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface">
              <Cpu aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
            </span>
            <div>
              <p className="font-mono text-[11px] font-semibold tracking-tight text-ink">
                System Architecture &amp; Telemetry
              </p>
              <p className="font-mono text-[10px] text-ink-muted">
                LIVE TOPOLOGY · 4 NODES · {ARCHITECTURE_EDGES.length} LINKS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAutoCycling((prev) => !prev)}
            disabled={prefersReducedMotion}
            aria-pressed={shouldCycle}
            aria-label={
              shouldCycle
                ? 'Automatischen Node-Durchlauf pausieren'
                : 'Automatischen Node-Durchlauf starten'
            }
            className="inline-flex min-h-7 items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-2 py-1 font-mono text-[10px] text-ink-secondary transition-colors hover:border-border hover:text-ink disabled:opacity-50"
          >
            {shouldCycle ? (
              <>
                <Pause aria-hidden="true" className="h-3 w-3 text-emerald" />
                <span>Auto</span>
              </>
            ) : (
              <>
                <Play aria-hidden="true" className="h-3 w-3 text-ink-muted" />
                <span>Pinned</span>
              </>
            )}
          </button>
        </div>

        {/* Interactive Topology Canvas */}
        <div className="relative my-4 overflow-hidden rounded-xl border border-border-subtle bg-surface/90 p-3 sm:p-4">
          {/* Subtle architectural dot matrix */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(var(--border-default)_1px,transparent_1px)] [background-size:18px_18px]"
          />

          {/* SVG edge layer (aligned to 2x2 grid on sm+ viewports) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
          >
            {ARCHITECTURE_EDGES.map((edge) => {
              const from = nodeById.get(edge.from);
              const to = nodeById.get(edge.to);
              if (!from || !to) {
                return null;
              }
              const isHighlighted =
                edge.from === activeId || edge.to === activeId;

              return (
                <g key={edge.id}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={
                      isHighlighted
                        ? 'var(--accent-primary)'
                        : 'var(--border-default)'
                    }
                    strokeOpacity={isHighlighted ? 0.7 : 0.45}
                    strokeWidth={isHighlighted ? 0.65 : 0.4}
                    strokeDasharray={isHighlighted ? '2.2 1.6' : undefined}
                    className={cn(
                      isHighlighted &&
                        !prefersReducedMotion &&
                        'architecture-edge-flow',
                    )}
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive 2x2 Node Grid aligned to SVG coordinates */}
          <div
            role="group"
            aria-label="System-Architektur-Knoten inspizieren"
            className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
          >
            {ARCHITECTURE_NODES.map((node) => {
              const isSelected = node.id === activeId;
              const isLinked = connectedNodeIds.has(node.id);

              return (
                <button
                  key={node.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => selectNode(node.id)}
                  onMouseEnter={() => {
                    if (!isAutoCycling) {
                      return;
                    }
                    setActiveId(node.id);
                  }}
                  className={cn(
                    'group relative flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                    isSelected
                      ? cn(
                          'bg-elevated shadow-[0_10px_28px_-14px_rgba(0,0,0,0.9)]',
                          node.accentBorder,
                        )
                      : isLinked
                        ? 'border-border bg-elevated/80 hover:border-border-strong'
                        : 'border-border-subtle bg-elevated/55 opacity-75 hover:opacity-100',
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-ink-muted">
                      {node.code}
                    </span>
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      {isSelected && !prefersReducedMotion ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                            node.accentDot,
                          )}
                        />
                      ) : null}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'relative inline-flex h-1.5 w-1.5 rounded-full',
                          isSelected ? node.accentDot : 'bg-border-strong',
                        )}
                      />
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                        isSelected
                          ? cn(node.accentBorder, node.accentBg)
                          : 'border-border-subtle bg-surface',
                      )}
                    >
                      <NodeIcon
                        icon={node.icon}
                        className={cn(
                          'h-3.5 w-3.5',
                          isSelected ? node.accentText : 'text-ink-muted',
                        )}
                      />
                    </span>
                    <span className="text-xs font-semibold tracking-tight text-ink">
                      {node.label}
                    </span>
                  </div>

                  <div className="mt-2.5 flex w-full items-center justify-between gap-2 border-t border-border-subtle pt-2 font-mono text-[10px]">
                    <span className="truncate text-ink-muted">
                      {node.metricLabel}
                    </span>
                    <span className={cn('shrink-0 font-medium', node.accentText)}>
                      {node.metricValue}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Node Telemetry Inspector */}
        <div
          aria-live="polite"
          className="rounded-xl border border-border-subtle bg-surface/80 p-3.5"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeNode.id}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={prefersReducedMotion ? REDUCED_TRANSITION : SPRINGS.taut}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-secondary">
                  <Activity
                    aria-hidden="true"
                    className={cn('h-3 w-3', activeNode.accentText)}
                  />
                  <span>{activeNode.status}</span>
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-muted">
                  <GitBranch aria-hidden="true" className="h-3 w-3" />
                  <span>{connectedEdges.length} aktive Verbindungen</span>
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
                {activeNode.summary}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {activeNode.primitives.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-border-subtle bg-elevated px-2 py-0.5 font-mono text-[10px] text-ink-secondary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SpotlightCard>
  );
}
