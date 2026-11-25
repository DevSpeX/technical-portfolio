'use client';

import { ArrowUpRight, FolderGit2, Layers, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ProjectCategory, ProjectItem } from '@/config';
import { useSoundFX } from '@/features/audio-engine';
import { InspectableModule } from '@/features/inspector';
import { SpotlightCard, type SpotlightTone } from '@/shared/components';
import { cn } from '@/shared/lib/cn';
import { useAccessibleMotion } from '@/shared/lib/motion';
import {
  usePortfolioFilter,
  type ProjectFilterCategory,
} from '@/shared/providers/portfolio-filter-provider';
import { Container } from '@/shared/ui/container';
import { StatusPill } from '@/shared/ui/status-pill';
import { CaseStudyDrawer } from './case-study-drawer';

export interface ProjectsSectionProps {
  readonly projects: readonly ProjectItem[];
}

const HASH_PREFIX = '#case-study/';

const CATEGORY_TO_SPOTLIGHT: Record<ProjectCategory, SpotlightTone> = {
  'fullstack-ai': 'cobalt',
  'linux-oss': 'emerald',
  'gamedev-interactive': 'amber',
};

const FILTER_OPTIONS: ReadonlyArray<{
  readonly id: ProjectFilterCategory;
  readonly label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'fullstack-ai', label: 'Full-Stack & AI' },
  { id: 'linux-oss', label: 'Systems & Open Source' },
  { id: 'gamedev-interactive', label: 'Game Dev' },
];

function resolveSlugFromHash(
  hash: string,
  projects: readonly ProjectItem[],
): string | null {
  if (!hash) {
    return null;
  }

  const normalized = hash.startsWith(HASH_PREFIX)
    ? hash.slice(HASH_PREFIX.length)
    : hash.startsWith('#project-')
      ? hash.slice('#project-'.length)
      : null;

  if (!normalized) {
    return null;
  }

  const match = projects.find((project) => project.slug === normalized);
  return match ? match.slug : null;
}

/**
 * Asymmetric Bento Grid of SpotlightCards with synchronized category filtering
 * and a native top-layer Case-Study Drawer synced to URL hashes.
 */
export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const {
    staggerContainer,
    fadeUp,
    viewport,
    prefersReducedMotion,
    transition,
  } = useAccessibleMotion();
  const { activeCategory, setActiveCategory } = usePortfolioFilter();
  const { playHover, playClick } = useSoundFX();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Sync URL hash -> Drawer state on initial load and browser hashchange
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncFromHash = (): void => {
      const slug = resolveSlugFromHash(window.location.hash, projects);
      setSelectedSlug(slug);
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, [projects]);

  const openCaseStudy = useCallback((project: ProjectItem) => {
    setSelectedSlug(project.slug);
    if (typeof window !== 'undefined') {
      const targetHash = `${HASH_PREFIX}${project.slug}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    }
  }, []);

  const closeCaseStudy = useCallback(() => {
    setSelectedSlug(null);
    if (
      typeof window !== 'undefined' &&
      (window.location.hash.startsWith(HASH_PREFIX) ||
        window.location.hash.startsWith('#project-'))
    ) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#projects`,
      );
    }
  }, []);

  const visibleProjects =
    activeCategory === 'all'
      ? projects
      : projects.filter((project) => project.category === activeCategory);

  const selectedProject =
    selectedSlug !== null
      ? (projects.find((project) => project.slug === selectedSlug) ?? null)
      : null;

  return (
    <InspectableModule
      as="section"
      id="projects"
      tabIndex={-1}
      name="ProjectsBentoSection"
      layer="Client // Bento Grid + Top-Layer Dialog"
      renderMetric={`${visibleProjects.length}/${projects.length} Case Studies`}
      tone="client"
      className="scroll-mt-24 border-t border-border-subtle bg-surface py-16 sm:py-20"
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
              <p className="font-mono text-xs uppercase tracking-wider text-accent">
                Interactive Case-Study Bento Grid
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Ausgewählte Architektur- &amp; System-Projekte
              </h2>
            </div>

            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted">
              <Layers aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
              <span>Klick öffnet Case-Study Drawer</span>
            </span>
          </motion.div>

          {/* Category Filter Pills (synced with Command Palette) */}
          <motion.div
            variants={fadeUp}
            role="group"
            aria-label="Projekte nach Kategorie filtern"
            className="mb-8 flex flex-wrap gap-2"
          >
            {FILTER_OPTIONS.map((option) => {
              const count =
                option.id === 'all'
                  ? projects.length
                  : projects.filter((p) => p.category === option.id).length;
              const isSelected = activeCategory === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isSelected}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') {
                      playHover();
                    }
                  }}
                  onClick={() => {
                    playClick();
                    setActiveCategory(option.id);
                  }}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors',
                    isSelected
                      ? 'border-accent/55 bg-accent-soft text-ink'
                      : 'border-border-subtle bg-elevated text-ink-secondary hover:border-border hover:text-ink',
                  )}
                >
                  <span>{option.label}</span>
                  <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-ink-muted">
                    {count}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Asymmetric Bento Grid (12-column architectural rhythm) */}
        <div className="relative grid gap-5 lg:grid-cols-12">
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleProjects.map((project, index) => {
              const isWide =
                visibleProjects.length === 1
                  ? true
                  : index % 4 === 0 || index % 4 === 3;
              const colSpanClass =
                visibleProjects.length === 1
                  ? 'lg:col-span-12'
                  : isWide
                    ? 'lg:col-span-7'
                    : 'lg:col-span-5';

              return (
                <motion.div
                  key={project.id}
                  layout={prefersReducedMotion ? false : 'position'}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 12, scale: 0.98 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -8, scale: 0.98 }
                  }
                  transition={transition}
                  className={cn('h-full', colSpanClass)}
                >
                  <SpotlightCard
                    as="article"
                    tone={CATEGORY_TO_SPOTLIGHT[project.category]}
                    spotlightSize={isWide ? 440 : 340}
                    className="group h-full"
                  >
                    <button
                      type="button"
                      onClick={() => openCaseStudy(project)}
                      aria-haspopup="dialog"
                      className="flex h-full w-full flex-col justify-between p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus sm:p-6"
                    >
                      <div>
                        {/* Card Top Meta */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2 font-mono text-xs text-ink-muted">
                            <FolderGit2
                              aria-hidden="true"
                              className="h-3.5 w-3.5 text-accent"
                            />
                            <span>{project.slug}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {project.featured ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface px-2 py-0.5 font-mono text-[10px] text-amber">
                                <Sparkles
                                  aria-hidden="true"
                                  className="h-2.5 w-2.5"
                                />
                                <span>Featured</span>
                              </span>
                            ) : null}
                            <StatusPill label={project.status} tone="neutral" />
                          </div>
                        </div>

                        {/* Title & Tagline */}
                        <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink transition-colors group-hover:text-accent sm:text-xl">
                          {project.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
                          {project.tagline}
                        </p>

                        {/* Architecture Preview on Wide Cards */}
                        {isWide ? (
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {project.architecture.slice(0, 2).map((layer) => (
                              <div
                                key={layer.layer}
                                className="rounded-lg border border-border-subtle bg-surface/75 p-3"
                              >
                                <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                                  {layer.layer}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                                  {layer.detail}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {project.metrics.map((metric) => (
                              <span
                                key={metric.label}
                                className="rounded-md border border-border-subtle bg-surface/80 px-2.5 py-1 font-mono text-[11px] text-ink-secondary"
                              >
                                <span className="text-ink-muted">
                                  {metric.label}:{' '}
                                </span>
                                <span className="text-ink">{metric.value}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
                        <div className="flex flex-wrap gap-1.5">
                          {project.techStack.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className="rounded-md bg-surface px-2 py-0.5 font-mono text-[11px] text-ink-muted"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>

                        <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-accent">
                          <span>Case-Study</span>
                          <ArrowUpRight
                            aria-hidden="true"
                            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </span>
                      </div>
                    </button>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {visibleProjects.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-elevated/60 p-8 text-center">
            <p className="font-mono text-sm text-ink-secondary">
              Keine Projekte in dieser Kategorie gefunden.
            </p>
            <button
              type="button"
              onClick={() => {
                playClick();
                setActiveCategory('all');
              }}
              className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-accent/40 bg-accent-soft px-3.5 py-1.5 font-mono text-xs text-ink transition-colors hover:border-accent"
            >
              Alle Projekte anzeigen
            </button>
          </div>
        ) : null}
      </Container>

      <CaseStudyDrawer project={selectedProject} onClose={closeCaseStudy} />
    </InspectableModule>
  );
}
