'use client';

import {
  Activity,
  ArrowDown,
  Command,
  Cpu,
  FolderGit2,
  Gamepad2,
  Layers,
  ScanEye,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { motion } from 'motion/react';
import type {
  AccentVariant,
  ProjectItem,
  SiteConfig,
  SkillDomain,
  SkillDomainId,
} from '@/config';
import { useCommandPalette } from '@/features/command-palette';
import { InspectableModule, useInspector } from '@/features/inspector';
import type { FeatureModuleMeta } from '@/features/types';
import {
  FloatingDockNav,
  MagneticButton,
  SpotlightCard,
  type SpotlightTone,
} from '@/shared/components';
import { cn } from '@/shared/lib/cn';
import { useAccessibleMotion } from '@/shared/lib/motion';
import {
  usePortfolioFilter,
  type ProjectFilterCategory,
} from '@/shared/providers/portfolio-filter-provider';
import { useSmoothScroll } from '@/shared/providers/smooth-scroll-provider';
import { Container } from '@/shared/ui/container';
import { StatusPill, type StatusTone } from '@/shared/ui/status-pill';

export interface FoundationBlueprintProps {
  readonly site: SiteConfig;
  readonly projects: readonly ProjectItem[];
  readonly modules: readonly FeatureModuleMeta[];
}

const DOMAIN_ICONS: Record<SkillDomainId, typeof Cpu> = {
  'fullstack-ai': Cpu,
  'linux-oss': Terminal,
  'gamedev-interactive': Gamepad2,
};

const ACCENT_TO_TONE: Record<AccentVariant, StatusTone> = {
  cobalt: 'cobalt',
  emerald: 'emerald',
  amber: 'amber',
};

const ACCENT_TO_SPOTLIGHT: Record<AccentVariant, SpotlightTone> = {
  cobalt: 'cobalt',
  emerald: 'emerald',
  amber: 'amber',
};

const CATEGORY_TO_SPOTLIGHT: Record<SkillDomainId, SpotlightTone> = {
  'fullstack-ai': 'cobalt',
  'linux-oss': 'emerald',
  'gamedev-interactive': 'amber',
};

const ACCENT_ICON_COLOR: Record<AccentVariant, string> = {
  cobalt: 'text-accent',
  emerald: 'text-emerald',
  amber: 'text-amber',
};

const ENGINEERING_PRINCIPLES: ReadonlyArray<{
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly detail: string;
  readonly layer: string;
}> = [
  {
    id: 'rsc-boundaries',
    index: '01',
    title: 'Klare Server- & Client-Grenzen',
    detail:
      'Konfiguration, Projekt-Registry und Datenladung bleiben auf dem Server; interaktive Inseln werden gezielt über Client-Boundaries hydratisiert.',
    layer: 'Next.js 15 App Router',
  },
  {
    id: 'zero-rerender-telemetry',
    index: '02',
    title: '60–120fps Pointer-Pipeline',
    detail:
      'Maus-Tracking mutiert CSS-Variablen (--mouse-x, --mouse-y) direkt via requestAnimationFrame oder MotionValues statt React-State-Updates auszulösen.',
    layer: 'GPU Compositor',
  },
  {
    id: 'keyboard-a11y',
    index: '03',
    title: 'Keyboard-First & Barrierefreiheit',
    detail:
      'Native <dialog>-Top-Layer, Fokus-Management, IME-sichere Shortcuts (⌘K, Alt+I) und respektiertes prefers-reduced-motion als Grundstandard.',
    layer: 'WCAG AA+ Baseline',
  },
];

function DomainCard({ domain }: { readonly domain: SkillDomain }) {
  const Icon = DOMAIN_ICONS[domain.id];

  return (
    <SpotlightCard
      as="article"
      tone={ACCENT_TO_SPOTLIGHT[domain.accent]}
      className="h-full"
    >
      <div className="flex h-full flex-col justify-between p-6">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface">
              <Icon
                aria-hidden="true"
                className={cn('h-4 w-4', ACCENT_ICON_COLOR[domain.accent])}
              />
            </div>
            <StatusPill
              label={domain.shortLabel}
              tone={ACCENT_TO_TONE[domain.accent]}
            />
          </div>

          <h3 className="text-base font-semibold tracking-tight text-ink">
            {domain.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            {domain.summary}
          </p>

          <ul className="mt-4 space-y-2 border-t border-border-subtle pt-4">
            {domain.focusAreas.map((area) => (
              <li
                key={area}
                className="flex items-start gap-2 text-xs leading-relaxed text-ink-secondary"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-border-strong"
                />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5 pt-2">
          {domain.stack.map((item) => (
            <span
              key={item}
              className="rounded-md border border-border-subtle bg-surface px-2 py-0.5 font-mono text-[11px] text-ink-muted"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </SpotlightCard>
  );
}

export function FoundationBlueprint({
  site,
  projects,
  modules,
}: FoundationBlueprintProps) {
  const { staggerContainer, fadeUp, scaleIn, viewport } = useAccessibleMotion();
  const { isSmoothEnabled, scrollTo } = useSmoothScroll();
  const { open: openPalette } = useCommandPalette();
  const { isActive: isInspectorActive, toggle: toggleInspector } =
    useInspector();
  const { activeCategory, setActiveCategory } = usePortfolioFilter();

  const visibleProjects =
    activeCategory === 'all'
      ? projects
      : projects.filter((project) => project.category === activeCategory);

  const filterTabs: ReadonlyArray<{
    readonly id: ProjectFilterCategory;
    readonly label: string;
    readonly count: number;
  }> = [
    { id: 'all', label: 'Alle', count: projects.length },
    ...site.skillDomains.map((domain) => ({
      id: domain.id,
      label: domain.shortLabel,
      count: projects.filter((project) => project.category === domain.id).length,
    })),
  ];

  return (
    <div className="relative min-h-screen bg-canvas text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,color-mix(in_oklab,var(--accent-primary)_10%,transparent),transparent)]"
      />

      <FloatingDockNav site={site} />

      <InspectableModule
        as="section"
        id="hero"
        tabIndex={-1}
        name="HeroSection"
        layer="Client // Interactive"
        renderMetric="Magnetic CTAs + Motion"
        tone="client"
        className="scroll-mt-24 pt-28 pb-16 sm:pt-32 sm:pb-24"
      >
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} className="mb-6 flex flex-wrap gap-2">
              <StatusPill
                label={site.owner.availabilityLabel}
                tone="cobalt"
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
              />
              <StatusPill
                label="Phase 2 · Core UX Systems"
                tone="emerald"
                icon={<Layers className="h-3.5 w-3.5" />}
              />
              <StatusPill
                label={isSmoothEnabled ? 'Lenis Active' : 'Native Scroll'}
                tone={isSmoothEnabled ? 'neutral' : 'neutral'}
                icon={<Activity className="h-3.5 w-3.5" />}
              />
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-3xl font-semibold tracking-tight text-ink sm:text-5xl sm:leading-[1.12]"
            >
              {site.owner.headline}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-2xl text-base leading-relaxed text-ink-secondary sm:text-lg"
            >
              {site.owner.subheadline}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <MagneticButton
                variant="primary"
                size="md"
                onClick={() => scrollTo('#projects', { offset: -96 })}
              >
                <span>Projekt-Strukturen ansehen</span>
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
          </motion.div>
        </Container>
      </InspectableModule>

      <InspectableModule
        as="section"
        name="CoreDomainsGrid"
        layer="Client // Interactive"
        renderMetric="CSS Vars · 120fps"
        tone="client"
        className="border-t border-border-subtle py-14 sm:py-16"
      >
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <motion.div variants={fadeUp} className="mb-8">
              <p className="font-mono text-xs uppercase tracking-wider text-accent">
                Core Domains
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
                Spezialisierte Engineering-Disziplinen
              </h2>
            </motion.div>

            <div className="grid gap-5 lg:grid-cols-3">
              {site.skillDomains.map((domain) => (
                <motion.div key={domain.id} variants={scaleIn}>
                  <DomainCard domain={domain} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </InspectableModule>

      <InspectableModule
        as="section"
        id="projects"
        tabIndex={-1}
        name="ProjectRegistrySection"
        layer="Client // Interactive"
        renderMetric={`${visibleProjects.length}/${projects.length} Filtered`}
        tone="client"
        className="scroll-mt-24 border-t border-border-subtle bg-surface py-14 sm:py-16"
      >
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <motion.div
              variants={fadeUp}
              className="mb-6 flex flex-wrap items-end justify-between gap-4"
            >
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-emerald">
                  Project Registry
                </p>
                <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
                  Typisierte Architektur-Systeme
                </h2>
              </div>
              <span className="font-mono text-xs text-ink-muted">
                src/config/projects.config.ts · {visibleProjects.length} von{' '}
                {projects.length} Einträgen
              </span>
            </motion.div>

            {/* Synchronized domain filter pills (controllable via UI or Cmd/Ctrl+K) */}
            <div
              role="group"
              aria-label="Projekte nach Disziplin filtern"
              className="mb-7 flex flex-wrap gap-2"
            >
              {filterTabs.map((tab) => {
                const isSelected = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setActiveCategory(tab.id)}
                    className={cn(
                      'inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors',
                      isSelected
                        ? 'border-emerald/50 bg-emerald-soft text-ink'
                        : 'border-border-subtle bg-elevated text-ink-secondary hover:border-border hover:text-ink',
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-ink-muted">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {visibleProjects.map((project) => (
                <motion.div key={project.id} variants={fadeUp}>
                  <SpotlightCard
                    as="article"
                    tone={CATEGORY_TO_SPOTLIGHT[project.category]}
                    className="h-full"
                  >
                    <div className="flex h-full flex-col justify-between p-5">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2 font-mono text-xs text-ink-muted">
                            <FolderGit2
                              aria-hidden="true"
                              className="h-3.5 w-3.5 text-accent"
                            />
                            <span>{project.slug}</span>
                          </span>
                          <StatusPill label={project.status} tone="neutral" />
                        </div>

                        <h3 className="mt-3 text-base font-semibold text-ink">
                          {project.title}
                        </h3>
                        <p className="mt-1 text-sm text-ink-secondary">
                          {project.tagline}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {project.techStack.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className="rounded bg-surface px-2 py-0.5 font-mono text-[11px] text-ink-muted"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                        <span className="font-mono text-[11px] text-ink-muted">
                          {project.year}
                        </span>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </InspectableModule>

      <InspectableModule
        as="section"
        id="telemetry"
        tabIndex={-1}
        name="FeatureModuleRegistry"
        layer="RSC // Server Data"
        renderMetric={`${modules.length} Modules`}
        tone="rsc"
        className="scroll-mt-24 border-t border-border-subtle py-14 sm:py-16"
      >
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-amber">
                Feature Architecture
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
                Isolierte Feature-Module
              </h2>
            </div>
            <span className="font-mono text-xs text-ink-muted">
              src/features/*
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((mod) => (
              <SpotlightCard
                key={mod.id}
                tone={mod.status === 'active' ? 'emerald' : 'neutral'}
                spotlightSize={280}
              >
                <div className="flex h-full flex-col justify-between p-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium text-ink">
                        {mod.id}
                      </span>
                      <span
                        className={cn(
                          'rounded border px-1.5 py-0.5 font-mono text-[10px]',
                          mod.status === 'active'
                            ? 'border-emerald/40 bg-emerald-soft text-emerald'
                            : 'border-border-subtle bg-surface text-ink-muted',
                        )}
                      >
                        {mod.status === 'active' ? 'Active' : mod.phase}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-ink-secondary">
                      {mod.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      {mod.description}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </Container>
      </InspectableModule>

      <InspectableModule
        as="section"
        id="experience"
        tabIndex={-1}
        name="EngineeringPrinciples"
        layer="RSC // Server Content"
        renderMetric="Static Spec"
        tone="rsc"
        className="scroll-mt-24 border-t border-border-subtle bg-surface/60 py-14 sm:py-16"
      >
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-accent">
                System Engineering
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
                Architektur-Prinzipien &amp; Laufzeit-Disziplin
              </h2>
            </div>
            <span className="font-mono text-xs text-ink-muted">
              Phase 2 · Core UX
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {ENGINEERING_PRINCIPLES.map((item) => (
              <SpotlightCard key={item.id} tone="cobalt" spotlightSize={300}>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-ink-muted">
                    <span className="text-accent">{item.index}</span>
                    <span>{item.layer}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
                    {item.detail}
                  </p>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </Container>
      </InspectableModule>

      <InspectableModule
        as="footer"
        id="contact"
        tabIndex={-1}
        name="ContactFooter"
        layer="Client // Interactive"
        renderMetric="Quick Actions via ⌘K"
        tone="client"
        className="scroll-mt-24 border-t border-border-subtle bg-surface py-10"
      >
        <Container className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-xs text-ink-secondary">
              {site.owner.name} · {site.owner.role}
            </p>
            <p className="mt-1 font-mono text-xs text-ink-muted">
              Obsidian &amp; Precision Slate · Next.js 15 App Router · Strict TypeScript
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MagneticButton
              variant="secondary"
              size="sm"
              onClick={openPalette}
              ariaHaspopup="dialog"
            >
              <Command aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
              <span>Kontakt &amp; Links (⌘K)</span>
            </MagneticButton>
            <span className="font-mono text-xs text-ink-muted">
              {site.owner.timezone}
            </span>
          </div>
        </Container>
      </InspectableModule>
    </div>
  );
}
