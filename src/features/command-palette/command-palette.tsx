'use client';

import {
  Check,
  Compass,
  ExternalLink,
  Filter,
  Layers,
  Mail,
  ScanEye,
  Search,
  Volume2,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CompositionEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { PROJECTS, SITE_CONFIG } from '@/config';
import { useSoundFX } from '@/features/audio-engine';
import { useInspector } from '@/features/inspector';
import { cn } from '@/shared/lib/cn';
import { usePortfolioFilter } from '@/shared/providers/portfolio-filter-provider';
import { useSmoothScroll } from '@/shared/providers/smooth-scroll-provider';
import { useToast } from '@/shared/providers/toast-provider';
import { useCommandPalette } from './command-palette-context';
import {
  COMMAND_GROUP_LABELS,
  COMMAND_GROUP_ORDER,
  buildCommands,
  filterCommands,
  type CommandGroup,
  type CommandIconName,
  type CommandItem,
} from './command-registry';

const emptySubscribe = (): (() => void) => () => {};

function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function CommandIcon({
  name,
  isSelected,
}: {
  readonly name: CommandIconName;
  readonly isSelected?: boolean;
}) {
  const iconClass = cn(
    'h-4 w-4 shrink-0',
    isSelected ? 'text-accent' : 'text-ink-muted',
  );

  switch (name) {
    case 'compass':
      return <Compass aria-hidden="true" className={iconClass} />;
    case 'scan':
      return <ScanEye aria-hidden="true" className={iconClass} />;
    case 'audio':
      return <Volume2 aria-hidden="true" className={iconClass} />;
    case 'filter':
      return <Filter aria-hidden="true" className={iconClass} />;
    case 'layers':
      return <Layers aria-hidden="true" className={iconClass} />;
    case 'mail':
      return <Mail aria-hidden="true" className={iconClass} />;
    case 'github':
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconClass}
        >
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconClass}
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
        </svg>
      );
    case 'external':
      return <ExternalLink aria-hidden="true" className={iconClass} />;
  }
}

function isOutsideDialogBounds(
  clientX: number,
  clientY: number,
  dialog: HTMLDialogElement,
): boolean {
  const rect = dialog.getBoundingClientRect();
  return (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  );
}

/**
 * Accessible global Command Palette rendered in a React Portal backed by a
 * native modal `<dialog>`, keyboard focus trap, and IME-safe Enter handling.
 */
export function CommandPalette() {
  const isClient = useIsClient();
  const { isOpen, close } = useCommandPalette();
  const { isActive: isInspectorActive, toggle: toggleInspector } =
    useInspector();
  const {
    isMuted: isAudioMuted,
    toggleMute: toggleAudioMute,
    playHover,
    playClick,
    playCommandOpen,
    playCommandClose,
  } = useSoundFX();
  const { activeCategory, setActiveCategory } = usePortfolioFilter();
  const { scrollTo } = useSmoothScroll();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const lastCompositionEndAtRef = useRef<number | null>(null);
  const prevIsOpenRef = useRef(false);

  const titleId = useId();
  const inputId = useId();
  const listboxId = useId();

  const navigateToSection = useCallback(
    (href: string) => {
      scrollTo(href, { offset: -96 });

      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', href);
        const target = document.querySelector(href);
        if (target instanceof HTMLElement) {
          target.focus({ preventScroll: true });
        }
      }
    },
    [scrollTo],
  );

  const allCommands = useMemo(
    () =>
      buildCommands({
        site: SITE_CONFIG,
        projects: PROJECTS,
        isInspectorActive,
        toggleInspector,
        isAudioMuted,
        toggleAudioMute,
        activeCategory,
        setActiveCategory,
        navigateToSection,
        showToast: toast,
      }),
    [
      isInspectorActive,
      toggleInspector,
      isAudioMuted,
      toggleAudioMute,
      activeCategory,
      setActiveCategory,
      navigateToSection,
      toast,
    ],
  );

  const filteredCommands = useMemo(
    () => filterCommands(allCommands, query),
    [allCommands, query],
  );

  const groupedCommands = useMemo(() => {
    const groups = new Map<CommandGroup, CommandItem[]>();

    for (const item of filteredCommands) {
      const existing = groups.get(item.group);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(item.group, [item]);
      }
    }

    return COMMAND_GROUP_ORDER.flatMap((groupKey) => {
      const items = groups.get(groupKey);
      return items && items.length > 0
        ? [{ group: groupKey, label: COMMAND_GROUP_LABELS[groupKey], items }]
        : [];
    });
  }, [filteredCommands]);

  const flatCommands = useMemo(
    () => groupedCommands.flatMap((section) => section.items),
    [groupedCommands],
  );

  const safeActiveIndex =
    flatCommands.length === 0
      ? -1
      : Math.min(Math.max(activeIndex, 0), flatCommands.length - 1);

  const activeCommand =
    safeActiveIndex >= 0 ? flatCommands[safeActiveIndex] : undefined;

  const executeCommand = useCallback(
    (command: CommandItem) => {
      if (
        command.id !== 'system-toggle-xray' &&
        command.id !== 'system-toggle-audio'
      ) {
        playClick();
      }
      // Close the modal first so the page is no longer inert before toasts/focus run.
      const dialog = dialogRef.current;
      if (dialog?.open) {
        dialog.close();
      }
      close();
      window.requestAnimationFrame(() => {
        command.onSelect();
      });
    },
    [close, playClick],
  );

  // Sync native <dialog> modal state with context `isOpen` & play open/close sweep
  useEffect(() => {
    if (prevIsOpenRef.current !== isOpen) {
      prevIsOpenRef.current = isOpen;
      if (isOpen) {
        playCommandOpen();
      } else {
        playCommandClose();
      }
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen) {
      setQuery('');
      setActiveIndex(0);

      if (!dialog.open) {
        dialog.showModal();
      }

      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, playCommandOpen, playCommandClose]);

  // Fallback light-dismiss for browsers without HTMLDialogElement `closedby="any"`
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) {
      return;
    }

    let pressedOutside = false;

    const handlePointerDown = (event: PointerEvent): void => {
      pressedOutside = isOutsideDialogBounds(
        event.clientX,
        event.clientY,
        dialog,
      );
    };

    const handlePointerUp = (event: PointerEvent): void => {
      if (
        pressedOutside &&
        isOutsideDialogBounds(event.clientX, event.clientY, dialog)
      ) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);

    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isClient]);

  // Keep active command scrolled into view
  useEffect(() => {
    if (!activeCommand) {
      return;
    }

    const optionEl = optionRefs.current.get(activeCommand.id);
    optionEl?.scrollIntoView({ block: 'nearest' });
  }, [activeCommand]);

  const handleDialogKeyDown = (
    event: ReactKeyboardEvent<HTMLDialogElement>,
  ) => {
    if (event.key === 'Tab') {
      const container = surfaceRef.current;
      if (!container) {
        return;
      }

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'input:not([disabled]), button:not([disabled]):not([tabindex="-1"])',
        ),
      );

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }

    if (flatCommands.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      playHover();
      setActiveIndex((prev) => (prev + 1) % flatCommands.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      playHover();
      setActiveIndex(
        (prev) => (prev - 1 + flatCommands.length) % flatCommands.length,
      );
      return;
    }

    if (event.key === 'Home' && query.length === 0) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === 'End' && query.length === 0) {
      event.preventDefault();
      setActiveIndex(flatCommands.length - 1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      if (event.nativeEvent.isComposing) {
        return;
      }

      if (
        lastCompositionEndAtRef.current !== null &&
        Math.abs(event.timeStamp - lastCompositionEndAtRef.current) < 50
      ) {
        return;
      }

      if (activeCommand) {
        executeCommand(activeCommand);
      }
    }
  };

  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    lastCompositionEndAtRef.current = event.timeStamp;
  };

  if (!isClient) {
    return null;
  }

  const closedByProps: Record<string, string> = { closedby: 'any' };
  const activeOptionId = activeCommand
    ? `${listboxId}-opt-${activeCommand.id}`
    : undefined;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={() => close()}
      onClose={() => close()}
      onKeyDown={handleDialogKeyDown}
      className="command-palette-dialog rounded-2xl shadow-2xl"
      {...closedByProps}
    >
      <div
        ref={surfaceRef}
        className="flex max-h-[min(36rem,calc(100dvh-3rem))] w-full flex-col overflow-hidden rounded-2xl border border-border bg-elevated/95 text-ink shadow-[0_24px_80px_-16px_rgba(0,0,0,0.85)] backdrop-blur-xl"
      >
        <h1 id={titleId} className="sr-only">
          Global Command Palette
        </h1>

        {/* Search input header */}
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
          <Search
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-accent"
          />

          <label htmlFor={inputId} className="sr-only">
            Befehl, Sektion oder Projekt-Filter suchen
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onCompositionEnd={handleCompositionEnd}
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            placeholder="Befehl eingeben, Sektion wählen oder Projekte filtern…"
            className="min-w-0 flex-1 rounded-md bg-transparent text-base text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:text-sm"
          />

          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setActiveIndex(0);
                inputRef.current?.focus();
              }}
              aria-label="Suche zurücksetzen"
              className="inline-flex min-h-7 items-center rounded-md border border-border-subtle bg-surface px-2 font-mono text-[11px] text-ink-muted transition-colors hover:border-border hover:text-ink"
            >
              Clear
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Command Palette schließen"
            className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-md border border-border-subtle bg-surface text-ink-muted transition-colors hover:border-border hover:text-ink"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Command list */}
        <div
          id={listboxId}
          role="listbox"
          aria-label="Verfügbare Aktionen"
          data-lenis-prevent
          className="flex-1 overflow-y-auto overscroll-contain p-2"
        >
          {groupedCommands.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-ink-secondary">
                Kein passender Befehl für &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 font-mono text-xs text-ink-muted">
                Versuche &ldquo;X-Ray&rdquo;, &ldquo;GitHub&rdquo;, &ldquo;Linux&rdquo; oder &ldquo;Mail&rdquo;.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedCommands.map((section) => (
                <div key={section.group} role="group" aria-label={section.label}>
                  <div className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    {section.label}
                  </div>

                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const itemIndex = flatCommands.indexOf(item);
                      const isHighlighted = itemIndex === safeActiveIndex;
                      const optionId = `${listboxId}-opt-${item.id}`;

                      return (
                        <button
                          key={item.id}
                          ref={(node) => {
                            if (node) {
                              optionRefs.current.set(item.id, node);
                            } else {
                              optionRefs.current.delete(item.id);
                            }
                          }}
                          id={optionId}
                          type="button"
                          tabIndex={-1}
                          role="option"
                          aria-selected={isHighlighted}
                          onMouseEnter={() => {
                            if (itemIndex >= 0 && itemIndex !== safeActiveIndex) {
                              playHover();
                              setActiveIndex(itemIndex);
                            }
                          }}
                          onClick={() => executeCommand(item)}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                            isHighlighted
                              ? 'border-accent/40 bg-accent-soft text-ink'
                              : 'border-transparent bg-transparent text-ink-secondary hover:bg-surface/80 hover:text-ink',
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={cn(
                                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                                isHighlighted
                                  ? 'border-accent/40 bg-surface'
                                  : 'border-border-subtle bg-surface/70',
                              )}
                            >
                              <CommandIcon
                                name={item.icon}
                                isSelected={isHighlighted || item.isSelected}
                              />
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium text-ink">
                                  {item.label}
                                </span>
                                {item.isSelected ? (
                                  <Check
                                    aria-hidden="true"
                                    className="h-3.5 w-3.5 shrink-0 text-emerald"
                                  />
                                ) : null}
                              </div>
                              {item.subtitle ? (
                                <p className="truncate font-mono text-[11px] text-ink-muted">
                                  {item.subtitle}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {item.badge ? (
                              <span
                                className={cn(
                                  'rounded-full border px-2 py-0.5 font-mono text-[10px]',
                                  item.isSelected
                                    ? 'border-emerald/40 bg-emerald-soft text-emerald'
                                    : 'border-border bg-surface text-ink-muted',
                                )}
                              >
                                {item.badge}
                              </span>
                            ) : null}
                            {item.shortcut ? (
                              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                                {item.shortcut}
                              </kbd>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard hints footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle bg-surface/60 px-4 py-2 font-mono text-[11px] text-ink-muted">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border bg-elevated px-1.5 py-0.5 text-[10px]">
                ↑↓
              </kbd>
              <span>Navigieren</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border bg-elevated px-1.5 py-0.5 text-[10px]">
                ↵
              </kbd>
              <span>Ausführen</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border bg-elevated px-1.5 py-0.5 text-[10px]">
                Esc
              </kbd>
              <span>Schließen</span>
            </span>
          </div>

          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-border bg-elevated px-1.5 py-0.5 text-[10px]">
              Alt+I
            </kbd>
            <span>X-Ray</span>
          </span>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
