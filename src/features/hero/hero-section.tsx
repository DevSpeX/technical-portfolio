'use client';

import {
  Activity,
  ArrowDown,
  Command,
  ScanEye,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { SiteConfig } from '@/config';
import { useCommandPalette } from '@/features/command-palette';
import { InspectableModule, useInspector } from '@/features/inspector';
import { MagneticButton, TelemetryShaderCanvas } from '@/shared/components';
import { cn } from '@/shared/lib/cn';
import { useAccessibleMotion } from '@/shared/lib/motion';
import { useSmoothScroll } from '@/shared/providers/smooth-scroll-provider';
import { Container } from '@/shared/ui/container';
import { StatusPill } from '@/shared/ui/status-pill';
import { SystemArchitectureGraph } from './system-architecture-graph';

export interface HeroSectionProps {
  readonly site: SiteConfig;
}

const ROLE_SIGNATURE =
  'Software Engineer // AI-Orchestrator // Systems & Game Dev';

/**
 * Asymmetric Kinetic Hero pairing staggered precision typography and magnetic
 * CTAs on the left with a live-animated System Architecture & Telemetry graph.
 */
export function HeroSection({ site }: HeroSectionProps) {
  const { staggerContainer, fadeUp, scaleIn } = useAccessibleMotion();
  const { isSmoothEnabled, scrollTo } = useSmoothScroll();
  const { open: openPalette } = useCommandPalette();
  const { isActive: isInspectorActive, toggle: toggleInspector } =
    useInspector();

  return (
    <InspectableModule
      as="section"
      id="hero"
      tabIndex={-1}
      name="HeroSection"
      layer="Client // Asymmetric Kinetic Hero"
      renderMetric="SVG Topology + Magnetic CTAs"
      tone="client"
      className="relative scroll-mt-24 pt-28 pb-16 sm:pt-36 sm:pb-24"
    >
      {/* GPU-accelerated ambient topographic telemetry field */}
      <TelemetryShaderCanvas />

      <Container className="relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Asymmetric Typography Column (7/12) */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7"
          >
            <motion.div variants={fadeUp} className="mb-5 flex flex-wrap gap-2">
              <StatusPill
                label={site.owner.availabilityLabel}
                tone="cobalt"
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
              />
              <StatusPill
                label={isSmoothEnabled ? 'Lenis 120Hz' : 'Native Scroll'}
                tone="emerald"
                icon={<Activity className="h-3.5 w-3.5" />}
              />
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="inline-flex items-center gap-2 font-mono text-xs tracking-wide text-accent sm:text-sm"
            >
              <Terminal aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span>{ROLE_SIGNATURE}</span>
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-5xl sm:leading-[1.09] lg:text-[3.25rem]"
            >
              {site.owner.headline}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-2xl text-base leading-relaxed text-ink-secondary sm:text-lg"
            >
              {site.owner.subheadline}
            </motion.p>

            {/* Primary & Utility Magnetic CTAs */}
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <MagneticButton
                variant="primary"
                size="md"
                onClick={() => scrollTo('#projects', { offset: -96 })}
              >
                <span>Case-Studies erkunden</span>
                <ArrowDown aria-hidden="true" className="h-4 w-4 text-accent" />
              </MagneticButton>

              <MagneticButton
                variant="secondary"
                size="md"
                onClick={openPalette}
                ariaHaspopup="dialog"
              >
                <Command aria-hidden="true" className="h-4 w-4 text-accent" />
                <span>Command Palette</span>
                <kbd className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
                  ⌘K
                </kbd>
              </MagneticButton>

              <MagneticButton
                variant="ghost"
                size="md"
                onClick={toggleInspector}
                ariaPressed={isInspectorActive}
              >
                <ScanEye
                  aria-hidden="true"
                  className={cn(
                    'h-4 w-4',
                    isInspectorActive ? 'text-accent' : 'text-ink-muted',
                  )}
                />
                <span>{isInspectorActive ? 'X-Ray Aktiv' : 'X-Ray Mode'}</span>
                <kbd className="rounded border border-border-subtle bg-elevated px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
                  Alt+I
                </kbd>
              </MagneticButton>
            </motion.div>

            {/* Compact System Spec Strip */}
            <motion.dl
              variants={fadeUp}
              className="mt-10 grid max-w-xl grid-cols-1 gap-3 border-t border-border-subtle pt-5 sm:grid-cols-3 sm:gap-4"
            >
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Standort
                </dt>
                <dd className="mt-1 font-mono text-xs text-ink">
                  {site.owner.location}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Fokus
                </dt>
                <dd className="mt-1 font-mono text-xs text-ink">
                  Web · AI · Linux · C#
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Architektur
                </dt>
                <dd className="mt-1 font-mono text-xs text-emerald">
                  Strict TS · RSC
                </dd>
              </div>
            </motion.dl>
          </motion.div>

          {/* Right Live Interactive System Architecture Graph (5/12) */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5"
          >
            <SystemArchitectureGraph />
          </motion.div>
        </div>
      </Container>
    </InspectableModule>
  );
}
