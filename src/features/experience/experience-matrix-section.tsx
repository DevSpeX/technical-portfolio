'use client';

import {
  Bot,
  Cpu,
  Gamepad2,
  GitMerge,
  Layers,
  Server,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useSoundFX } from '@/features/audio-engine';
import { InspectableModule } from '@/features/inspector';
import { SpotlightCard } from '@/shared/components';
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion';
import { cn } from '@/shared/lib/cn';
import { useAccessibleMotion } from '@/shared/lib/motion';
import { Container } from '@/shared/ui/container';
import {
  ENGINEERING_PILLARS,
  PILLAR_CONNECTIONS,
  type EngineeringPillar,
  type MatrixTool,
  type PillarConnection,
  type PillarId,
} from './matrix-data';

function PillarIcon({
  id,
  className,
}: {
  readonly id: PillarId;
  readonly className?: string;
}) {
  switch (id) {
    case 'frontend-motion':
      return <Layers aria-hidden="true" className={className} />;
    case 'backend-cloud-linux':
      return <Server aria-hidden="true" className={className} />;
    case 'ai-workflows':
      return <Bot aria-hidden="true" className={className} />;
    case 'gamedev-csharp':
      return <Gamepad2 aria-hidden="true" className={className} />;
  }
}

interface ActiveSelection {
  readonly pillarId: PillarId;
  readonly toolId: string | null;
}

const PILLAR_X_CENTERS: Record<PillarId, number> = {
  'frontend-motion': 125,
  'backend-cloud-linux': 375,
  'ai-workflows': 625,
  'gamedev-csharp': 875,
};

function buildConnectorPath(conn: PillarConnection): string {
  const x1 = PILLAR_X_CENTERS[conn.from];
  const x2 = PILLAR_X_CENTERS[conn.to];
  const baseY = 70;
  const arcPeakY = 64 - conn.lane * 19;
  const offsetX = (x2 - x1) * 0.18;

  return `M ${x1} ${baseY} C ${x1 + offsetX} ${arcPeakY}, ${x2 - offsetX} ${arcPeakY}, ${x2} ${baseY}`;
}

function getRelationshipBadgeLabel(
  activePillar: EngineeringPillar,
  activeTool: MatrixTool | null,
  targetPillarId: PillarId,
): string {
  if (activeTool && activeTool.connectsTo.includes(targetPillarId)) {
    const directConn = PILLAR_CONNECTIONS.find(
      (c) => c.from === activePillar.id && c.to === targetPillarId,
    );
    return directConn?.label ?? activeTool.relationLabel;
  }

  const outgoing = PILLAR_CONNECTIONS.find(
    (c) => c.from === activePillar.id && c.to === targetPillarId,
  );
  if (outgoing) {
    return outgoing.label;
  }

  const incoming = PILLAR_CONNECTIONS.find(
    (c) => c.from === targetPillarId && c.to === activePillar.id,
  );
  if (incoming) {
    return incoming.label;
  }

  return 'Linked ↔';
}

/**
 * 4-Pillar Tech-Stack & Engineering Philosophy Matrix.
 * Uses fixed-height inspector bars, CSS containment, and GPU-composited
 * transitions only so hovering never causes layout shifts.
 */
export function ExperienceMatrixSection() {
  const { staggerContainer, fadeUp, viewport } = useAccessibleMotion();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { playClick } = useSoundFX();

  const [hovered, setHovered] = useState<ActiveSelection | null>(null);
  const [pinned, setPinned] = useState<ActiveSelection | null>(null);

  const activeSelection = hovered ?? pinned;

  const activePillar: EngineeringPillar | null = activeSelection
    ? (ENGINEERING_PILLARS.find((p) => p.id === activeSelection.pillarId) ??
      null)
    : null;

  const activeTool: MatrixTool | null =
    activePillar && activeSelection?.toolId
      ? (activePillar.tools.find((t) => t.id === activeSelection.toolId) ??
        null)
      : null;

  const connectedPillarIds = new Set<PillarId>();
  if (activeTool && activePillar) {
    connectedPillarIds.add(activePillar.id);
    for (const target of activeTool.connectsTo) {
      connectedPillarIds.add(target);
    }
  } else if (activePillar) {
    connectedPillarIds.add(activePillar.id);
    for (const target of activePillar.linkedPillars) {
      connectedPillarIds.add(target);
    }
  }

  const togglePin = (pillarId: PillarId, toolId: string | null) => {
    playClick();
    setPinned((prev) =>
      prev && prev.pillarId === pillarId && prev.toolId === toolId
        ? null
        : { pillarId, toolId },
    );
  };

  const activeConnections = activePillar
    ? PILLAR_CONNECTIONS.filter((conn) => {
        const involvesActive =
          conn.from === activePillar.id || conn.to === activePillar.id;
        if (!involvesActive) {
          return false;
        }
        const otherPillar =
          conn.from === activePillar.id ? conn.to : conn.from;
        return connectedPillarIds.has(otherPillar);
      })
    : [];

  return (
    <InspectableModule
      as="section"
      id="experience"
      tabIndex={-1}
      name="EngineeringMatrixSection"
      layer="Client // Architecture Matrix"
      renderMetric="4 Pillars · SVG Topology · 0px CLS"
      tone="client"
      className="scroll-mt-24 border-t border-border-subtle bg-surface/65 py-16 sm:py-20"
    >
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {/* Section Header */}
          <motion.div
            variants={fadeUp}
            className="mb-7 flex flex-wrap items-end justify-between gap-4"
          >
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-amber">
                Tech-Stack &amp; Engineering Philosophy Matrix
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                4-Säulen-Architektur statt Prozent-Balken
              </h2>
            </div>

            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted">
              <GitMerge aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
              <span>Hover oder Klick visualisiert Schnittstellen &amp; Datenflüsse</span>
            </span>
          </motion.div>

          {/* Fixed-Height Live Synergy Readout Bar (zero layout shift on hover/pin) */}
          <motion.div
            variants={fadeUp}
            aria-live="polite"
            className="mb-5 flex min-h-[5.75rem] items-center justify-between gap-4 rounded-xl border border-border-subtle bg-elevated/90 px-4 py-3 sm:h-[5.25rem] sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex h-5 items-center gap-2 overflow-hidden font-mono text-[11px]">
                {activePillar ? (
                  <>
                    <span
                      className={cn(
                        'shrink-0 font-semibold uppercase tracking-wider',
                        activePillar.accentText,
                      )}
                    >
                      {activeTool
                        ? `${activePillar.title} → ${activeTool.name}`
                        : activePillar.title}
                    </span>
                    <span className="shrink-0 text-border-strong">·</span>
                    <span className="truncate text-ink-muted">
                      Verknüpft mit{' '}
                      {Array.from(connectedPillarIds)
                        .filter((id) => id !== activePillar.id)
                        .map(
                          (id) =>
                            ENGINEERING_PILLARS.find((p) => p.id === id)
                              ?.title ?? id,
                        )
                        .join(', ')}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-accent"
                    />
                    <span className="truncate font-semibold uppercase tracking-wider text-ink-secondary">
                      System Topology · 4 Säulen · 16 Core Tools
                    </span>
                  </>
                )}
              </div>

              <p className="mt-1 line-clamp-2 h-10 text-xs leading-5 text-ink-secondary">
                {activePillar
                  ? activeTool
                    ? activeTool.synergyNote
                    : activePillar.synergySummary
                  : 'Jede Säule verstärkt die angrenzenden Schichten — fahre über eine Säule oder ein Tool, um Datenflüsse, Orchestrierung und Laufzeit-Verbindungen sichtbar zu machen.'}
              </p>
            </div>

            <button
              type="button"
              tabIndex={pinned ? 0 : -1}
              aria-hidden={!pinned}
              onClick={() => {
                playClick();
                setPinned(null);
              }}
              aria-label="Fixierte Säulen- oder Tool-Auswahl lösen"
              className={cn(
                'shrink-0 rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 font-mono text-[10px] text-ink-secondary transition-[opacity,border-color,color] duration-150 hover:border-border hover:text-ink',
                pinned
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0',
              )}
            >
              Auswahl lösen
            </button>
          </motion.div>

          {/* Glowing SVG Cross-Pillar Connector Bus (Desktop 4-Column View) */}
          <motion.div
            variants={fadeUp}
            aria-hidden="true"
            className="relative mb-2 hidden h-[88px] w-full overflow-hidden rounded-xl border border-border-subtle/80 bg-surface/55 xl:block"
          >
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(var(--border-default)_1px,transparent_1px)] [background-size:20px_20px]" />

            <svg
              viewBox="0 0 1000 88"
              preserveAspectRatio="none"
              className="relative z-10 h-full w-full"
            >
              {/* All cross-pillar curved connectors */}
              {PILLAR_CONNECTIONS.map((conn) => {
                const isActiveConn = activeConnections.some(
                  (c) => c.id === conn.id,
                );
                const pathD = buildConnectorPath(conn);
                const strokeColor =
                  isActiveConn && activePillar
                    ? activePillar.accentStroke
                    : 'var(--border-default)';

                return (
                  <g key={conn.id}>
                    {isActiveConn ? (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeOpacity={0.22}
                        strokeWidth={6}
                        strokeLinecap="round"
                      />
                    ) : null}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeOpacity={
                        activePillar
                          ? isActiveConn
                            ? 0.95
                            : 0.1
                          : 0.32
                      }
                      strokeWidth={isActiveConn ? 2.1 : 1.1}
                      strokeDasharray={isActiveConn ? '6 4' : undefined}
                      className={cn(
                        'transition-opacity duration-200',
                        isActiveConn &&
                          !prefersReducedMotion &&
                          'architecture-edge-flow',
                      )}
                    />
                  </g>
                );
              })}

              {/* 4 Pillar Vertical Pin Stems & Anchor Nodes */}
              {ENGINEERING_PILLARS.map((pillar) => {
                const cx = PILLAR_X_CENTERS[pillar.id];
                const isPrimary = activeSelection?.pillarId === pillar.id;
                const isConnected =
                  activeSelection !== null &&
                  !isPrimary &&
                  connectedPillarIds.has(pillar.id);
                const isDimmed =
                  activeSelection !== null && !isPrimary && !isConnected;

                const pinStroke = isPrimary
                  ? pillar.accentStroke
                  : isConnected && activePillar
                    ? activePillar.accentStroke
                    : 'var(--border-strong)';

                return (
                  <g
                    key={pillar.id}
                    opacity={isDimmed ? 0.25 : 1}
                    className="transition-opacity duration-200"
                  >
                    <line
                      x1={cx}
                      y1={70}
                      x2={cx}
                      y2={88}
                      stroke={pinStroke}
                      strokeWidth={isPrimary || isConnected ? 2.2 : 1.2}
                    />
                    {isPrimary || isConnected ? (
                      <circle
                        cx={cx}
                        cy={70}
                        r={7}
                        fill={pinStroke}
                        fillOpacity={0.22}
                      />
                    ) : null}
                    <circle
                      cx={cx}
                      cy={70}
                      r={isPrimary ? 4.2 : 3.2}
                      fill={pinStroke}
                    />
                  </g>
                );
              })}
            </svg>
          </motion.div>

          {/* 4-Column Architecture Matrix (Zero Layout-Shift + CSS Containment) */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ENGINEERING_PILLARS.map((pillar) => {
              const isPrimary = activeSelection?.pillarId === pillar.id;
              const isConnected =
                activeSelection !== null &&
                !isPrimary &&
                connectedPillarIds.has(pillar.id);
              const isDimmed =
                activeSelection !== null && !isPrimary && !isConnected;

              const relationBadge =
                isConnected && activePillar
                  ? getRelationshipBadgeLabel(
                      activePillar,
                      activeTool,
                      pillar.id,
                    )
                  : null;

              return (
                <motion.div
                  key={pillar.id}
                  variants={fadeUp}
                  onMouseEnter={() =>
                    setHovered({ pillarId: pillar.id, toolId: null })
                  }
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    'matrix-pillar-shell h-full transition-opacity duration-200',
                    isDimmed ? 'opacity-40' : 'opacity-100',
                  )}
                >
                  <SpotlightCard
                    as="article"
                    tone={pillar.tone}
                    spotlightSize={320}
                    className={cn(
                      'h-full transition-[border-color,box-shadow,background-color] duration-200',
                      isPrimary &&
                        cn(
                          pillar.accentBorder,
                          'shadow-[0_0_28px_-14px_rgba(96,165,250,0.55)]',
                        ),
                      isConnected &&
                        activePillar &&
                        cn(
                          activePillar.accentBorder,
                          'shadow-[0_0_22px_-14px_rgba(52,211,153,0.4)]',
                        ),
                    )}
                  >
                    <div className="flex h-full flex-col justify-between p-5">
                      <div>
                        {/* Fixed-height Meta & Relationship Badge Row (never wraps or shifts) */}
                        <div className="flex h-6 items-center justify-between gap-2">
                          <span className="font-mono text-[10px] tracking-wider text-ink-muted">
                            PILLAR {pillar.index}
                          </span>

                          <span
                            className={cn(
                              'inline-flex h-5 items-center rounded-full border px-2 font-mono text-[10px] tracking-wide transition-[border-color,background-color,color] duration-150',
                              isPrimary
                                ? cn(
                                    pillar.accentBorder,
                                    pillar.accentBg,
                                    pillar.accentText,
                                  )
                                : isConnected && activePillar
                                  ? cn(
                                      activePillar.accentBorder,
                                      activePillar.accentBg,
                                      activePillar.accentText,
                                    )
                                  : 'border-border-subtle bg-surface text-ink-muted',
                            )}
                          >
                            {isPrimary
                              ? 'Active Focus'
                              : relationBadge
                                ? relationBadge
                                : isDimmed
                                  ? 'Standby'
                                  : `${pillar.tools.length} Core Tools`}
                          </span>
                        </div>

                        {/* Pillar Title Header */}
                        <button
                          type="button"
                          onClick={() => togglePin(pillar.id, null)}
                          onFocus={() =>
                            setHovered({ pillarId: pillar.id, toolId: null })
                          }
                          onBlur={() => setHovered(null)}
                          aria-pressed={
                            pinned?.pillarId === pillar.id &&
                            pinned.toolId === null
                          }
                          className="mt-2.5 flex w-full items-center gap-2.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        >
                          <span
                            className={cn(
                              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-[border-color,background-color] duration-150',
                              isPrimary
                                ? cn(pillar.accentBorder, pillar.accentBg)
                                : isConnected && activePillar
                                  ? cn(
                                      activePillar.accentBorder,
                                      activePillar.accentBg,
                                    )
                                  : 'border-border-subtle bg-surface',
                            )}
                          >
                            <PillarIcon
                              id={pillar.id}
                              className={cn('h-4 w-4', pillar.accentText)}
                            />
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold tracking-tight text-ink">
                              {pillar.title}
                            </h3>
                            <p className="truncate font-mono text-[11px] text-ink-muted">
                              {pillar.subtitle}
                            </p>
                          </div>
                        </button>

                        {/* Concise 1-Sentence Domain Summary (aligned across all 4 cards) */}
                        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-ink-secondary">
                          {pillar.summary}
                        </p>

                        {/* Interactive Tool Nodes */}
                        <div
                          role="group"
                          aria-label={`${pillar.title} Tools`}
                          className="mt-4 space-y-2 border-t border-border-subtle pt-4"
                        >
                          {pillar.tools.map((tool) => {
                            const isToolActive =
                              activeSelection?.pillarId === pillar.id &&
                              activeSelection.toolId === tool.id;
                            const isToolLinkedToActive =
                              activeSelection !== null &&
                              activeSelection.pillarId !== pillar.id &&
                              tool.connectsTo.includes(
                                activeSelection.pillarId,
                              );

                            return (
                              <button
                                key={tool.id}
                                type="button"
                                onMouseEnter={() =>
                                  setHovered({
                                    pillarId: pillar.id,
                                    toolId: tool.id,
                                  })
                                }
                                onMouseLeave={() =>
                                  setHovered({
                                    pillarId: pillar.id,
                                    toolId: null,
                                  })
                                }
                                onFocus={() =>
                                  setHovered({
                                    pillarId: pillar.id,
                                    toolId: tool.id,
                                  })
                                }
                                onClick={() => togglePin(pillar.id, tool.id)}
                                aria-pressed={
                                  pinned?.pillarId === pillar.id &&
                                  pinned.toolId === tool.id
                                }
                                className={cn(
                                  'w-full rounded-lg border px-3 py-2 text-left transition-[border-color,background-color,box-shadow,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                                  isToolActive
                                    ? cn(
                                        'bg-surface text-ink',
                                        pillar.accentBorder,
                                      )
                                    : isToolLinkedToActive && activePillar
                                      ? cn(
                                          'bg-surface/90 text-ink',
                                          activePillar.accentBorder,
                                        )
                                      : 'border-border-subtle bg-surface/55 text-ink-secondary hover:border-border hover:bg-surface',
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="flex min-w-0 items-center gap-2">
                                    <span
                                      aria-hidden="true"
                                      className={cn(
                                        'h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-150',
                                        isToolActive
                                          ? pillar.accentDot
                                          : isToolLinkedToActive && activePillar
                                            ? activePillar.accentDot
                                            : 'bg-border-strong',
                                      )}
                                    />
                                    <span className="truncate font-mono text-xs font-medium text-ink">
                                      {tool.name}
                                    </span>
                                  </span>
                                  <span
                                    aria-hidden="true"
                                    className="shrink-0 font-mono text-[9px] text-ink-muted"
                                  >
                                    →{tool.connectsTo.length}
                                  </span>
                                  <span className="sr-only">
                                    Verknüpft mit {tool.connectsTo.length} Säulen
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate pl-3.5 text-[11px] text-ink-muted">
                                  {tool.role}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Engineering Invariant Footer */}
                      <div className="mt-4 flex items-center gap-2 border-t border-border-subtle pt-3 font-mono text-[10px] text-ink-muted">
                        <Cpu
                          aria-hidden="true"
                          className={cn('h-3 w-3 shrink-0', pillar.accentText)}
                        />
                        <span className="truncate">{pillar.invariant}</span>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </Container>
    </InspectableModule>
  );
}
