import type { ProjectItem, SiteConfig } from '@/config';
import type { ProjectFilterCategory } from '@/shared/providers/portfolio-filter-provider';
import type { ToastInput } from '@/shared/providers/toast-provider';

export type CommandGroup = 'navigation' | 'inspector' | 'projects' | 'contact';

export type CommandIconName =
  | 'compass'
  | 'scan'
  | 'audio'
  | 'filter'
  | 'layers'
  | 'mail'
  | 'github'
  | 'linkedin'
  | 'external';

export interface CommandItem {
  readonly id: string;
  readonly label: string;
  readonly subtitle?: string;
  readonly group: CommandGroup;
  readonly keywords: readonly string[];
  readonly shortcut?: string;
  readonly badge?: string;
  readonly isSelected?: boolean;
  readonly icon: CommandIconName;
  readonly onSelect: () => void;
}

export const COMMAND_GROUP_LABELS: Record<CommandGroup, string> = {
  navigation: 'Navigation',
  inspector: 'System & X-Ray',
  projects: 'Projekt-Filter',
  contact: 'Kontakt & Links',
};

export const COMMAND_GROUP_ORDER: readonly CommandGroup[] = [
  'navigation',
  'inspector',
  'projects',
  'contact',
];

export interface BuildCommandsDeps {
  readonly site: SiteConfig;
  readonly projects: readonly ProjectItem[];
  readonly isInspectorActive: boolean;
  readonly toggleInspector: () => void;
  readonly isAudioMuted: boolean;
  readonly toggleAudioMute: () => void;
  readonly activeCategory: ProjectFilterCategory;
  readonly setActiveCategory: (category: ProjectFilterCategory) => void;
  readonly navigateToSection: (href: string) => void;
  readonly showToast: (input: ToastInput) => void;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy textarea fallback if Clipboard API fails.
    }
  }

  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

function getSocialIcon(platform: string): CommandIconName {
  if (platform === 'github') {
    return 'github';
  }
  if (platform === 'linkedin') {
    return 'linkedin';
  }
  return 'external';
}

/**
 * Builds the dynamic command palette registry from `SITE_CONFIG`, `PROJECTS`,
 * and live interactive state (inspector toggle, active project filter).
 */
export function buildCommands({
  site,
  projects,
  isInspectorActive,
  toggleInspector,
  isAudioMuted,
  toggleAudioMute,
  activeCategory,
  setActiveCategory,
  navigateToSection,
  showToast,
}: BuildCommandsDeps): readonly CommandItem[] {
  const navigationCommands: CommandItem[] = site.navigation.map((item) => ({
    id: `nav-${item.id}`,
    label: item.label,
    subtitle: `Zu Sektion ${item.href} springen`,
    group: 'navigation',
    keywords: ['navigation', 'section', 'sektion', item.id, item.label, item.href],
    shortcut: item.shortcut,
    icon: 'compass',
    onSelect: () => {
      navigateToSection(item.href);
    },
  }));

  const inspectorCommand: CommandItem = {
    id: 'system-toggle-xray',
    label: isInspectorActive
      ? 'Architecture X-Ray deaktivieren'
      : 'Architecture X-Ray aktivieren',
    subtitle: 'RSC- & Client-Component-Boundaries als Blueprint-HUD anzeigen',
    group: 'inspector',
    keywords: ['xray', 'x-ray', 'inspector', 'architecture', 'blueprint', 'hud', 'rsc'],
    shortcut: 'Alt+I',
    badge: isInspectorActive ? 'Aktiv' : 'Inaktiv',
    isSelected: isInspectorActive,
    icon: 'scan',
    onSelect: () => {
      const nextActive = !isInspectorActive;
      toggleInspector();
      showToast({
        title: nextActive
          ? 'Architecture X-Ray aktiviert'
          : 'Architecture X-Ray deaktiviert',
        description: nextActive
          ? 'Komponenten-Layer & Render-Metriken sichtbar'
          : 'Zurück in der Standard-Ansicht',
        tone: nextActive ? 'cobalt' : 'neutral',
      });
    },
  };

  const audioCommand: CommandItem = {
    id: 'system-toggle-audio',
    label: isAudioMuted
      ? 'Tactile UI-Audio aktivieren'
      : 'Tactile UI-Audio stummschalten',
    subtitle: 'Prozedurale Web-Audio-Synthese für Buttons, Tabs & Telemetrie',
    group: 'inspector',
    keywords: [
      'audio',
      'sound',
      'ton',
      'mute',
      'unmute',
      'sfx',
      'tactile',
      'equalizer',
      'stumm',
    ],
    badge: isAudioMuted ? 'Aus' : 'Aktiv',
    isSelected: !isAudioMuted,
    icon: 'audio',
    onSelect: () => {
      const nextEnabled = isAudioMuted;
      toggleAudioMute();
      showToast({
        title: nextEnabled
          ? 'Tactile UI-Audio aktiviert'
          : 'Tactile UI-Audio stummgeschaltet',
        description: nextEnabled
          ? 'Web Audio Synthesizer aktiv · Präferenz gespeichert'
          : 'Alle UI-Soundeffekte deaktiviert',
        tone: nextEnabled ? 'emerald' : 'neutral',
      });
    },
  };

  const filterAllCommand: CommandItem = {
    id: 'filter-projects-all',
    label: 'Alle Projekte anzeigen',
    subtitle: `Filter zurücksetzen (${projects.length} Einträge)`,
    group: 'projects',
    keywords: ['filter', 'projects', 'projekte', 'alle', 'all', 'reset'],
    badge: activeCategory === 'all' ? 'Aktiv' : `${projects.length}`,
    isSelected: activeCategory === 'all',
    icon: 'layers',
    onSelect: () => {
      setActiveCategory('all');
      navigateToSection('#projects');
      showToast({
        title: 'Projekt-Filter: Alle',
        description: `${projects.length} Projekte eingeblendet`,
        tone: 'neutral',
      });
    },
  };

  const domainFilterCommands: CommandItem[] = site.skillDomains.map((domain) => {
    const count = projects.filter((p) => p.category === domain.id).length;
    const isCurrent = activeCategory === domain.id;

    return {
      id: `filter-projects-${domain.id}`,
      label: `Projekte filtern: ${domain.shortLabel}`,
      subtitle: domain.title,
      group: 'projects',
      keywords: [
        'filter',
        'projects',
        'projekte',
        domain.id,
        domain.shortLabel,
        domain.title,
        ...domain.stack,
      ],
      badge: isCurrent ? 'Aktiv' : `${count}`,
      isSelected: isCurrent,
      icon: 'filter',
      onSelect: () => {
        setActiveCategory(domain.id);
        navigateToSection('#projects');
        showToast({
          title: `Projekt-Filter: ${domain.shortLabel}`,
          description: `${count} passende Projekte ausgewählt`,
          tone: 'emerald',
        });
      },
    };
  });

  const copyEmailCommand: CommandItem = {
    id: 'contact-copy-email',
    label: 'E-Mail-Adresse kopieren',
    subtitle: site.owner.email,
    group: 'contact',
    keywords: ['email', 'mail', 'kontakt', 'contact', 'copy', 'kopieren', site.owner.email],
    icon: 'mail',
    onSelect: () => {
      void copyTextToClipboard(site.owner.email).then((copied) => {
        showToast({
          title: copied ? 'E-Mail-Adresse kopiert' : 'Zwischenablage nicht verfügbar',
          description: site.owner.email,
          tone: copied ? 'emerald' : 'amber',
        });
      });
    },
  };

  const externalSocials = site.socials
    .filter((social) => social.external)
    .sort((a, b) => {
      const priority = (platform: string): number => {
        if (platform === 'github') return 0;
        if (platform === 'linkedin') return 1;
        return 2;
      };
      return priority(a.platform) - priority(b.platform);
    });

  const socialCommands: CommandItem[] = externalSocials.map((social) => ({
    id: `social-open-${social.id}`,
    label: `${social.label} öffnen`,
    subtitle: `${social.handle} · externer Tab`,
    group: 'contact',
    keywords: [
      'social',
      'link',
      'öffnen',
      'open',
      social.id,
      social.platform,
      social.label,
      social.handle,
    ],
    icon: getSocialIcon(social.platform),
    onSelect: () => {
      if (typeof window !== 'undefined') {
        window.open(social.href, '_blank', 'noopener,noreferrer');
      }
      showToast({
        title: `${social.label} geöffnet`,
        description: social.handle,
        tone: 'cobalt',
      });
    },
  }));

  return [
    ...navigationCommands,
    inspectorCommand,
    audioCommand,
    filterAllCommand,
    ...domainFilterCommands,
    copyEmailCommand,
    ...socialCommands,
  ];
}

/**
 * Case-insensitive multi-token command search across label, subtitle, group,
 * and registered keywords.
 */
export function filterCommands(
  commands: readonly CommandItem[],
  rawQuery: string,
): readonly CommandItem[] {
  const normalized = rawQuery.trim().toLowerCase();
  if (!normalized) {
    return commands;
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);

  return commands.filter((command) => {
    const haystack = [
      command.label,
      command.subtitle ?? '',
      COMMAND_GROUP_LABELS[command.group],
      ...command.keywords,
    ]
      .join(' ')
      .toLowerCase();

    return tokens.every((token) => haystack.includes(token));
  });
}
