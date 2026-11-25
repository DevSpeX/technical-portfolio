'use client';

import {
  Activity,
  ArrowUpRight,
  Clock,
  Code2,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  Radio,
  Star,
  Terminal,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useSoundFX } from '@/features/audio-engine';
import { SpotlightCard, type SpotlightTone } from '@/shared/components';
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion';
import { cn } from '@/shared/lib/cn';
import { SPRINGS, useAccessibleMotion } from '@/shared/lib/motion';
import { Container } from '@/shared/ui/container';
import { StatusPill } from '@/shared/ui/status-pill';
import type { GitHubTelemetryData } from './api/github';
import { getLanguageColor } from './api/github';

export interface GitHubTelemetryBoardProps {
  readonly data: GitHubTelemetryData;
}

type TelemetryView = 'repositories' | 'commits';
type SortMode = 'updated' | 'stars';

function formatRelativeDate(isoDate: string, referenceIso: string): string {
  const timestamp = Date.parse(isoDate);
  const reference = Date.parse(referenceIso);
  if (Number.isNaN(timestamp) || Number.isNaN(reference)) {
    return 'Kürzlich';
  }

  const diffMs = Math.max(0, reference - timestamp);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Vor < 1 Std.';
  if (diffHours < 24) return `Vor ${diffHours} Std.`;
  if (diffDays === 1) return 'Vor 1 Tag';
  if (diffDays < 30) return `Vor ${diffDays} Tagen`;

  const months = Math.floor(diffDays / 30);
  if (months < 12) {
    return months === 1 ? 'Vor 1 Monat' : `Vor ${months} Monaten`;
  }

  return new Intl.DateTimeFormat('de-DE', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
}

function getCardTone(language: string): SpotlightTone {
  if (language === 'Rust' || language === 'Shell' || language === 'JavaScript') {
    return 'amber';
  }
  if (language === 'C#' || language === 'Python') {
    return 'emerald';
  }
  return 'cobalt';
}

/**
 * Interactive client board for the Server-fetched GitHub Telemetry Engine:
 * Segmented View Switcher (`Repositories` vs. `Live Commit Activity`),
 * KPI summary strip, interactive Language-Distribution-Bar, Repo cards,
 * and an Engineering-Changelog Git-Timeline-Terminal.
 */
export function GitHubTelemetryBoard({ data }: GitHubTelemetryBoardProps) {
  const { staggerContainer, fadeUp, viewport } = useAccessibleMotion();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { playClick } = useSoundFX();

  const reposTabId = useId();
  const commitsTabId = useId();
  const reposTabRef = useRef<HTMLButtonElement | null>(null);
  const commitsTabRef = useRef<HTMLButtonElement | null>(null);

  const [activeView, setActiveView] = useState<TelemetryView>('repositories');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [selectedCommitRepo, setSelectedCommitRepo] = useState<string>('all');

  const visibleRepos = useMemo(() => {
    const filtered =
      selectedLanguage === 'all'
        ? data.repositories
        : data.repositories.filter(
            (repo) => repo.language === selectedLanguage,
          );

    return [...filtered].sort((a, b) => {
      if (sortMode === 'stars') {
        return b.stargazersCount - a.stargazersCount;
      }
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
  }, [data.repositories, selectedLanguage, sortMode]);

  const commitRepoNames = useMemo(() => {
    const names = new Set<string>();
    for (const commit of data.recentCommits) {
      names.add(commit.repoName);
    }
    return Array.from(names);
  }, [data.recentCommits]);

  const visibleCommits = useMemo(() => {
    if (selectedCommitRepo === 'all') {
      return data.recentCommits;
    }
    return data.recentCommits.filter(
      (commit) => commit.repoName === selectedCommitRepo,
    );
  }, [data.recentCommits, selectedCommitRepo]);

  const isLive = data.source === 'live';

  const switchView = (nextView: TelemetryView): void => {
    if (nextView === activeView) {
      return;
    }
    playClick();
    setActiveView(nextView);
  };

  const handleTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentView: TelemetryView,
  ): void => {
    let targetView: TelemetryView | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      targetView = currentView === 'repositories' ? 'commits' : 'repositories';
    } else if (event.key === 'Home') {
      targetView = 'repositories';
    } else if (event.key === 'End') {
      targetView = 'commits';
    }

    if (!targetView) {
      return;
    }

    event.preventDefault();
    switchView(targetView);
    if (targetView === 'repositories') {
      reposTabRef.current?.focus();
    } else {
      commitsTabRef.current?.focus();
    }
  };

  return (
    <Container>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        {/* Header Row + Tactile Segmented View Switcher */}
        <motion.div
          variants={fadeUp}
          className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-emerald">
              Live GitHub Telemetry Engine
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Repository-Telemetrie &amp; Live Commit Activity
            </h2>
            {data.fallbackReason ? (
              <p className="mt-2 max-w-2xl font-mono text-xs text-ink-muted">
                {data.fallbackReason}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                label={
                  isLive
                    ? `Live API · @${data.profile.username}`
                    : `Fallback Telemetry · @${data.profile.username}`
                }
                tone={isLive ? 'emerald' : 'amber'}
                icon={<Radio className="h-3.5 w-3.5" />}
              />
              <span className="rounded-full border border-border-subtle bg-elevated px-2.5 py-1 font-mono text-[11px] text-ink-muted">
                ISR · {Math.round(data.revalidateSeconds / 60)}m Cache
              </span>
            </div>

            {/* Tactile Segmented Toggle Switch */}
            <div
              role="tablist"
              aria-label="GitHub Telemetrie Ansicht"
              className="inline-flex rounded-xl border border-border bg-elevated/95 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <button
                ref={reposTabRef}
                id={reposTabId}
                type="button"
                role="tab"
                aria-selected={activeView === 'repositories'}
                tabIndex={activeView === 'repositories' ? 0 : -1}
                onClick={() => switchView('repositories')}
                onKeyDown={(e) => handleTabKeyDown(e, 'repositories')}
                className={cn(
                  'relative inline-flex min-h-9 items-center gap-2 rounded-lg px-3.5 py-1.5 font-mono text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                  activeView === 'repositories'
                    ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:border-b-2 after:border-emerald'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                {activeView === 'repositories' ? (
                  prefersReducedMotion ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-lg border border-emerald/35 bg-surface shadow-sm"
                    />
                  ) : (
                    <motion.span
                      layoutId="github-telemetry-view-pill"
                      transition={SPRINGS.detent}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-lg border border-emerald/35 bg-surface shadow-sm"
                    />
                  )
                ) : null}
                <FolderGit2
                  aria-hidden="true"
                  className={cn(
                    'relative z-10 h-3.5 w-3.5',
                    activeView === 'repositories'
                      ? 'text-emerald'
                      : 'text-ink-muted',
                  )}
                />
                <span className="relative z-10">Repositories</span>
                <span className="relative z-10 rounded bg-elevated px-1.5 py-0.5 text-[10px] text-ink-muted">
                  {data.repositories.length}
                </span>
              </button>

              <button
                ref={commitsTabRef}
                id={commitsTabId}
                type="button"
                role="tab"
                aria-selected={activeView === 'commits'}
                tabIndex={activeView === 'commits' ? 0 : -1}
                onClick={() => switchView('commits')}
                onKeyDown={(e) => handleTabKeyDown(e, 'commits')}
                className={cn(
                  'relative inline-flex min-h-9 items-center gap-2 rounded-lg px-3.5 py-1.5 font-mono text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                  activeView === 'commits'
                    ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:border-b-2 after:border-emerald'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                {activeView === 'commits' ? (
                  prefersReducedMotion ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-lg border border-emerald/35 bg-surface shadow-sm"
                    />
                  ) : (
                    <motion.span
                      layoutId="github-telemetry-view-pill"
                      transition={SPRINGS.detent}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-lg border border-emerald/35 bg-surface shadow-sm"
                    />
                  )
                ) : null}
                <GitCommitHorizontal
                  aria-hidden="true"
                  className={cn(
                    'relative z-10 h-3.5 w-3.5',
                    activeView === 'commits'
                      ? 'text-emerald'
                      : 'text-ink-muted',
                  )}
                />
                <span className="relative z-10">Live Commit Activity</span>
                <span className="relative z-10 rounded bg-elevated px-1.5 py-0.5 text-[10px] text-ink-muted">
                  {data.recentCommits.length}
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab 1 Panel: Repositories & Language Telemetry */}
        <div
          role="tabpanel"
          aria-labelledby={reposTabId}
          hidden={activeView !== 'repositories'}
        >
          <div>
            {/* Profile Metrics & Language Distribution Bar */}
            <motion.div variants={fadeUp} className="mb-7">
              <SpotlightCard tone="emerald" spotlightSize={460}>
                <div className="p-5 sm:p-6">
                  <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                    {/* KPI Metrics */}
                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:col-span-6">
                      <div className="rounded-lg border border-border-subtle bg-surface/80 p-3">
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                          Public Repos
                        </dt>
                        <dd className="mt-1 font-mono text-xl font-semibold text-ink">
                          {data.profile.publicRepos}
                        </dd>
                      </div>
                      <div className="rounded-lg border border-border-subtle bg-surface/80 p-3">
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                          Stars (Total)
                        </dt>
                        <dd className="mt-1 font-mono text-xl font-semibold text-amber">
                          {data.profile.totalStars}
                        </dd>
                      </div>
                      <div className="rounded-lg border border-border-subtle bg-surface/80 p-3">
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                          Forks
                        </dt>
                        <dd className="mt-1 font-mono text-xl font-semibold text-accent">
                          {data.profile.totalForks}
                        </dd>
                      </div>
                      <div className="rounded-lg border border-border-subtle bg-surface/80 p-3">
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                          Sprachen
                        </dt>
                        <dd className="mt-1 font-mono text-xl font-semibold text-emerald">
                          {data.languageDistribution.length}
                        </dd>
                      </div>
                    </dl>

                    {/* Language Distribution Bar */}
                    <div className="lg:col-span-6">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-secondary">
                          <Code2
                            aria-hidden="true"
                            className="h-3.5 w-3.5 text-emerald"
                          />
                          <span>Language Distribution</span>
                        </span>
                        <span className="font-mono text-[11px] text-ink-muted">
                          Klick filtert Repositories
                        </span>
                      </div>

                      {/* Segmented Bar */}
                      <div
                        role="group"
                        aria-label="Sprachverteilung der Repositories"
                        className="flex h-3 w-full overflow-hidden rounded-full border border-border-subtle bg-surface p-0.5"
                      >
                        {data.languageDistribution.map((stat) => {
                          const isSelected =
                            selectedLanguage === 'all' ||
                            selectedLanguage === stat.language;
                          return (
                            <button
                              key={stat.language}
                              type="button"
                              onClick={() => {
                                playClick();
                                setSelectedLanguage((prev) =>
                                  prev === stat.language
                                    ? 'all'
                                    : stat.language,
                                );
                              }}
                              aria-label={`${stat.language}: ${stat.percentage}%`}
                              aria-pressed={selectedLanguage === stat.language}
                              style={{
                                width: `${stat.percentage}%`,
                                backgroundColor: stat.color,
                              }}
                              className={cn(
                                'h-full first:rounded-l-full last:rounded-r-full transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                                isSelected
                                  ? 'opacity-95'
                                  : 'opacity-25 hover:opacity-60',
                              )}
                            />
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                        {data.languageDistribution.map((stat) => {
                          const isCurrent = selectedLanguage === stat.language;
                          return (
                            <button
                              key={stat.language}
                              type="button"
                              onClick={() => {
                                playClick();
                                setSelectedLanguage((prev) =>
                                  prev === stat.language
                                    ? 'all'
                                    : stat.language,
                                );
                              }}
                              aria-pressed={isCurrent}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[11px] transition-colors',
                                isCurrent
                                  ? 'bg-surface text-ink ring-1 ring-border-strong'
                                  : 'text-ink-secondary hover:text-ink',
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: stat.color }}
                              />
                              <span>{stat.language}</span>
                              <span className="text-ink-muted">
                                {stat.percentage}%
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Filter & Sort Controls */}
            <motion.div
              variants={fadeUp}
              className="mb-6 flex flex-wrap items-center justify-between gap-3"
            >
              <div
                role="group"
                aria-label="Repositories nach Programmiersprache filtern"
                className="flex flex-wrap gap-2"
              >
                <button
                  type="button"
                  aria-pressed={selectedLanguage === 'all'}
                  onClick={() => {
                    playClick();
                    setSelectedLanguage('all');
                  }}
                  className={cn(
                    'inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors',
                    selectedLanguage === 'all'
                      ? 'border-emerald/50 bg-emerald-soft text-ink'
                      : 'border-border-subtle bg-elevated text-ink-secondary hover:border-border hover:text-ink',
                  )}
                >
                  <span>Alle</span>
                  <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-ink-muted">
                    {data.repositories.length}
                  </span>
                </button>

                {data.languageDistribution.map((stat) => {
                  const isSelected = selectedLanguage === stat.language;
                  return (
                    <button
                      key={stat.language}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        playClick();
                        setSelectedLanguage(stat.language);
                      }}
                      className={cn(
                        'inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors',
                        isSelected
                          ? 'border-emerald/50 bg-emerald-soft text-ink'
                          : 'border-border-subtle bg-elevated text-ink-secondary hover:border-border hover:text-ink',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: stat.color }}
                      />
                      <span>{stat.language}</span>
                      <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-ink-muted">
                        {stat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                role="group"
                aria-label="Sortierung"
                className="inline-flex items-center rounded-lg border border-border-subtle bg-elevated p-0.5 font-mono text-[11px]"
              >
                <button
                  type="button"
                  aria-pressed={sortMode === 'updated'}
                  onClick={() => {
                    playClick();
                    setSortMode('updated');
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-1 transition-colors',
                    sortMode === 'updated'
                      ? 'bg-surface text-ink'
                      : 'text-ink-muted hover:text-ink',
                  )}
                >
                  Zuletzt aktiv
                </button>
                <button
                  type="button"
                  aria-pressed={sortMode === 'stars'}
                  onClick={() => {
                    playClick();
                    setSortMode('stars');
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-1 transition-colors',
                    sortMode === 'stars'
                      ? 'bg-surface text-ink'
                      : 'text-ink-muted hover:text-ink',
                  )}
                >
                  Meiste Stars
                </button>
              </div>
            </motion.div>

            {/* Repository Engineering Cards */}
            <div
              className={cn(
                'grid gap-4',
                visibleRepos.length <= 2
                  ? 'md:grid-cols-2'
                  : 'md:grid-cols-2 lg:grid-cols-3',
              )}
            >
              {visibleRepos.map((repo) => {
                const langColor = getLanguageColor(repo.language);
                return (
                  <motion.div
                    key={repo.id}
                    variants={fadeUp}
                    className="h-full"
                  >
                    <SpotlightCard
                      as="article"
                      tone={getCardTone(repo.language)}
                      spotlightSize={320}
                      className="h-full"
                    >
                      <div className="flex h-full flex-col justify-between p-5">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate font-mono text-sm font-semibold text-ink">
                                  {repo.name}
                                </h3>
                                {repo.isFork ? (
                                  <span className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                                    Fork
                                  </span>
                                ) : null}
                                {repo.isArchived ? (
                                  <span className="rounded border border-amber/35 bg-amber-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber">
                                    Archived
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-0.5 truncate font-mono text-[10px] text-ink-muted">
                                {repo.fullName}
                              </p>
                            </div>

                            {repo.isPlaceholderLink ? (
                              <span
                                title="Fallback-Link — prüfe GitHub-API-Erreichbarkeit"
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface text-ink-muted"
                              >
                                <Activity
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5"
                                />
                              </span>
                            ) : (
                              <a
                                href={repo.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${repo.name} auf GitHub öffnen`}
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
                              >
                                <ArrowUpRight
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5"
                                />
                              </a>
                            )}
                          </div>

                          <p className="mt-3 text-xs leading-relaxed text-ink-secondary">
                            {repo.description}
                          </p>

                          {/* Architecture Tags */}
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {repo.architectureTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md border border-border-subtle bg-surface px-2 py-0.5 font-mono text-[10px] text-ink-muted"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Telemetry Footer */}
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 font-mono text-[11px] text-ink-muted">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 text-ink-secondary">
                              <span
                                aria-hidden="true"
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: langColor }}
                              />
                              <span>{repo.language}</span>
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <Star
                                aria-hidden="true"
                                className="h-3 w-3 text-amber"
                              />
                              <span className="sr-only">Stars: </span>
                              <span>{repo.stargazersCount}</span>
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <GitFork aria-hidden="true" className="h-3 w-3" />
                              <span className="sr-only">Forks: </span>
                              <span>{repo.forksCount}</span>
                            </span>

                            <span className="inline-flex items-center gap-1 text-[10px]">
                              <GitBranch
                                aria-hidden="true"
                                className="h-3 w-3 text-accent"
                              />
                              <span>{repo.defaultBranch}</span>
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-[10px]">
                            <Clock aria-hidden="true" className="h-3 w-3" />
                            <time dateTime={repo.updatedAt}>
                              {formatRelativeDate(
                                repo.updatedAt,
                                data.fetchedAt,
                              )}
                            </time>
                          </span>
                        </div>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab 2 Panel: Engineering Changelog / Git-Timeline-Terminal */}
        <div
          role="tabpanel"
          aria-labelledby={commitsTabId}
          hidden={activeView !== 'commits'}
        >
          <div>
            <SpotlightCard tone="emerald" spotlightSize={520}>
              {/* Terminal Top Chrome */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface/90 px-4 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    aria-hidden="true"
                    className="hidden items-center gap-1.5 sm:flex"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                    <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald/75" />
                  </div>
                  <Terminal
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-emerald"
                  />
                  <code className="truncate font-mono text-xs text-ink-secondary">
                    git log --graph --oneline --author=@{data.profile.username}
                  </code>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {data.commitsEnriched ? (
                    <span className="rounded-full border border-emerald/35 bg-emerald-soft px-2.5 py-0.5 font-mono text-[10px] text-emerald">
                      Verified Commit Stream
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber/35 bg-amber-soft px-2.5 py-0.5 font-mono text-[10px] text-amber">
                      Cached Commit Log
                    </span>
                  )}
                  <a
                    href={data.profile.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-elevated px-2.5 py-1 font-mono text-[10px] text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
                  >
                    <span>@{data.profile.username}</span>
                    <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Repo Filter Bar inside Terminal */}
              {commitRepoNames.length > 1 ? (
                <div
                  role="group"
                  aria-label="Commits nach Repository filtern"
                  className="flex flex-wrap items-center gap-2 border-b border-border-subtle/70 bg-surface/45 px-4 py-2.5 sm:px-6"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Scope:
                  </span>
                  <button
                    type="button"
                    aria-pressed={selectedCommitRepo === 'all'}
                    onClick={() => {
                      playClick();
                      setSelectedCommitRepo('all');
                    }}
                    className={cn(
                      'rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors',
                      selectedCommitRepo === 'all'
                        ? 'border-emerald/50 bg-emerald-soft text-ink'
                        : 'border-border-subtle bg-elevated text-ink-secondary hover:border-border hover:text-ink',
                    )}
                  >
                    Alle ({data.recentCommits.length})
                  </button>
                  {commitRepoNames.map((repoName) => {
                    const count = data.recentCommits.filter(
                      (c) => c.repoName === repoName,
                    ).length;
                    const shortName = repoName.split('/').pop() ?? repoName;
                    const isSelected = selectedCommitRepo === repoName;

                    return (
                      <button
                        key={repoName}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          playClick();
                          setSelectedCommitRepo(repoName);
                        }}
                        className={cn(
                          'rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors',
                          isSelected
                            ? 'border-emerald/50 bg-emerald-soft text-ink'
                            : 'border-border-subtle bg-elevated text-ink-secondary hover:border-border hover:text-ink',
                        )}
                      >
                        {shortName} ({count})
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {/* Git Timeline Stream */}
              <div className="p-4 sm:p-6">
                {visibleCommits.length === 0 ? (
                  <p className="rounded-xl border border-border-subtle bg-surface/70 p-4 font-mono text-xs text-ink-muted">
                    Aktuell keine öffentlichen Commit-Einträge für diesen Filter
                    vorhanden.
                  </p>
                ) : (
                  <ol className="relative ml-2 space-y-3 border-l border-border-subtle pl-5 sm:pl-6">
                    {visibleCommits.map((commit, idx) => (
                      <li
                        key={commit.id}
                        className="group relative rounded-xl border border-border-subtle bg-surface/75 p-3.5 transition-colors hover:border-border-strong hover:bg-surface sm:p-4"
                      >
                        {/* Timeline Commit Node Dot */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute -left-[25px] top-5 h-2.5 w-2.5 rounded-full border-2 border-elevated sm:-left-[29px]',
                            idx === 0
                              ? 'bg-emerald shadow-[0_0_10px_var(--accent-emerald)]'
                              : 'bg-border-strong group-hover:bg-accent',
                          )}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            {/* Commit Hash Badge */}
                            <code className="rounded-md border border-emerald/40 bg-emerald-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald">
                              {commit.shortSha}
                            </code>

                            {/* Repo Name */}
                            <span className="truncate font-mono text-xs font-medium text-ink">
                              {commit.repoName}
                            </span>

                            {/* Branch Badge */}
                            <span className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-elevated px-2 py-0.5 font-mono text-[10px] text-accent">
                              <GitBranch
                                aria-hidden="true"
                                className="h-3 w-3"
                              />
                              <span>{commit.branch}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-muted">
                              <Clock aria-hidden="true" className="h-3 w-3" />
                              <time dateTime={commit.timestamp}>
                                {formatRelativeDate(
                                  commit.timestamp,
                                  data.fetchedAt,
                                )}
                              </time>
                            </span>

                            {commit.isPlaceholderLink ? null : (
                              <a
                                href={commit.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Commit ${commit.shortSha} in ${commit.repoName} auf GitHub ansehen`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-elevated text-ink-secondary transition-colors hover:border-emerald/50 hover:text-emerald"
                              >
                                <ArrowUpRight
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5"
                                />
                              </a>
                            )}
                          </div>
                        </div>

                        <p className="mt-2.5 text-sm font-medium leading-snug text-ink">
                          {commit.message}
                        </p>

                        <p className="mt-1.5 font-mono text-[11px] text-ink-muted">
                          author: {commit.authorName} · sha: {commit.shortSha}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </SpotlightCard>
          </div>
        </div>
      </motion.div>
    </Container>
  );
}
