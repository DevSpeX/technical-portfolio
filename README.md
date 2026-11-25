# Florian — Engineering Portfolio (`florian-portfolio`)

Ein modular aufgebautes, performance- und architekturfokussiertes Entwickler-Portfolio im **Obsidian & Precision Slate** Design-System. Gebaut mit **Next.js 15 App Router**, **React 19**, **Strict TypeScript**, **Tailwind CSS v4**, **Motion**, **Lenis**, prozeduraler **Web Audio API** und einem Zero-Dependency **WebGL2 GLSL Topografie-Shader**.

> **Für den Architektur-Deep-Dive** (Feature-Sliced Design, neue Module, X-Ray Inspector, Command Palette, Audio-Synthese, GLSL-Uniforms & Design-Tokens) siehe [**`docs/ARCHITECTURE.md`**](./docs/ARCHITECTURE.md).  
> Eine kompakte Kurz-Checkliste liegt zusätzlich in [`CUSTOMIZATION.md`](./CUSTOMIZATION.md).

---

## Inhaltsverzeichnis

1. [Projekt-Übersicht & Tech-Stack](#1-projekt-übersicht--tech-stack)
2. [Lokales Setup & Scripts](#2-lokales-setup--scripts)
3. [Pflicht-Konfiguration (Live- & Personalisierungs-Checkliste)](#3-pflicht-konfiguration-live--personalisierungs-checkliste)
   - [3.1 Persönliche Daten, Links & Rechtliches (`src/config/site.config.ts`)](#31-persönliche-daten-links--rechtliches-srcconfigsiteconfigts)
   - [3.2 GitHub Live-Telemetry einrichten](#32-github-live-telemetry-einrichten)
   - [3.3 Eigene Projekte & Case Studies einpflegen (`src/config/projects.config.ts`)](#33-eigene-projekte--case-studies-einpflegen-srcconfigprojectsconfigts)
   - [3.4 Kontaktformular scharfschalten (`src/features/contact/`)](#34-kontaktformular-scharfschalten-srcfeaturescontact)
4. [Deployment-Guide (Vercel & Docker / Self-Hosted)](#4-deployment-guide-vercel--docker--self-hosted)
   - [4.1 Vercel (Empfohlen — Next.js Server-Runtime, Server Actions & ISR)](#41-vercel-empfohlen--nextjs-server-runtime-server-actions--isr)
   - [4.2 Docker & Self-Hosted Linux-Server](#42-docker--self-hosted-linux-server)
   - [4.3 Security Headers & CSP (`next.config.ts`)](#43-security-headers--csp-nextconfigts)

---

## 1. Projekt-Übersicht & Tech-Stack

Das Portfolio ist als **Single-Source-of-Truth-Architektur** konzipiert: Sämtliche persönlichen Daten, Projekte, SEO-Metadaten, JSON-LD-Schemas (`Person`, `ProfilePage`, `SoftwareSourceCode`), `sitemap.xml`, `robots.txt` und die globale Command Palette werden aus zwei zentralen Konfigurationsdateien unter `src/config/` gespeist.

| Technologie | Version (`package.json`) | Einsatzbereich im Projekt | Warum diese Architektur-Entscheidung? |
| :--- | :--- | :--- | :--- |
| **Next.js App Router** | `15.5.29` | Routing, React Server Components (RSC), `<Suspense>` Streaming, ISR, Server Actions, Metadata/Sitemap | Minimiert den Client-JS-Footprint: GitHub-Telemetrie wird serverseitig mit ISR geladen; Kontaktversand läuft ohne separaten API-Boilerplate direkt über eine Server Action. |
| **React** | `19.3.1` | UI-Komponenten, `useTransition`, `useSyncExternalStore`, `createPortal` | Native Unterstützung für asynchrone Server Actions (`useTransition`) und saubere Hydration ohne Mismatches. |
| **TypeScript (Strict)** | `5.9.3` | Gesamte Codebasis (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`) | Verhindert Laufzeitfehler an Array-/Map-Zugriffen und erzwingt eindeutige Domain-Grenzen zwischen Config, Features und Shared-Layer. |
| **Tailwind CSS v4** | `^4.3.5` | Utility-First Styling mit `@theme inline` Design-Tokens in `src/app/globals.css` | Zero-Runtime-CSS und direkte Bindung von CSS Custom Properties (`--surface-*`, `--accent-*`, `--text-*`) an Tailwind-Utilities. |
| **Motion (`motion/react`)** | `^14.14.0` | Kalibrierte Spring-Transitions (`SPRINGS`), `AnimatePresence`, `MotionConfig reducedMotion="user"` | Physikalisch abgestimmte, reduzierte Motion-Springs ohne unruhiges Overshoot; respektiert automatisch OS-weite `prefers-reduced-motion`-Einstellungen. |
| **Lenis** | `^1.3.28` | Smooth Wheel Scrolling (`SmoothScrollProvider`) | Seidenweiches Scroll-Verhalten mit automatischer Deaktivierung bei `prefers-reduced-motion`, Scroll-Pause bei offenen Modals (`CommandPalette`) und `data-lenis-prevent` in Drawern. |
| **Web Audio API** | Browser-nativ | Prozedurale UI-Sound-Synthese (`src/features/audio-engine/`) | **Zero Audio Assets:** Keine MP3/WAV-Netzwerklasten; subtile Hardware-Impulse entstehen in Echtzeit über Oszillatoren, Rauschpuffer und Biquad-Filter (standardmäßig stumm/Opt-in). |
| **WebGL2 GLSL ES 3.00** | Browser-nativ | Interaktiver Topografie-Hintergrund (`TelemetryShaderCanvas`) | **Zero Three.js Bloat:** Ein einziger bufferloser Full-Screen-Triangle-Shader (~580 Zeilen) mit `IntersectionObserver`-Culling, Tab-Visibility-Pause und reinem CSS-Fallback. |
| **Native Top-Layer APIs** | HTML/CSS | `<dialog>` (`CaseStudyDrawer`, `CommandPalette`, `LegalModal`) & `[popover]` (`ToastProvider`) | Nutzt den nativen Browser-Top-Layer inkl. `::backdrop`, `@starting-style`, `overscroll-behavior: contain` und `closedby="any"` (mit Safari-Fallback) statt schwerer Modal-Libraries. |

---

## 2. Lokales Setup & Scripts

### Voraussetzungen
- **Node.js:** v20.x LTS oder v22.x LTS (empfohlen)
- **npm:** v10+ (mitgeliefert mit Node.js)

### Schritt-für-Schritt-Start

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Lokale Umgebungsvariablen anlegen
cp .env.example .env.local
# Inhalte für .env.local siehe Abschnitt 3.2 und 3.4

# 3. Development-Server mit Turbopack starten
npm run dev
```

Die Anwendung läuft anschließend unter `http://localhost:3000`.

### Verfügbare npm-Scripts

| Script | Ausgeführter Befehl | Beschreibung |
| :--- | :--- | :--- |
| `npm run dev` | `next dev --turbopack` | Startet den lokalen Dev-Server mit Turbopack und relaxter Dev-CSP (`'unsafe-eval'`). |
| `npm run build` | `next build` | Erstellt den optimierten Production-Build inkl. TypeScript-Prüfung, App-Router-Bundling und statischem Pre-Rendering. |
| `npm run start` | `next start` | Startet den produktiven Node-Server auf Basis von `.next/` (vorher `npm run build` ausführen). |
| `npm run lint` | `next lint` | Prüft Codequalität und Next.js/React-Regeln über ESLint. |
| `npm run typecheck` | `tsc --noEmit` | Führt einen reinen, strikten TypeScript-Check ohne Build-Artefakte aus. |
| `npm run deploy:preview` | `npx vercel` | Erstellt ein Vercel Preview-Deployment direkt aus der CLI. |
| `npm run deploy:prod` | `npx vercel --prod` | Deployed den aktuellen Stand produktiv auf Vercel. |

---

## 3. Pflicht-Konfiguration (Live- & Personalisierungs-Checkliste)

Vor dem Go-Live solltest du alle `TODO:`-Markierungen in **`src/config/site.config.ts`** und **`src/config/projects.config.ts`** ersetzen.

### 3.1 Persönliche Daten, Links & Rechtliches (`src/config/site.config.ts`)

Öffne `src/config/site.config.ts` und passe die sechs Hauptblöcke von `SITE_CONFIG` an:

1. **`owner` (Identität & Kontaktbasis):**
   - `name`, `handle`, `role`, `headline`, `subheadline`, `location`, `timezone`: Steuern Hero-Text, Footer, JSON-LD `Person`-Node und die Command Palette.
   - `availabilityStatus` (`'available' | 'selective' | 'unavailable'`) & `availabilityLabel`: Steuern das Status-Badge im Hero und Kontaktbereich.
   - `githubUsername`: Dein GitHub-Handle **ohne `@`** (z. B. `'devsoon'`). Details zur Telemetrie in Abschnitt 3.2.
   - `email`: Deine echte Kontaktadresse. Wird für `mailto:`-Links, One-Click-Copy, Command Palette und als Standard-Empfänger des Kontaktformulars genutzt. *(Hinweis: Adressen mit `.invalid` blockieren aus Sicherheitsgründen den Live-Mailversand.)*

2. **`metadata` (SEO, OpenGraph & Canonical URL):**
   - `siteUrl`: Deine produktive HTTPS-Domain (z. B. `'https://deine-domain.de'`). Wird automatisch für `metadataBase`, Canonical URLs, JSON-LD, `src/app/sitemap.ts` und `src/app/robots.ts` verwendet.
   - `title`, `titleTemplate`, `description`, `locale`, `keywords`: Klassische Head- und OpenGraph-Metadaten.
   - `ogImage`: Pfad zum Vorschaubild (Standard: `'/og-image.png'`). Lege eine Datei `public/og-image.png` mit exakt **`1200×630 px`** (Seitenverhältnis `1.91:1`) im `public/`-Ordner ab.
   - `twitterHandle`: Dein `@handle` für Twitter/X Cards. (Solange `PLACEHOLDER_` enthalten ist, blendet `src/app/layout.tsx` `twitter:creator` automatisch aus.)

3. **`legal` (Pflichtangaben für Impressum & Datenschutz):**
   - `ownerFullName`, `streetAddress`, `postalCity`, `country`, `email`, `vatNote`.
   - Diese Werte speisen direkt die Modal-Dialoge **Impressum** (§ 5 DDG) und **Datenschutzerklärung** (DSGVO) in `src/features/contact/legal-modal.tsx`.

4. **`socials` (Kanäle & One-Click-Copy):**
   - Pflege `handle`, `href` und optional `copyValue` für `github`, `linkedin`, `discord`, `x`, `website` und `email`.
   - Wenn `copyValue` gesetzt ist (z. B. beim Discord-Handle oder der E-Mail), wird beim Klick auf „Kopieren“ exakt dieser Wert in die Zwischenablage übernommen statt der vollen URL.
   - Externe Socials werden zusätzlich als Aktionen in die Command Palette (`⌘K`) und als `sameAs`-Links in die JSON-LD-Strukturdaten aufgenommen (Platzhalter mit `example.invalid` oder `PLACEHOLDER_` werden aus JSON-LD herausgefiltert).

5. **`navigation` & `skillDomains`:**
   - `navigation` definiert die Sektions-Links (`01`–`05`) für die schwebende Navigation (`FloatingDockNav`) und die Command Palette.
   - `skillDomains` definiert die 3 Kern-Domänen (`fullstack-ai`, `linux-oss`, `gamedev-interactive`), aus denen sowohl der Hero-Bereich als auch die Filter-Befehle in der Command Palette generiert werden.

---

### 3.2 GitHub Live-Telemetry einrichten

Die Live-Telemetrie wird durch die Server Component `GitHubTelemetrySection` (`src/features/github-telemetry/github-telemetry-section.tsx`) gesteuert und via `<Suspense>` auf der Startseite gestreamt.

#### 1. GitHub-Username hinterlegen
Trage in `src/config/site.config.ts` unter `SITE_CONFIG.owner.githubUsername` deinen echten Benutzernamen ein:

```ts
owner: {
  // ...
  githubUsername: 'dein-github-username', // ohne @
}
```

#### 2. Wie das ISR-Caching (`revalidate`) und das Commit-Enrichment funktionieren
In `src/features/github-telemetry/api/github.ts` ruft `fetchGitHubTelemetry()` parallel drei GitHub-REST-Endpunkte ab:
- `https://api.github.com/users/<username>`
- `https://api.github.com/users/<username>/repos?sort=updated&per_page=100`
- `https://api.github.com/users/<username>/events/public?per_page=30`

Alle Requests nutzen Next.js Data Cache mit **Incremental Static Regeneration (ISR)**:
```ts
next: { revalidate: 3600 } // REVALIDATE_SECONDS = 3600 (1 Stunde)
```
Das bedeutet:
- Besucher lösen **keine** direkten Client-Requests gegen die GitHub API aus.
- Antworten werden serverseitig für **3.600 Sekunden (1 Stunde)** gecacht und danach im Hintergrund revalidiert.
- Es werden **alle** öffentlichen Repositories (inkl. Forks und Repos ohne Beschreibung oder mit `0` Stars) erfasst und dargestellt.
- Für den Tab **Live Commit Activity** werden `PushEvent`-Commits automatisch über `/repos/<full_name>/commits?per_page=5` angereichert, sodass auch bei leeren Event-Commit-Arrays garantiert echte Commit-Messages im Git-Timeline-Terminal erscheinen.

#### 3. Optional: `GITHUB_TOKEN` in `.env.local` hinterlegen
Ohne Authentifizierung limitiert GitHub die REST API auf **60 Requests/Stunde pro IP** (auf Shared-Hosting-IPs wie Vercel schnell erreicht). Mit einem Personal Access Token steigt das Limit auf **5.000 Requests/Stunde**:

1. Erstelle auf GitHub unter **Settings → Developer settings → Personal access tokens → Fine-grained tokens** einen Token mit **Public Repositories (read-only)** Zugriff (ohne Write-Scopes).
2. Hinterlege ihn in `.env.local` (im Projekt-Root, wird von `.gitignore` ignoriert):

```env
GITHUB_TOKEN=github_pat_dein_token_hier
```

`fetchGitHubTelemetry()` liest `process.env.GITHUB_TOKEN` automatisch aus und setzt `Authorization: Bearer <token>`.

#### 4. Wie der Fallback-Mock-Layer greift
Die Funktion `createFallbackTelemetry(reason)` in `src/features/github-telemetry/api/github.ts` garantiert, dass die Seite **niemals** mit einem API-Fehler abstürzt. Der deterministische Fallback greift automatisch, wenn:
- `githubUsername` leer ist, Leerzeichen enthält oder auf `PLACEHOLDER` / `INSERT_LINK` lautet,
- GitHub mit HTTP `403` oder `429` (Rate-Limit) antwortet,
- ein sonstiger HTTP-Fehler (`!userRes.ok || !reposRes.ok`) auftritt,
- der Account noch keine öffentlichen Repositories besitzt,
- oder ein Netzwerk-/Timeout-Fehler im `try/catch` abgefangen wird.

Im UI wird der Status transparent über die Badge **„Live API“** (Emerald) vs. **„Fallback Telemetry“** (Amber) angezeigt.

---

### 3.3 Eigene Projekte & Case Studies einpflegen (`src/config/projects.config.ts`)

Alle Projekte werden im Array `PROJECTS` in `src/config/projects.config.ts` gepflegt. Daraus generiert die Anwendung automatisch das **Asymmetric Bento Grid** (`ProjectsSection`), die interaktiven **Case-Study Drawer** (`#case-study/<slug>`) sowie `SoftwareSourceCode`-Einträge im JSON-LD-Schema.

#### Vollständige Feld-Referenz (`ProjectItem`)

| Feld | Typ | Pflicht | Beschreibung & Auswirkung |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Ja | Eindeutige interne ID und React/Motion-`key` (z. B. `'aegis-orchestrator'`). |
| `slug` | `string` | Ja | URL-Hash-Identifier für Deep-Links (`#case-study/<slug>`). |
| `title` | `string` | Ja | Projekttitel auf der Bento-Card und im Case-Study Drawer. |
| `tagline` | `string` | Ja | Prägnanter Einzeiler (auch als JSON-LD-`description` genutzt). |
| `description` | `string` | Ja | Ausführliche Projektbeschreibung im geöffneten Case-Study Drawer. |
| `problemStatement` | `string` | Ja | Technische Ausgangsproblematik („Problemstellung“-Block im Drawer). |
| `category` | `'fullstack-ai' \| 'linux-oss' \| 'gamedev-interactive'` | Ja | Steuert die Kategorie-Filter-Pills sowie die Spotlight-Farbe (`cobalt`, `emerald`, `amber`). |
| `status` | `'production' \| 'active-development' \| 'open-source' \| 'prototype'` | Ja | Status-Badge oben rechts auf der Karte und im Drawer-Header. |
| `featured` | `boolean` | Ja | Zeigt das `Featured`-Badge auf der Karte an und exportiert das Projekt ins JSON-LD-Markup. |
| `year` | `number` | Ja | Entwicklungs-/Release-Jahr (z. B. `2026`). |
| `role` | `string` | Ja | Deine Rolle im Projekt (z. B. `'Lead Architect & Full-Stack Engineer'`). |
| `techStack` | `readonly string[]` | Ja | Technologie-Tags (die ersten 4 erscheinen im Card-Footer, alle im Drawer). |
| `highlights` | `readonly string[]` | Ja | Bullet-Liste zentraler technischer Errungenschaften im Drawer. |
| `keyLearnings` | `readonly string[]` | Ja | Architektur-Erkenntnisse („Key-Learnings“-Sektion im Drawer). |
| `architecture` | `readonly { layer: string; detail: string }[]` | Ja | Architektur-Schichten. Auf breiten Bento-Cards (7 oder 12 Spalten) werden die ersten 2 Layer direkt als Vorschau gerendert. |
| `metrics` | `readonly { label: string; value: string }[]` | Ja | Messbare KPIs (z. B. `{ label: 'Tick Stability', value: '16.6 ms lock' }`). Auf schmalen Cards (5 Spalten) direkt sichtbar, sonst im Drawer. |
| `coverImage` | `string` *(optional)* | Nein | Pfad zu einem Projekt-Visual relativ zu `public/` (z. B. `'/projects/mein-projekt.webp'`). |
| `links` | `{ repository?, repoSlug?, live?, documentation? }` | Ja | Externe Ziel-URLs im Drawer-Footer. URLs mit `example.invalid` oder `PLACEHOLDER_` werden als Preview-Buttons gekennzeichnet und nicht ins JSON-LD übernommen. |

#### Projektbilder ablegen & einbinden (`/public/projects/`)

In Next.js werden alle statischen Assets aus dem Ordner `public/` unter der Root-URL `/` ausgeliefert.
1. Lege den Ordner `public/projects/` an (oder alternativ `public/images/projects/`, falls du dem Kommentar in `projects.config.ts` folgst) und speichere deine Bilder dort, z. B.:
   ```
   public/projects/aegis-orchestrator.webp
   public/og-image.png
   ```
2. Referenziere den Pfad **ohne** `/public`-Präfix in `projects.config.ts`:
   ```ts
   coverImage: '/projects/aegis-orchestrator.webp',
   ```

**Empfohlene Bildformate & Seitenverhältnisse:**
- **Format:** **WebP** oder **AVIF** (alternativ verlustfreies PNG für UI-Screenshots; `next.config.ts` liefert via `next/image` automatisch `image/avif` und `image/webp` aus).
- **Projekt-Cover (`coverImage`):** **`16:9`** (z. B. `1600×900 px` oder `1280×720 px`), max. ~200–350 KB für schnelle Ladezeiten.
- **OpenGraph-Teaser (`public/og-image.png`):** **`1.91:1`** (`1200×630 px`) für saubere Darstellung auf LinkedIn, X, Discord und Slack.

> **Hinweis zum aktuellen UI-Stand:** `coverImage` ist bereits typisiert in `ProjectItem` definiert, wird aber in der Standard-Auslieferung von `CaseStudyDrawer` noch nicht gerendert (Fokus auf Text- & Architektur-Metriken). Um `coverImage` im `CaseStudyDrawer` (`src/features/projects/case-study-drawer.tsx`) anzuzeigen, importiere `Image` aus `'next/image'` und füge im Scroll-Body z. B. Folgendes ein:
> ```tsx
> {project.coverImage ? (
>   <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
>     <Image
>       src={project.coverImage}
>       alt={`Architektur- und UI-Vorschau von ${project.title}`}
>       width={1600}
>       height={900}
>       className="aspect-video w-full object-cover"
>     />
>   </div>
> ) : null}
> ```

---

### 3.4 Kontaktformular scharfschalten (`src/features/contact/`)

Das Quick-Dispatch-Formular (`src/features/contact/contact-section.tsx`) sendet seine Daten direkt an die Next.js Server Action `sendContactEmail()` in `src/features/contact/actions/sendContactEmail.ts`.

#### Wie die Server Action arbeitet
1. **Honeypot-Schutz:** Ein unsichtbares Feld `company_website` fängt Bots ab und gibt scheinbar erfolgreich `DSP-ACCEPTED` zurück, ohne eine E-Mail auszulösen.
2. **Zod-Validierung:** Prüft `name` (2–100 Zeichen), `email` (gültiges E-Mail-Format, max. 160 Zeichen), `topic` (`'architecture' | 'ai-pipeline' | 'gamedev' | 'general'`) und `message` (15–2000 Zeichen).
3. **Echter Versand via Resend (`Reply-To` auf Absender):** Sendet strukturierte Text- und HTML-Mails an `CONTACT_TO_EMAIL` bzw. `SITE_CONFIG.owner.email` aus `src/config/site.config.ts` und liefert eine generierte Ticket-ID (`DSP-XXXXXX`) zurück.
4. **Klare Setup-Fehlermeldung:** Fehlen `RESEND_API_KEY` oder `CONTACT_FROM_EMAIL` lokal in `.env.local`, gibt die Server Action eine explizite Setup-Fehlermeldung (`CONFIG_MISSING`) zurück statt eines Dummy-Erfolgs.

#### Pflicht-Konfiguration in `.env.local` (siehe `.env.example`)
1. Lege ein Konto bei [Resend](https://resend.com) an und erstelle einen API-Key.
2. **Wichtige Resend-Absender-Regel:** Freemail-Adressen wie `@yahoo.de`, `@icloud.com` oder `@gmail.com` können **nicht** als Absender (`CONTACT_FROM_EMAIL`) verwendet werden — Resend lehnt sie mit *domain is not verified* ab.
   - **Ohne eigene Domain (Testbetrieb):** Nutze `CONTACT_FROM_EMAIL="Portfolio Dispatch <onboarding@resend.dev>"`. Dabei darf als Empfänger (`CONTACT_TO_EMAIL`) ausschließlich die E-Mail-Adresse eingetragen sein, mit der dein Resend-Konto registriert ist.
   - **Für freien Live-Versand an beliebige Adressen:** Verifiziere unter **Resend → Domains** deine eigene Domain (SPF/DKIM) und trage z. B. `CONTACT_FROM_EMAIL="Portfolio Dispatch <dispatch@deine-domain.de>"` ein.
3. Kopiere `.env.example` nach `.env.local` und trage die Variablen ein:

```env
RESEND_API_KEY=re_dein_api_key
CONTACT_FROM_EMAIL="Portfolio Dispatch <onboarding@resend.dev>"
# Optional (Standard ist SITE_CONFIG.owner.email aus site.config.ts):
# Im Resend-Testmodus (onboarding@resend.dev) muss dies deine Resend-Account-Mail sein:
CONTACT_TO_EMAIL="deine-resend-account-mail@domain.de"
```

#### Option B: Eigenen SMTP-Server anschließen (z. B. Nodemailer)
Falls du beim Self-Hosting deinen eigenen Mailserver statt Resend nutzen möchtest:
1. Installiere Nodemailer:
   ```bash
   npm install nodemailer
   npm install -D @types/nodemailer
   ```
2. Ersetze in `src/features/contact/actions/sendContactEmail.ts` den Resend-Versandblock durch deinen `nodemailer.createTransport(...)`-Aufruf und lies `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` und `SMTP_PASS` aus `process.env`.

---

## 4. Deployment-Guide (Vercel & Docker / Self-Hosted)

### 4.1 Vercel (Empfohlen — Next.js Server-Runtime, Server Actions & ISR)

Da das Kontaktformular eine echte Next.js **Server Action** (`sendContactEmail` mit Zod & Resend) und die GitHub-Telemetrie **ISR (`revalidate: 3600`)** nutzt, ist **Vercel** die optimale Zielplattform (kostenloser Hobby-Plan, automatisches HTTPS, native `next/image`-Optimierung und EU-Region `fra1` via [`vercel.json`](./vercel.json)).

#### Weg A: Über GitHub + Vercel Dashboard (Empfohlen — Auto-Deploy bei jedem Push)
1. **Auf GitHub pushen** (lokales Git-Repo mit Branch `main` ist bereits initialisiert, `.env.local` wird durch `.gitignore` geschützt):
   ```bash
   git add .
   git commit -m "feat: portfolio ready for vercel"
   git remote add origin https://github.com/DevSpeX/<dein-repo>.git
   git push -u origin main
   ```
2. **In Vercel importieren:** Auf [vercel.com/new](https://vercel.com/new) das Repository auswählen (Framework-Preset **Next.js** und Region **Frankfurt `fra1`** aus `vercel.json` werden automatisch erkannt).
3. **Environment Variables hinterlegen** (*Project Settings → Environment Variables*, für *Production* & *Preview*):

| Variable | Pflicht | Wert / Hinweis |
| :--- | :--- | :--- |
| `RESEND_API_KEY` | Ja | Dein API-Key aus dem Resend Dashboard (`re_...`) |
| `CONTACT_FROM_EMAIL` | Ja | `"Portfolio Dispatch <onboarding@resend.dev>"` oder deine verifizierte Domain |
| `CONTACT_TO_EMAIL` | Optional | Empfänger-Mail (im `onboarding@resend.dev`-Testmodus deine Resend-Account-Mail; sonst `SITE_CONFIG.owner.email`) |
| `GITHUB_TOKEN` | Empfohlen | Fine-grained GitHub Token (Public read-only) für 5.000 Req/h statt 60 Req/h |
| `NEXT_PUBLIC_SITE_URL` | Optional | Nur bei eigener Custom-Domain nötig (sonst automatisch `VERCEL_PROJECT_PRODUCTION_URL`) |

4. **Deploy auslösen:** Auf **Deploy** klicken — fertig. Jeder spätere `git push` aktualisiert die Live-Seite automatisch.

#### Weg B: Direkt per Vercel CLI
```bash
npx vercel login
npm run deploy:prod
# Danach im Vercel Dashboard die Environment Variables setzen (oder via `npx vercel env add <NAME>`) und erneut `npm run deploy:prod` ausführen.
```

### 4.2 Docker & Self-Hosted Linux-Server

Für den Betrieb auf einem eigenen Linux-VPS (z. B. hinter Caddy, Nginx oder Traefik als HTTPS-Reverse-Proxy) empfiehlt sich Next.js Standalone-Output:

1. **In `next.config.ts` aktivieren:**
   Ergänze im `nextConfig`-Objekt:
   ```ts
   output: 'standalone',
   ```

2. **Multi-Stage `Dockerfile` im Projekt-Root anlegen:**
   ```dockerfile
   FROM node:22-alpine AS base

   FROM base AS deps
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci

   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   ENV PORT=3000
   ENV HOSTNAME=0.0.0.0

   RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

3. **Container bauen & starten:**
   ```bash
   docker build -t florian-portfolio .
   docker run -d \
     --name florian-portfolio \
     --restart unless-stopped \
     -p 127.0.0.1:3000:3000 \
     --env-file .env.local \
     florian-portfolio
   ```
   *(Hinweis: Falls `public/` noch leer ist, lege vor dem `docker build` mindestens `public/og-image.png` ab, damit `COPY --from=builder /app/public` nicht fehlschlägt.)*

### 4.3 Security Headers & CSP (`next.config.ts`)

`next.config.ts` setzt für alle Routen (`/:path*`) strikte HTTP-Security-Header und deaktiviert `X-Powered-By` (`poweredByHeader: false`):

- **`Content-Security-Policy`:**
  - `default-src 'self'`, `object-src 'none'`, `frame-src 'none'`, `frame-ancestors 'none'`, `base-uri 'none'`, `form-action 'self'`
  - `script-src 'self' 'unsafe-inline'` (im Dev-Mode zusätzlich `'unsafe-eval'`)
  - `img-src 'self' data: blob: https://avatars.githubusercontent.com https://raw.githubusercontent.com`
  - `connect-src 'self' https://api.github.com`
  - `upgrade-insecure-requests` (nur wenn `NODE_ENV === 'production'`)
- **Weitere Header:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (deaktiviert Kamera, Mikrofon, Geolocation, Payment, USB), `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `Cross-Origin-Resource-Policy: same-origin` und in Production `Strict-Transport-Security` (1 Jahr inkl. Subdomains & Preload).

> **Wichtig bei Erweiterungen:** Wenn du später externe Analytics (z. B. Plausible/Umami), ein externes CDN für Bilder oder zusätzliche APIs einbindest, musst du die entsprechenden Domains in `buildContentSecurityPolicy()` (`connect-src`, `script-src`, `img-src`) sowie ggf. in `images.remotePatterns` in `next.config.ts` freischalten.
