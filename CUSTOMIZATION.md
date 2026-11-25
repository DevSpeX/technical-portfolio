# Portfolio Customization Guide

Alle persönlichen Inhalte, Links, Socials, Rechtliches-Angaben, Projekte und Bildpfade sind zentral in **genau 2 Konfigurationsdateien** gekapselt. Alle Sektionen, SEO-Metadaten, JSON-LD-Schemas, Sitemap, Robots, Command Palette (`⌘K`) und die GitHub Telemetry Engine lesen direkt aus diesen beiden Dateien.

---

## 1. Persönliche Daten, Links, GitHub-Username & Bilder: `src/config/site.config.ts`

Suche in [`src/config/site.config.ts`](src/config/site.config.ts) nach `TODO:` und ersetze folgende Bereiche:

| Bereich / Feld | Zweck |
| --- | --- |
| `owner.githubUsername` | **Dein GitHub-Username** (ohne `@`). Sobald ein echter Username eingetragen ist, schaltet die GitHub Telemetry Engine automatisch vom Fallback-Modus auf Live-Daten der GitHub REST API (ISR `3600s`) um. |
| `owner.email` | Deine direkte Kontakt-E-Mail-Adresse (One-Click-Copy, `mailto:`-Link, Command Palette & Standard-Empfänger für das Quick-Dispatch-Formular). |
| `owner.availabilityStatus` / `availabilityLabel` | Status-Badge im Hero & Kontaktbereich (`'available' \| 'selective' \| 'unavailable'`). |
| `metadata.siteUrl` | Wird automatisch über `NEXT_PUBLIC_SITE_URL` bzw. Vercels `VERCEL_PROJECT_PRODUCTION_URL` aufgelöst (für `metadataBase`, Canonical URL, OpenGraph, JSON-LD, `sitemap.xml` und `robots.txt`). |
| `metadata.ogImage` | Pfad zum OpenGraph-/Twitter-Vorschaubild (`1200×630 px`). Lege die Bilddatei unter `public/og-image.png` ab (oder passe den Pfad hier an). |
| `metadata.twitterHandle` | Optionales X/Twitter-Handle für `twitter:creator`. |
| `socials[]` | Deine Links & Handles für **GitHub**, **LinkedIn**, **Discord**, **X / Twitter**, **Website/Docs** und **Direct Mail**. Das Feld `copyValue` steuert, was beim One-Click-Copy in die Zwischenablage kopiert wird (z. B. Discord-Handle oder E-Mail). |
| `legal` | Pflichtangaben für den deutschen Markt (**Impressum** gemäß § 5 DDG & **Datenschutzerklärung** gemäß DSGVO): `ownerFullName`, `streetAddress`, `postalCity`, `country`, `email`, `vatNote`. |

---

## 2. Projekte, Case-Studies & Projektbilder: `src/config/projects.config.ts`

Pflege in [`src/config/projects.config.ts`](src/config/projects.config.ts) das Array `PROJECTS`:

| Feld | Beschreibung |
| --- | --- |
| `id`, `slug`, `title`, `tagline`, `description` | Basisdaten für Bento-Card und URL-Hash (`#case-study/<slug>`). |
| `category` | Steuert Filter & Akzentfarbe: `'fullstack-ai'` (Cobalt), `'linux-oss'` (Emerald) oder `'gamedev-interactive'` (Amber). |
| `status`, `featured`, `year`, `role` | Status-Badge (`'production' \| 'active-development' \| 'open-source' \| 'prototype'`) und Featured-Markierung (wird u. a. im JSON-LD-Schema exportiert). |
| `problemStatement`, `architecture[]`, `highlights[]`, `keyLearnings[]`, `metrics[]`, `techStack[]` | Inhalte des interaktiven Case-Study-Drawers. |
| `coverImage` *(optional)* | Pfad zu einem Projektbild unter `public/images/projects/<slug>.png` (z. B. `'/images/projects/voidstation.png'`). |
| `links.repository` / `links.repoSlug` | GitHub-Repository-URL und `owner/repo`-Slug. |
| `links.live` / `links.documentation` | Optionale Live-Demo- und Dokumentations-URLs. |

---

## 3. Umgebungsvariablen (`.env.local` & Vercel)

Für den Live-E-Mail-Versand via Resend und höhere GitHub-API-Rate-Limits lege im Root-Verzeichnis eine `.env.local` an (Vorlage: [`.env.example`](.env.example)):

```env
# Quick-Dispatch Kontaktformular (Resend)
RESEND_API_KEY=re_xxxxxxxxx
# Wichtig: Keine Freemail-Domains (@yahoo.de/@icloud.com) als Absender nutzen!
# Ohne eigene verifizierte Domain zwingend `onboarding@resend.dev` verwenden:
CONTACT_FROM_EMAIL="Portfolio Dispatch <onboarding@resend.dev>"
# Im Testmodus mit onboarding@resend.dev muss dies deine Resend-Account-Mail sein:
CONTACT_TO_EMAIL="deine-resend-account-mail@domain.de"

# Optional: Erhöht das GitHub REST API Rate-Limit (5.000 Req/h statt 60 Req/h)
GITHUB_TOKEN=ghp_xxxxxxxxx
```

Ohne `RESEND_API_KEY` oder `CONTACT_FROM_EMAIL` meldet die Server Action sauber einen Setup-Hinweis (`CONFIG_MISSING`). Für Produktion auf Vercel die gleichen Variablen unter **Project Settings → Environment Variables** hinterlegen.
