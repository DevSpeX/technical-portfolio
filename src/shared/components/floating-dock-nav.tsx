'use client';

import { Command, ScanEye } from 'lucide-react';
import { motion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import type { NavSectionId, SiteConfig } from '@/config';
import { useSoundFX } from '@/features/audio-engine';
import { useCommandPalette } from '@/features/command-palette';
import { useInspector } from '@/features/inspector';
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion';
import { cn } from '@/shared/lib/cn';
import { SPRINGS } from '@/shared/lib/motion';
import { useSmoothScroll } from '@/shared/providers/smooth-scroll-provider';

export interface FloatingDockNavProps {
  readonly site: SiteConfig;
  readonly className?: string;
}

const emptySubscribe = (): (() => void) => () => {};

function useShortcutLabel(): string {
  return useSyncExternalStore(
    emptySubscribe,
    () =>
      typeof navigator !== 'undefined' &&
      /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
        ? '⌘K'
        : 'Ctrl K',
    () => '⌘K',
  );
}

function EqualizerIcon({ active }: { readonly active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-3.5 w-3.5 items-end justify-center gap-[2px] pb-[1px]"
    >
      <span
        className={cn(
          'w-[2px] rounded-full transition-colors',
          active
            ? 'audio-eq-bar audio-eq-bar-1 h-2.5 bg-emerald'
            : 'h-1 bg-ink-muted/65',
        )}
      />
      <span
        className={cn(
          'w-[2px] rounded-full transition-colors',
          active
            ? 'audio-eq-bar audio-eq-bar-2 h-3 bg-accent'
            : 'h-1.5 bg-ink-muted/65',
        )}
      />
      <span
        className={cn(
          'w-[2px] rounded-full transition-colors',
          active
            ? 'audio-eq-bar audio-eq-bar-3 h-2 bg-emerald'
            : 'h-1 bg-ink-muted/65',
        )}
      />
    </span>
  );
}

/**
 * Glassmorphic top floating dock navigation featuring a scroll-spy pill
 * indicator, procedural Sound FX toggle, Architecture X-Ray toggle (`Alt+I`),
 * and `Cmd/Ctrl+K` trigger.
 */
export function FloatingDockNav({ site, className }: FloatingDockNavProps) {
  const { isOpen: isPaletteOpen, open: openPalette } = useCommandPalette();
  const { isActive: isInspectorActive, toggle: toggleInspector } =
    useInspector();
  const { isMuted, toggleMute, playHover, playClick } = useSoundFX();
  const { scrollTo } = useSmoothScroll();
  const prefersReducedMotion = usePrefersReducedMotion();
  const shortcutLabel = useShortcutLabel();

  const firstNavId: NavSectionId = site.navigation[0]?.id ?? 'hero';
  const [activeSection, setActiveSection] = useState<NavSectionId>(firstNavId);
  const navRef = useRef<HTMLElement | null>(null);

  // Cross-browser scrollspy combining IntersectionObserver + native :target-current sync
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const sectionIds = site.navigation.map((item) => item.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) {
      return;
    }

    const visibleRatios = new Map<NavSectionId, number>();

    const pickActiveSection = (): void => {
      // Near bottom of document, highlight the final section so footer contact is reachable.
      const scrolledBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 48;
      const lastId = sectionIds[sectionIds.length - 1];
      if (scrolledBottom && lastId) {
        setActiveSection(lastId);
        return;
      }

      let bestId: NavSectionId | null = null;
      let bestRatio = 0;

      for (const id of sectionIds) {
        const ratio = visibleRatios.get(id) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }

      if (bestId) {
        setActiveSection(bestId);
        return;
      }

      // Fallback when scrolling quickly between tall sections
      const probeY = 140;
      let fallbackId: NavSectionId = firstNavId;
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= probeY) {
          fallbackId = el.id as NavSectionId;
        }
      }
      setActiveSection(fallbackId);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as NavSectionId;
          visibleRatios.set(
            id,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        }
        pickActiveSection();
      },
      {
        rootMargin: '-22% 0px -55% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    const supportsScrollTargetGroup =
      typeof CSS !== 'undefined' &&
      CSS.supports('scroll-target-group: auto');

    const handleScrollEnd = (): void => {
      if (supportsScrollTargetGroup && navRef.current) {
        const nativeCurrent = navRef.current.querySelector(
          'a:target-current',
        ) as HTMLAnchorElement | null;
        const hashId = nativeCurrent?.getAttribute('href')?.replace('#', '');
        if (
          hashId &&
          sectionIds.includes(hashId as NavSectionId)
        ) {
          setActiveSection(hashId as NavSectionId);
          return;
        }
      }
      pickActiveSection();
    };

    window.addEventListener('scrollend', handleScrollEnd, { passive: true });
    window.addEventListener('scroll', pickActiveSection, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scrollend', handleScrollEnd);
      window.removeEventListener('scroll', pickActiveSection);
    };
  }, [site.navigation, firstNavId]);

  const handleNavClick = useCallback(
    (
      event: ReactMouseEvent<HTMLAnchorElement>,
      id: NavSectionId,
      href: `#${NavSectionId}`,
    ) => {
      event.preventDefault();
      playClick();
      setActiveSection(id);
      scrollTo(href, { offset: -96 });

      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', href);
        const target = document.getElementById(id);
        target?.focus({ preventScroll: true });
      }
    },
    [playClick, scrollTo],
  );

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-3 sm:top-4 sm:px-6',
        className,
      )}
    >
      <header className="pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-2 rounded-2xl border border-border/90 bg-elevated/82 px-2.5 py-1.5 shadow-[0_16px_44px_-16px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:gap-4 sm:px-3.5">
        {/* Brand monogram */}
        <a
          href="#hero"
          aria-label={`${site.owner.name} — Zur Startseite`}
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') {
              playHover();
            }
          }}
          onClick={(event) => handleNavClick(event, 'hero', '#hero')}
          className="inline-flex min-h-9 shrink-0 items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-surface/80"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface font-mono text-xs font-semibold text-accent">
            F/
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-xs font-semibold tracking-tight text-ink">
              {site.owner.name}
            </span>
            <span className="mt-0.5 font-mono text-[10px] text-ink-muted">
              @{site.owner.handle}
            </span>
          </span>
        </a>

        {/* Scroll-spy section links */}
        <nav
          ref={navRef}
          aria-label="Sektionen"
          className="dock-nav-links hidden items-center gap-1 md:flex"
        >
          {site.navigation.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'true' : undefined}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') {
                    playHover();
                  }
                }}
                onClick={(event) => handleNavClick(event, item.id, item.href)}
                className={cn(
                  'dock-nav-link relative inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'font-semibold text-ink'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="floating-dock-active-pill"
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.08 }
                        : SPRINGS.taut
                    }
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 rounded-xl border border-border-strong/70 bg-surface/95 shadow-sm"
                  />
                ) : null}

                <span
                  aria-hidden="true"
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    isActive ? 'bg-accent' : 'bg-border-strong/60',
                  )}
                />
                <span className="font-mono text-[10px] text-ink-muted">
                  {item.shortcut}
                </span>
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right utility cluster: Audio toggle + X-Ray toggle + Cmd/Ctrl+K Command Palette */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMute}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') {
                playHover();
              }
            }}
            aria-pressed={!isMuted}
            aria-label={
              isMuted
                ? 'Tactile UI-Audio aktivieren'
                : 'Tactile UI-Audio stummschalten'
            }
            title={isMuted ? 'UI-Audio: Aus' : 'UI-Audio: Aktiv'}
            className={cn(
              'inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 font-mono text-[11px] transition-colors',
              !isMuted
                ? 'border-emerald/45 bg-emerald-soft text-ink'
                : 'border-border-subtle bg-surface/80 text-ink-muted hover:border-border hover:text-ink',
            )}
          >
            <EqualizerIcon active={!isMuted} />
            <span className="sr-only">
              {isMuted ? 'Audio stumm' : 'Audio aktiv'}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleInspector}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') {
                playHover();
              }
            }}
            aria-pressed={isInspectorActive}
            aria-label="Architecture X-Ray umschalten (Alt+I)"
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 font-mono text-[11px] transition-colors',
              isInspectorActive
                ? 'border-accent/60 bg-accent-soft text-ink shadow-[0_0_20px_-6px_var(--accent-primary)]'
                : 'border-border-subtle bg-surface/80 text-ink-secondary hover:border-border hover:text-ink',
            )}
          >
            <ScanEye
              aria-hidden="true"
              className={cn(
                'h-3.5 w-3.5',
                isInspectorActive ? 'text-accent' : 'text-ink-muted',
              )}
            />
            <span className="hidden sm:inline">X-Ray</span>
            <span
              aria-hidden="true"
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isInspectorActive ? 'bg-emerald' : 'bg-border-strong',
              )}
            />
          </button>

          <button
            type="button"
            onClick={openPalette}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') {
                playHover();
              }
            }}
            aria-haspopup="dialog"
            aria-expanded={isPaletteOpen}
            aria-label="Command Palette öffnen"
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border bg-surface/90 px-2.5 py-1.5 text-xs text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
          >
            <Command aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
            <span className="hidden text-xs font-medium lg:inline">
              Command
            </span>
            <kbd className="rounded-md border border-border-subtle bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
              {shortcutLabel}
            </kbd>
          </button>
        </div>
      </header>
    </div>
  );
}
