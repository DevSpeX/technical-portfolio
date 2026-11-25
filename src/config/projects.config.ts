import type { SkillDomainId } from './site.config';

export type ProjectCategory = SkillDomainId;

export type ProjectStatus =
  | 'production'
  | 'active-development'
  | 'open-source'
  | 'prototype';

export interface ProjectLinks {
  readonly repository?: string;
  readonly repoSlug?: string;
  readonly live?: string;
  readonly documentation?: string;
}

export interface ProjectArchitectureLayer {
  readonly layer: string;
  readonly detail: string;
}

export interface ProjectMetric {
  readonly label: string;
  readonly value: string;
}

export interface ProjectItem {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly problemStatement: string;
  readonly category: ProjectCategory;
  readonly status: ProjectStatus;
  readonly featured: boolean;
  readonly year: number;
  readonly role: string;
  readonly techStack: readonly string[];
  readonly highlights: readonly string[];
  readonly keyLearnings: readonly string[];
  readonly architecture: readonly ProjectArchitectureLayer[];
  readonly metrics: readonly ProjectMetric[];
  readonly coverImage?: string; // Optional: Pfad unter /public/images/projects/<slug>.png
  readonly links: ProjectLinks;
}

export const PROJECTS: readonly ProjectItem[] = [
  /*{
    
    id: 'aegis-orchestrator',
    slug: 'aegis-orchestrator',
    title: 'Aegis AI Orchestrator',
    tagline: 'Typensichere Multi-Agent-Orchestrierung mit deterministischen Guardrails',
    description:
      'Modulare Full-Stack-Plattform für strukturierte LLM-Workflows, Streaming-Telemetrie und nachvollziehbare Tool-Ausführung unter strikten Schema-Verträgen.',
    problemStatement:
      'Produktive Multi-Agent-Workflows scheitern oft an ungetypten Tool-Aufrufen, intransparenten Token-Budgets und schwer debuggbaren Zwischenzuständen bei paralleler Ausführung.',
    category: 'fullstack-ai',
    status: 'production',
    featured: true,
    year: 2026,
    role: 'Lead Architect & Full-Stack Engineer',
    techStack: ['Next.js 15', 'TypeScript', 'PostgreSQL', 'Redis', 'OpenTelemetry', 'Tailwind CSS'],
    highlights: [
      'Strikte Laufzeit-Validierung aller Tool-Payloads ohne ungetypte Zwischenschichten',
      'Server-Sent Events für latenzarme Token- und Execution-Step-Visualisierung',
      'Isolierte Tenant-Policy-Engine mit auditierbarem Execution-Log',
    ],
    keyLearnings: [
      'Deterministische DAG-Graphen mit expliziten Schema-Grenzen schlagen freie Agent-Loops bei Latenz und Wartbarkeit deutlich.',
      'Feingranulare OpenTelemetry-Spans pro Tool-Call reduzieren die Fehlersuche in Multi-Step-Pipelines von Stunden auf Minuten.',
    ],
    architecture: [
      {
        layer: 'Orchestration Core',
        detail: 'Zustandsbasierte DAG-Pipeline mit Retry-Backoff und Budget-Limits.',
      },
      {
        layer: 'Transport & UI',
        detail: 'React Server Components gekoppelt mit inkrementellen Streaming-Adaptern.',
      },
    ],
    metrics: [
      { label: 'Schema Coverage', value: '100% strict' },
      { label: 'Stream Overhead', value: '< 12 ms' },
    ],
    links: {
      repository: 'https://github.com/PLACEHOLDER_GITHUB/aegis-orchestrator', // TODO: INSERT_LINK_HERE
      repoSlug: 'PLACEHOLDER_GITHUB/aegis-orchestrator', // TODO: INSERT_LINK_HERE
      live: 'https://aegis.example.invalid', // TODO: INSERT_LINK_HERE
      documentation: 'https://docs.aegis.example.invalid', // TODO: INSERT_LINK_HERE
    },
  },*/
  {
    id: 'voidstation',
    slug: 'voidstation',
    title: 'VoidStation',
    tagline: 'Modulare, reproduzierbare Linux-Workstation- und Systemarchitektur',
    description:
      'Open-Source-Systemkonfiguration und CLI-Toolkit für schnelle, deklarative Linux-Arbeitsumgebungen mit Fokus auf Tastatur-Ergonomie, minimale Latenz und saubere Paket-Isolation.',
    problemStatement:
      'Gewachsene Workstation-Setups driften über Monate auseinander, brechen bei Distro-Upgrades und kosten beim Umzug auf neue Hardware unnötig viel manuelle Einrichtungszeit.',
    category: 'linux-oss',
    status: 'open-source',
    featured: true,
    year: 2026,
    role: 'Creator & Maintainer',
    techStack: ['Linux', 'POSIX Shell', 'Rust', 'Wayland', 'Systemd', 'Lua'],
    highlights: [
      'Deklarative Profile für Terminal, Window-Management und Developer-Toolchains',
      'Idempotentes Bootstrap-Skript mit Rollback-fähigen Konfigurations-Snapshots',
      'Ressourcenschonendes Telemetrie-Overlay für CPU-, Speicher- und I/O-Metriken',
    ],
    keyLearnings: [
      'Strikt idempotente Provisioning-Schritte mit Checksum-Prüfung verhindern Konfigurations-Drift zuverlässiger als große Monolith-Skripte.',
      'Die Trennung von Compositor-, Shell- und Toolchain-Manifesten macht experimentelle Updates ohne Systemrisiko möglich.',
    ],
    architecture: [
      {
        layer: 'Provisioning Layer',
        detail: 'Idempotente Modul-Runner mit Checksum-Prüfung und Dry-Run-Modus.',
      },
      {
        layer: 'Runtime Environment',
        detail: 'Entkoppelte Compositor-, Shell- und Editor-Layer über Symlink-Manifeste.',
      },
    ],
    metrics: [
      { label: 'Cold Bootstrap', value: '< 4 min' },
      { label: 'Idle Memory', value: '~ 420 MB' },
    ],
    links: {
      repository: 'https://github.com/Panther92/VoidStation', // TODO: INSERT_LINK_HERE
      repoSlug: 'Panther92/VoidStation', // TODO: INSERT_LINK_HERE
      documentation: 'https://voidstation.de', // TODO: INSERT_LINK_HERE
    },
  },
  /*{
    id: 'kinetix-core',
    slug: 'kinetix-core',
    title: 'Kinetix Core (Unity / C#)',
    tagline: 'Deterministische Gameplay-Systeme und datengetriebene Combat-/Physics-Architektur',
    description:
      'Wiederverwendbares Unity-C#-Framework für reaktive Spielmechaniken, entkoppelte State-Machines, Input-Buffering und Editor-seitige Balance-Inspektoren.',
    problemStatement:
      'Eng gekoppelte MonoBehaviour-Skripte und unkontrollierte GC-Allokationen im Update-Loop führen in actionreichen Unity-Projekten schnell zu Frame-Drops und brüchiger Combat-Logik.',
    category: 'gamedev-interactive',
    status: 'active-development',
    featured: true,
    year: 2025,
    role: 'Systems & Gameplay Programmer',
    techStack: ['Unity', 'C#', 'ScriptableObjects', 'Cinemachine', 'Custom Editor Tools'],
    highlights: [
      'Zero-Allocation-Hotpaths im FixedUpdate-Tick für stabiles Frame-Pacing',
      'Modularer Ability-Graph über typisierte ScriptableObject-Pipelines',
      'Integriertes Frame-Step-Debugging für Hitbox- und Transitions-Validierung',
    ],
    keyLearnings: [
      'Datengetriebene ScriptableObject-Graphen ermöglichen schnelles Balancing im Editor ohne Code-Recompiles.',
      'Ein deterministischer Input-Buffer im Fixed-Timestep fühlt sich für Spieler spürbar präziser an als reine Frame-Event-Abfragen.',
    ],
    architecture: [
      {
        layer: 'Simulation Tick',
        detail: 'Entkoppelter Fixed-Timestep-Scheduler mit deterministischem Input-Buffer.',
      },
      {
        layer: 'Presentation Adapter',
        detail: 'Event-basierte Audio-, Kamera- und VFX-Hooks ohne Gameplay-Kopplung.',
      },
    ],
    metrics: [
      { label: 'GC Alloc / Frame', value: '0 B (Hotpath)' },
      { label: 'Target Cadence', value: '120+ FPS' },
    ],
    links: {
      repository: 'https://github.com/PLACEHOLDER_GITHUB/kinetix-core', // TODO: INSERT_LINK_HERE
      repoSlug: 'PLACEHOLDER_GITHUB/kinetix-core', // TODO: INSERT_LINK_HERE
      live: 'https://kinetix.example.invalid', // TODO: INSERT_LINK_HERE
    },
  },
  {
    id: 'vector-drift-web',
    slug: 'vector-drift-web',
    title: 'Vector Drift Web Engine',
    tagline: 'Browser-natives Arcade- & Physik-System mit Fixed-Timestep-Loop',
    description:
      'Leichtgewichtiges Web-Game- und Simulations-Projekt in reinem TypeScript mit eigenem Spatial-Hash-Broadphase-Collider, WebAudio-Synthese und 60/120Hz-Interpolation.',
    problemStatement:
      'Browser-Simulationen mit variabler Display-Refresh-Rate (60Hz vs. 120Hz/144Hz) leiden bei naivem requestAnimationFrame-Delta schnell unter inkonsistenter Physik und Objekt-Tunneling.',
    category: 'gamedev-interactive',
    status: 'prototype',
    featured: false,
    year: 2025,
    role: 'Creator & Engine Developer',
    techStack: ['TypeScript', 'HTML5 Canvas', 'WebGL', 'Web Audio API', 'Next.js'],
    highlights: [
      'Accumulator-basierter Fixed-Timestep mit sub-pixel-genauer Render-Interpolation',
      'Prozedurale Sound-Effekte über WebAudio-Nodes ohne externe Asset-Latenzen',
      'Tastatur-, Gamepad- und Pointer-Eingabe über einheitliche Action-Maps',
    ],
    keyLearnings: [
      'Ein gekappter Accumulator plus Alpha-Interpolation garantiert identische Spielphysik auf 60Hz- und 120Hz-Monitoren.',
      'Object-Pooling im Spatial-Hash-Grid eliminiert GC-Spikes selbst bei hunderten gleichzeitigen Kollisionsprüfungen.',
    ],
    architecture: [
      {
        layer: 'Physics & Spatial Grid',
        detail: 'Uniform Grid Broadphase mit objektgepoolten Kontaktpunkten.',
      },
      {
        layer: 'Render Pipeline',
        detail: 'Device-Pixel-Ratio-bewusster Canvas/WebGL-Renderer mit Frame-Budget-Guard.',
      },
    ],
    metrics: [
      { label: 'Bundle Footprint', value: '< 35 KB gz' },
      { label: 'Tick Stability', value: '16.6 ms lock' },
    ],
    links: {
      repository: 'https://github.com/PLACEHOLDER_GITHUB/vector-drift-web', // TODO: INSERT_LINK_HERE
      repoSlug: 'PLACEHOLDER_GITHUB/vector-drift-web', // TODO: INSERT_LINK_HERE
      live: 'https://vectordrift.example.invalid', // TODO: INSERT_LINK_HERE
    },
  },*/
];

export function getFeaturedProjects(): readonly ProjectItem[] {
  return PROJECTS.filter((project) => project.featured);
}

export function getProjectsByCategory(
  category: ProjectCategory,
): readonly ProjectItem[] {
  return PROJECTS.filter((project) => project.category === category);
}

export function getProjectBySlug(slug: string): ProjectItem | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}
