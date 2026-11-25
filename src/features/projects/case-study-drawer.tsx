'use client';

import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import type { ProjectItem } from '@/config';
import { useSoundFX } from '@/features/audio-engine';
import { MagneticButton } from '@/shared/components';
import { StatusPill, type StatusTone } from '@/shared/ui/status-pill';

export interface CaseStudyDrawerProps {
  readonly project: ProjectItem | null;
  readonly onClose: () => void;
}

const emptySubscribe = (): (() => void) => () => {};

function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

let cachedDisplayTransitionSupport: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (cachedDisplayTransitionSupport !== undefined) {
    return cachedDisplayTransitionSupport;
  }
  if (
    typeof window === 'undefined' ||
    !window.CSS?.supports?.('transition-behavior', 'allow-discrete') ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText =
    'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  const initialDisplay = window.getComputedStyle(probe).display;
  probe.style.display = 'none';
  cachedDisplayTransitionSupport =
    initialDisplay === 'block' &&
    window.getComputedStyle(probe).display === 'block';
  probe.remove();
  return cachedDisplayTransitionSupport;
}

function supportsTopLayerExit(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.CSS?.supports?.('overlay', 'auto')) &&
    canTransitionDisplay()
  );
}

function isPlaceholderUrl(url: string | undefined): boolean {
  if (!url) {
    return true;
  }
  return /example\.invalid|PLACEHOLDER_/i.test(url);
}

function getCategoryTone(category: ProjectItem['category']): StatusTone {
  switch (category) {
    case 'fullstack-ai':
      return 'cobalt';
    case 'linux-oss':
      return 'emerald';
    case 'gamedev-interactive':
      return 'amber';
  }
}

function getCategoryLabel(category: ProjectItem['category']): string {
  switch (category) {
    case 'fullstack-ai':
      return 'Full-Stack & AI';
    case 'linux-oss':
      return 'Systems & Open Source';
    case 'gamedev-interactive':
      return 'Game Dev';
  }
}

/**
 * Accessible Case-Study Drawer backed by a native modal `<dialog>` in the
 * browser top layer, with `closedby="any"` light-dismiss + Safari fallback,
 * `overscroll-behavior: contain`, and smooth `@starting-style` / `data-closing`
 * exit transitions.
 */
export function CaseStudyDrawer({ project, onClose }: CaseStudyDrawerProps) {
  const isClient = useIsClient();
  const { playCommandOpen, playCommandClose } = useSoundFX();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isClosingRef = useRef(false);
  const prevProjectSlugRef = useRef<string | null>(null);
  const titleId = useId();

  const animateAndClose = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open || isClosingRef.current) {
      return;
    }

    if (!supportsTopLayerExit()) {
      isClosingRef.current = true;
      dialog.setAttribute('data-closing', '');
      const animations = dialog.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((animation) => animation.finished)),
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, 400);
          }),
        ]);
      }
      isClosingRef.current = false;
      if (!dialog.hasAttribute('data-closing')) {
        return;
      }
      dialog.removeAttribute('data-closing');
    }

    if (dialog.open) {
      dialog.close();
    }
  }, []);

  // Sync dialog open/closed state with `project` prop & trigger open/close audio sweep
  useEffect(() => {
    const nextSlug = project?.slug ?? null;
    const prevSlug = prevProjectSlugRef.current;

    if (prevSlug === null && nextSlug !== null) {
      playCommandOpen();
    } else if (prevSlug !== null && nextSlug === null) {
      playCommandClose();
    }
    prevProjectSlugRef.current = nextSlug;

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (project) {
      dialog.removeAttribute('data-closing');
      isClosingRef.current = false;

      if (!dialog.open) {
        dialog.showModal();
      }

      window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    } else if (dialog.open) {
      void animateAndClose();
    }
  }, [project, animateAndClose, playCommandOpen, playCommandClose]);

  // Fallback light-dismiss for browsers without HTMLDialogElement `closedby="any"` (Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) {
      return;
    }

    const handleBackdropClick = (event: MouseEvent): void => {
      if (event.target !== dialog) {
        return;
      }

      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (isDialogContent) {
        return;
      }

      void animateAndClose();
    };

    dialog.addEventListener('click', handleBackdropClick);
    return () => {
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [isClient, animateAndClose]);

  if (!isClient) {
    return null;
  }

  const closedByProps: Record<string, string> = { closedby: 'any' };
  const liveUrl = project?.links.live;
  const repoUrl = project?.links.repository;
  const docsUrl = project?.links.documentation;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        if (!supportsTopLayerExit()) {
          event.preventDefault();
          void animateAndClose();
        }
      }}
      onClose={() => {
        onClose();
      }}
      className="case-study-drawer"
      {...closedByProps}
    >
      {project ? (
        <div className="flex h-full w-full flex-col border-l border-border bg-elevated/98 text-ink shadow-[-24px_0_80px_-16px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {/* Sticky Drawer Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  label={getCategoryLabel(project.category)}
                  tone={getCategoryTone(project.category)}
                />
                <StatusPill label={project.status} tone="neutral" />
                <span className="font-mono text-[11px] text-ink-muted">
                  {project.year}
                </span>
              </div>

              <h1
                id={titleId}
                className="mt-3 text-xl font-semibold tracking-tight text-ink sm:text-2xl"
              >
                {project.title}
              </h1>
              <p className="mt-1 font-mono text-xs text-ink-muted">
                {project.role} · #{project.slug}
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => void animateAndClose()}
              aria-label="Case-Study schließen"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div
            data-lenis-prevent
            className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6"
          >
            {/* Tagline & Summary */}
            <div>
              <p className="text-sm font-medium text-ink">{project.tagline}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                {project.description}
              </p>
            </div>

            {/* Key Metrics Strip */}
            <dl className="grid grid-cols-2 gap-3">
              {project.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-border-subtle bg-surface/80 p-3.5"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    {metric.label}
                  </dt>
                  <dd className="mt-1 font-mono text-base font-semibold text-accent">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* 1. Problemstellung */}
            <section aria-label="Problemstellung">
              <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber">
                <AlertCircle aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Problemstellung</span>
              </h3>
              <p className="mt-2 rounded-xl border border-border-subtle bg-surface/60 p-4 text-sm leading-relaxed text-ink-secondary">
                {project.problemStatement}
              </p>
            </section>

            {/* 2. Gewählte Architektur */}
            <section aria-label="Gewählte Architektur">
              <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent">
                <Layers aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Gewählte Architektur</span>
              </h3>
              <div className="mt-2.5 space-y-2.5">
                {project.architecture.map((arch) => (
                  <div
                    key={arch.layer}
                    className="rounded-xl border border-border-subtle bg-surface/80 p-4"
                  >
                    <p className="font-mono text-xs font-semibold text-ink">
                      {arch.layer}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
                      {arch.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Engineering Highlights */}
            <section aria-label="Technische Highlights">
              <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-emerald">
                <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Engineering Highlights</span>
              </h3>
              <ul className="mt-2.5 space-y-2">
                {project.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-secondary"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 3. Key-Learnings */}
            <section aria-label="Key-Learnings">
              <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink-secondary">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
                <span>Key-Learnings</span>
              </h3>
              <ul className="mt-2.5 space-y-2">
                {project.keyLearnings.map((learning) => (
                  <li
                    key={learning}
                    className="rounded-xl border border-border-subtle bg-surface/50 px-4 py-3 text-xs leading-relaxed text-ink-secondary"
                  >
                    {learning}
                  </li>
                ))}
              </ul>
            </section>

            {/* 4. Tech-Stack */}
            <section aria-label="Tech-Stack">
              <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink-muted">
                <Cpu aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Tech-Stack</span>
              </h3>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-lg border border-border bg-surface px-2.5 py-1 font-mono text-xs text-ink-secondary"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky Action Footer (Live-Demo & Source-Code) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-surface/85 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2.5">
              {liveUrl ? (
                <MagneticButton
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  size="sm"
                >
                  <span>
                    {isPlaceholderUrl(liveUrl)
                      ? 'Live-Demo (Preview URL)'
                      : 'Live-Demo öffnen'}
                  </span>
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </MagneticButton>
              ) : null}

              {repoUrl ? (
                <MagneticButton
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  size="sm"
                >
                  <Code2 aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
                  <span>
                    {isPlaceholderUrl(repoUrl)
                      ? 'Source-Code (Repo)'
                      : 'Source-Code'}
                  </span>
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </MagneticButton>
              ) : null}

              {docsUrl ? (
                <MagneticButton
                  href={docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  size="sm"
                >
                  <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>Docs</span>
                </MagneticButton>
              ) : null}
            </div>

            <span className="font-mono text-[10px] text-ink-muted">
              Esc zum Schließen
            </span>
          </div>
        </div>
      ) : null}
    </dialog>,
    document.body,
  );
}
