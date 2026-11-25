import type { SpotlightTone } from '@/shared/components';

export type PillarId =
  | 'frontend-motion'
  | 'backend-cloud-linux'
  | 'ai-workflows'
  | 'gamedev-csharp';

export interface MatrixTool {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly relationLabel: string;
  readonly connectsTo: readonly PillarId[];
  readonly synergyNote: string;
}

export interface PillarConnection {
  readonly id: string;
  readonly from: PillarId;
  readonly to: PillarId;
  readonly label: string;
  readonly lane: 1 | 2 | 3;
}

export interface EngineeringPillar {
  readonly id: PillarId;
  readonly columnIndex: 0 | 1 | 2 | 3;
  readonly index: string;
  readonly title: string;
  readonly subtitle: string;
  readonly summary: string;
  readonly tone: SpotlightTone;
  readonly accentText: string;
  readonly accentBorder: string;
  readonly accentBg: string;
  readonly accentStroke: string;
  readonly accentDot: string;
  readonly philosophy: string;
  readonly invariant: string;
  readonly linkedPillars: readonly PillarId[];
  readonly synergySummary: string;
  readonly tools: readonly MatrixTool[];
}

export const PILLAR_CONNECTIONS: readonly PillarConnection[] = [
  {
    id: 'backend-to-frontend',
    from: 'backend-cloud-linux',
    to: 'frontend-motion',
    label: 'Feeds Data →',
    lane: 1,
  },
  {
    id: 'frontend-to-backend',
    from: 'frontend-motion',
    to: 'backend-cloud-linux',
    label: 'Deploys to →',
    lane: 1,
  },
  {
    id: 'ai-to-frontend',
    from: 'ai-workflows',
    to: 'frontend-motion',
    label: 'Streams UI →',
    lane: 2,
  },
  {
    id: 'ai-to-backend',
    from: 'ai-workflows',
    to: 'backend-cloud-linux',
    label: 'Orchestrates →',
    lane: 1,
  },
  {
    id: 'gamedev-to-frontend',
    from: 'gamedev-csharp',
    to: 'frontend-motion',
    label: 'Frame-Pacing →',
    lane: 3,
  },
  {
    id: 'ai-to-gamedev',
    from: 'ai-workflows',
    to: 'gamedev-csharp',
    label: 'Simulates →',
    lane: 1,
  },
  {
    id: 'backend-to-gamedev',
    from: 'backend-cloud-linux',
    to: 'gamedev-csharp',
    label: 'Powers CLI →',
    lane: 2,
  },
];

export const ENGINEERING_PILLARS: readonly EngineeringPillar[] = [
  {
    id: 'frontend-motion',
    columnIndex: 0,
    index: '01',
    title: 'Frontend & Motion',
    subtitle: 'UI Architecture & 120fps Compositor',
    summary:
      'Typsichere Web-Oberflächen mit Server Components, nativen Top-Layer-APIs und GPU-flüssigen UI-Zuständen.',
    tone: 'cobalt',
    accentText: 'text-accent',
    accentBorder: 'border-accent/55',
    accentBg: 'bg-accent-soft',
    accentStroke: 'var(--accent-primary)',
    accentDot: 'bg-accent',
    philosophy:
      'Strikte Server/Client-Grenzen, native Browser-Primitives (<dialog>, Popover) und GPU-kompositierte Interaktionen ohne Layout-Thrashing.',
    invariant: '0 React Re-Renders pro Pointer-Frame',
    linkedPillars: ['backend-cloud-linux', 'ai-workflows', 'gamedev-csharp'],
    synergySummary:
      'Verbindet Server-Streaming aus dem Backend, SSE-Token-Streams aus AI-Pipelines und Frame-Pacing-Disziplin aus dem Game-Dev.',
    tools: [
      {
        id: 'nextjs-rsc',
        name: 'Next.js 15 & RSC',
        role: 'App Router, ISR & Streaming',
        relationLabel: 'Deploys to →',
        connectsTo: ['backend-cloud-linux', 'ai-workflows'],
        synergyNote:
          'Lädt Backend- und GitHub-Telemetrie direkt am Server und streamt AI-Antworten ohne Client-Waterfall.',
      },
      {
        id: 'typescript-strict',
        name: 'Strict TypeScript',
        role: 'End-to-End Schema Contracts',
        relationLabel: 'Feeds Contracts →',
        connectsTo: ['backend-cloud-linux', 'ai-workflows', 'gamedev-csharp'],
        synergyNote:
          'Bildet die gemeinsame Typ-Grenze zwischen UI, API-Verträgen, Tool-Schemas und Web-Game-Engines.',
      },
      {
        id: 'motion-css',
        name: 'Motion & CSS Compositor',
        role: 'Spring Physics & @starting-style',
        relationLabel: 'Frame-Pacing →',
        connectsTo: ['gamedev-csharp'],
        synergyNote:
          'Nutzt dieselbe 8.3ms/16.6ms Frame-Budget-Disziplin wie Echtzeit-Spielschleifen.',
      },
      {
        id: 'a11y-native',
        name: 'WCAG AA+ & Native Top-Layer',
        role: 'Keyboard-First & Reduced Motion',
        relationLabel: 'Hardens UI →',
        connectsTo: ['backend-cloud-linux'],
        synergyNote:
          'Progressive Enhancement ohne schwere JS-Polyfills — stabil auch bei strikten CSP-Headern.',
      },
    ],
  },
  {
    id: 'backend-cloud-linux',
    columnIndex: 1,
    index: '02',
    title: 'Backend & Cloud/Linux',
    subtitle: 'Deterministic Systems & Infrastructure',
    summary:
      'Reproduzierbare Linux-Laufzeiten, gehärtete Daten-Layer und idempotente Deployments für produktive Services.',
    tone: 'emerald',
    accentText: 'text-emerald',
    accentBorder: 'border-emerald/55',
    accentBg: 'bg-emerald-soft',
    accentStroke: 'var(--accent-emerald)',
    accentDot: 'bg-emerald',
    philosophy:
      'Reproduzierbare Linux-Umgebungen, idempotente Deployments und datenbanknahe API-Verträge mit klarer Observability statt Blackbox-Infra.',
    invariant: 'Idempotent · Reproduzierbar · Auditierbar',
    linkedPillars: ['frontend-motion', 'ai-workflows', 'gamedev-csharp'],
    synergySummary:
      'Liefert gehärtete Daten-Pipelines, Caching-Layer und Linux-Laufzeiten für Web-Plattformen und persistente AI-Agent-Workflows.',
    tools: [
      {
        id: 'postgres-redis',
        name: 'PostgreSQL & Redis',
        role: 'Relational Core & Low-Latency Cache',
        relationLabel: 'Feeds Data →',
        connectsTo: ['frontend-motion', 'ai-workflows'],
        synergyNote:
          'Persistiert Audit-Logs, DAG-States und Rate-Limit-Quotas für Next.js-Server-Actions und Agent-Runs.',
      },
      {
        id: 'linux-void-arch',
        name: 'Arch / Void Linux & Systemd',
        role: 'Declarative OS & Wayland Tooling',
        relationLabel: 'Hosts Runtime →',
        connectsTo: ['ai-workflows'],
        synergyNote:
          'Minimale, reproduzierbare Dev- und Server-Nodes mit sauberer Service- und Ressourcen-Isolation.',
      },
      {
        id: 'docker-posix',
        name: 'Docker & POSIX Shell',
        role: 'Containerized Provisioning',
        relationLabel: 'Deploys to →',
        connectsTo: ['frontend-motion', 'ai-workflows'],
        synergyNote:
          'Garantiert identische Build- und Laufzeitumgebungen vom lokalen Terminal bis zur Produktion.',
      },
      {
        id: 'rust-cli',
        name: 'Rust / Node.js Services',
        role: 'System-CLIs & Edge Workers',
        relationLabel: 'Powers CLI →',
        connectsTo: ['gamedev-csharp'],
        synergyNote:
          'Teilt speicherbewusstes Systemdenken und deterministische Fehlerbehandlung mit C#-Laufzeiten.',
      },
    ],
  },
  {
    id: 'ai-workflows',
    columnIndex: 2,
    index: '03',
    title: 'AI-Workflows & Automation',
    subtitle: 'Agent Orchestration & Guardrails',
    summary:
      'Deterministische Multi-Agent-Pipelines mit strikten Schema-Verträgen, Guardrails und messbaren Eval-Loops.',
    tone: 'cobalt',
    accentText: 'text-accent',
    accentBorder: 'border-accent/55',
    accentBg: 'bg-accent-soft',
    accentStroke: 'var(--accent-primary)',
    accentDot: 'bg-accent',
    philosophy:
      'LLMs als kontrollierte Bausteine in deterministischen Systemen: Jeder Agent-Schritt braucht strikte Schemas, Budget-Limits und Traces.',
    invariant: '100% Schema-validierte Tool-Payloads',
    linkedPillars: ['frontend-motion', 'backend-cloud-linux', 'gamedev-csharp'],
    synergySummary:
      'Orchestriert Daten aus dem Backend, streamt Execution-Steps live ins Frontend und automatisiert Playtest- sowie Code-Workflows.',
    tools: [
      {
        id: 'dag-orchestration',
        name: 'Multi-Agent DAG Pipelines',
        role: 'State Machines & Retry-Backoff',
        relationLabel: 'Streams UI →',
        connectsTo: ['backend-cloud-linux', 'frontend-motion'],
        synergyNote:
          'Zustandsbehaftete Ausführung im Backend mit inkrementellem SSE-Status-Streaming in die UI.',
      },
      {
        id: 'structured-tools',
        name: 'Structured Tool-Calling',
        role: 'Typed Contracts & Policy Guards',
        relationLabel: 'Orchestrates →',
        connectsTo: ['frontend-motion', 'backend-cloud-linux'],
        synergyNote:
          'Verhindert Halluzinationen an API-Grenzen durch strenge Typ- und Berechtigungsprüfungen.',
      },
      {
        id: 'otel-evals',
        name: 'OpenTelemetry & Eval Loops',
        role: 'Latency, Cost & Quality Traces',
        relationLabel: 'Traces →',
        connectsTo: ['backend-cloud-linux'],
        synergyNote:
          'Macht Token-Verbrauch, Tool-Latenzen und Regressions-Evals wie klassische System-Metriken messbar.',
      },
      {
        id: 'dev-automation',
        name: 'Workflow Automation',
        role: 'CI-Checks & Playtest Agents',
        relationLabel: 'Simulates →',
        connectsTo: ['gamedev-csharp', 'backend-cloud-linux'],
        synergyNote:
          'Automatisierte Balancing-Läufe, Build-Verifikation und wiederkehrende Linux-Wartungsaufgaben.',
      },
    ],
  },
  {
    id: 'gamedev-csharp',
    columnIndex: 3,
    index: '04',
    title: 'Game Engines & C#',
    subtitle: 'Realtime Simulation & Frame Pacing',
    summary:
      'Echtzeit-Simulationen in Unity/C# und WebGL mit Zero-Allocation-Hotpaths und präzisem Frame-Budgeting.',
    tone: 'amber',
    accentText: 'text-amber',
    accentBorder: 'border-amber/55',
    accentBg: 'bg-amber-soft',
    accentStroke: 'var(--accent-amber)',
    accentDot: 'bg-amber',
    philosophy:
      'Saubere Trennung von deterministischer Simulation und Präsentation: Zero-Allocation-Hotpaths, datengetriebene Architektur und Eingabe-Präzision.',
    invariant: '0 B GC Alloc im FixedUpdate-Hotpath',
    linkedPillars: ['frontend-motion', 'backend-cloud-linux', 'ai-workflows'],
    synergySummary:
      'Überträgt Echtzeit-Simulationsmuster, State-Machines und Frame-Budgeting direkt in interaktive Web-Interfaces und AI-Testumgebungen.',
    tools: [
      {
        id: 'unity-csharp',
        name: 'Unity & C# Architecture',
        role: 'ScriptableObjects & Event Buses',
        relationLabel: 'Feeds Sim →',
        connectsTo: ['ai-workflows'],
        synergyNote:
          'Entkoppelte Ability- und Gameplay-Graphen ermöglichen automatisierte Balance-Simulationen.',
      },
      {
        id: 'fixed-timestep',
        name: 'Fixed-Timestep Loops',
        role: 'Deterministic Physics & Buffering',
        relationLabel: 'Frame-Pacing →',
        connectsTo: ['frontend-motion'],
        synergyNote:
          'Sorgt für konstantes Frame-Pacing auf 60Hz–120Hz-Displays im Web wie in nativen Engines.',
      },
      {
        id: 'webgl-canvas',
        name: 'WebGL / HTML5 Canvas',
        role: 'Spatial Hash & DPR Rendering',
        relationLabel: 'Renders UI →',
        connectsTo: ['frontend-motion'],
        synergyNote:
          'Bringt hardwarebeschleunigte 2D/3D-Simulationen mit < 35 KB Footprint direkt in den Browser.',
      },
      {
        id: 'editor-tooling',
        name: 'Custom Editor & Profilers',
        role: 'Frame-Step & Hitbox Inspectors',
        relationLabel: 'Inspects →',
        connectsTo: ['frontend-motion', 'backend-cloud-linux'],
        synergyNote:
          'Teilt die gleiche Inspector-Philosophie wie der Architecture X-Ray Mode dieser Web-App.',
      },
    ],
  },
];
