export type SocialPlatform =
  | 'github'
  | 'linkedin'
  | 'discord'
  | 'x'
  | 'email'
  | 'website';

export interface SocialLink {
  readonly id: string;
  readonly platform: SocialPlatform;
  readonly label: string;
  readonly handle: string;
  readonly href: string;
  readonly copyValue?: string;
  readonly external: boolean;
}

export type NavSectionId =
  | 'hero'
  | 'projects'
  | 'telemetry'
  | 'experience'
  | 'contact';

export interface NavItem {
  readonly id: NavSectionId;
  readonly label: string;
  readonly href: `#${NavSectionId}`;
  readonly shortcut: string;
}

export type SkillDomainId =
  | 'fullstack-ai'
  | 'linux-oss'
  | 'gamedev-interactive';

export type AccentVariant = 'cobalt' | 'emerald' | 'amber';

export interface SkillDomain {
  readonly id: SkillDomainId;
  readonly title: string;
  readonly shortLabel: string;
  readonly summary: string;
  readonly focusAreas: readonly string[];
  readonly stack: readonly string[];
  readonly accent: AccentVariant;
}

export type AvailabilityStatus = 'available' | 'selective' | 'unavailable';

export interface SiteOwner {
  readonly name: string;
  readonly handle: string;
  readonly role: string;
  readonly headline: string;
  readonly subheadline: string;
  readonly location: string;
  readonly timezone: string;
  readonly availabilityStatus: AvailabilityStatus;
  readonly availabilityLabel: string;
  readonly githubUsername: string;
  readonly email: string;
}

export interface SiteMetadataConfig {
  readonly siteUrl: string;
  readonly title: string;
  readonly titleTemplate: string;
  readonly description: string;
  readonly locale: string;
  readonly ogImage: string;
  readonly twitterHandle?: string;
  readonly keywords: readonly string[];
}

export interface SiteLegalConfig {
  readonly ownerFullName: string;
  readonly streetAddress: string;
  readonly postalCity: string;
  readonly country: string;
  readonly email: string;
  readonly vatNote: string;
}

export interface SiteConfig {
  readonly owner: SiteOwner;
  readonly metadata: SiteMetadataConfig;
  readonly legal: SiteLegalConfig;
  readonly navigation: readonly NavItem[];
  readonly socials: readonly SocialLink[];
  readonly skillDomains: readonly SkillDomain[];
}

const RESOLVED_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://florian-wiedenbein.vercel.app');

export const SITE_CONFIG: SiteConfig = {
  owner: {
    name: 'Florian',
    handle: 'devsoon',
    role: 'Systems & Full-Stack Software Engineer',
    headline: 'Architektur für Web-Systeme, AI-Pipelines und interaktive Laufzeiten.',
    subheadline:
      'Produktionsreife Full-Stack-Plattformen, deterministische Linux-Umgebungen und reaktive Echtzeit-Systeme mit Fokus auf Typensicherheit, Performance und Wartbarkeit.',
    location: 'DACH / Remote',
    timezone: 'Europe/Berlin',
    availabilityStatus: 'selective',
    availabilityLabel: 'Offen für ausgewählte Engineering-Mandate',
    githubUsername: 'DevSpeX',
    email: 'florian.wiedenbein@icloud.com', // TODO: INSERT_LINK_HERE
  },
  metadata: {
    siteUrl: RESOLVED_SITE_URL,
    title: 'Florian — Systems & Full-Stack Software Engineer',
    titleTemplate: '%s | Florian',
    description:
      'Engineering-Portfolio für Full-Stack Web Architecture, AI-Orchestration, Open-Source Linux Systems und Game Development (Unity / C# / Web-Games).',
    locale: 'de_DE',
    ogImage: '/og-image.png', // TODO: INSERT_IMAGE_IN_PUBLIC_FOLDER (1200x630)
    twitterHandle: '@F_Wiedenbein', // TODO: INSERT_LINK_HERE
    keywords: [
      'Next.js 15',
      'TypeScript',
      'Full-Stack Engineering',
      'AI Orchestration',
      'Linux Systems',
      'VoidStation',
      'Unity C#',
      'Web Games',
    ],
  },
  legal: {
    ownerFullName: 'Florian Wiedenbein', // TODO: INSERT_LEGAL_INFO_HERE
    streetAddress: 'Schöninger Straße 10', // TODO: INSERT_LEGAL_INFO_HERE
    postalCity: '39387 Oschersleben (Bode)', // TODO: INSERT_LEGAL_INFO_HERE
    country: 'Deutschland',
    email: 'florian.wiedenbein@icloud.com', // TODO: INSERT_LINK_HERE
    vatNote: 'Umsatzsteuer-ID gemäß § 27 a UStG: auf Anfrage / nicht anwendbar',
  },
  navigation: [
    { id: 'hero', label: 'Overview', href: '#hero', shortcut: '01' },
    { id: 'projects', label: 'Architecture', href: '#projects', shortcut: '02' },
    { id: 'telemetry', label: 'Telemetry', href: '#telemetry', shortcut: '03' },
    { id: 'experience', label: 'Experience', href: '#experience', shortcut: '04' },
    { id: 'contact', label: 'Contact', href: '#contact', shortcut: '05' },
  ],
  socials: [
    {
      id: 'github',
      platform: 'github',
      label: 'GitHub',
      handle: '@DevSpeX', // TODO: INSERT_LINK_HERE
      href: 'https://github.com/DevSpeX', // TODO: INSERT_LINK_HERE
      external: true,
    },
    {
      id: 'linkedin',
      platform: 'linkedin',
      label: 'LinkedIn',
      handle: 'in/florian-wiedenbein', // TODO: INSERT_LINK_HERE
      href: 'https://www.linkedin.com/in/florian-wiedenbein-a03b0b196/', // TODO: INSERT_LINK_HERE
      external: true,
    },
    {
      id: 'discord',
      platform: 'discord',
      label: 'Discord',
      handle: 'devsoon', // TODO: INSERT_LINK_HERE
      href: 'https://discord.com/users/206421443951460352', // TODO: INSERT_LINK_HERE
      copyValue: 'devsoon', // TODO: INSERT_LINK_HERE
      external: true,
    },
    {
      id: 'x',
      platform: 'x',
      label: 'X / Twitter',
      handle: '@F_Wiedenbein', // TODO: INSERT_LINK_HERE
      href: 'https://x.com/F_Wiedenbein', // TODO: INSERT_LINK_HERE
      copyValue: '@F_Wiedenbein', // TODO: INSERT_LINK_HERE
      external: true,
    },
    {
      id: 'website',
      platform: 'website',
      label: 'Notes & Docs',
      handle: 'Coming Soon...', // TODO: INSERT_LINK_HERE
      href: 'https://example.invalid/notes', // TODO: INSERT_LINK_HERE
      copyValue: 'https://example.invalid/notes', // TODO: INSERT_LINK_HERE
      external: true,
    },
    {
      id: 'email',
      platform: 'email',
      label: 'Direct Mail',
      handle: 'florian.wiedenbein@icloud.com', // TODO: INSERT_LINK_HERE
      href: 'mailto:florian.wiedenbein@icloud.com', // TODO: INSERT_LINK_HERE
      copyValue: 'florian.wiedenbein@icloud.com', // TODO: INSERT_LINK_HERE
      external: false,
    },
  ],
  skillDomains: [
    {
      id: 'fullstack-ai',
      title: 'Full-Stack Web Engineering & AI-Orchestration',
      shortLabel: 'Web & AI Systems',
      summary:
        'End-to-End Web-Architekturen mit React Server Components, strikten Typgrenzen, deterministischen Tool-Pipelines und beobachtbarer LLM-Orchestrierung.',
      focusAreas: [
        'Next.js App Router, Edge/Server Boundaries & Streaming UI',
        'Multi-Step Agent Workflows, Tool-Calling & Structured Outputs',
        'Security-First Delivery (CSP, Zero-Trust API Contracts, Telemetry)',
      ],
      stack: ['Next.js 15', 'TypeScript', 'React 19', 'PostgreSQL', 'Node.js', 'AI SDKs'],
      accent: 'cobalt',
    },
    {
      id: 'linux-oss',
      title: 'Open-Source & Linux Systems',
      shortLabel: 'Linux & OSS',
      summary:
        'Reproduzierbare Workstation- und Server-Umgebungen, modulare Dotfile-/System-Toolchains und performante CLI-Utilities im Open-Source-Ökosystem.',
      focusAreas: [
        'Reproduzierbare Linux-Setups & Systemd / Container-Workflows',
        'Modularisierte Desktop- & Terminal-Umgebungen (z. B. VoidStation)',
        'Automatisierte Provisioning-Skripte & Paket-Hygiene',
      ],
      stack: ['Arch / Void Linux', 'Bash / POSIX', 'Rust / Go CLI', 'Docker', 'Wayland', 'Git'],
      accent: 'emerald',
    },
    {
      id: 'gamedev-interactive',
      title: 'Game Development & Interactive Systems',
      shortLabel: 'Games & Simulation',
      summary:
        'Deterministische Gameplay-Loops, saubere Entkopplung von Simulation und Rendering sowie reaktive Web-Experiences mit konstanter Frame-Pacing-Disziplin.',
      focusAreas: [
        'Unity / C# Architektur (ScriptableObjects, State Machines, Event Buses)',
        'Web-Games & Fixed-Timestep Canvas/WebGL Rendering',
        'Eingabe-Latenz-Minimierung & Frame-Budget-Profiling',
      ],
      stack: ['Unity', 'C#', 'WebGL / Canvas', 'TypeScript', 'Motion', 'GLSL'],
      accent: 'amber',
    },
  ],
};
