'use client';

import { ArrowUp, Command, FileText, ScanEye, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { SiteConfig } from '@/config';
import { useCommandPalette } from '@/features/command-palette';
import { InspectableModule, useInspector } from '@/features/inspector';
import { MagneticButton } from '@/shared/components';
import { useSmoothScroll } from '@/shared/providers/smooth-scroll-provider';
import { Container } from '@/shared/ui/container';
import { LegalModal, type LegalDocumentType } from './legal-modal';

export interface ContactFooterProps {
  readonly site: SiteConfig;
}

/**
 * Engineering Footer with live System-Status indicator, German legal notice
 * modals (Impressum / Datenschutz), quick HUD controls, and Back-to-Top action.
 */
export function ContactFooter({ site }: ContactFooterProps) {
  const { open: openPalette } = useCommandPalette();
  const { isActive: isInspectorActive, toggle: toggleInspector } =
    useInspector();
  const { scrollTo } = useSmoothScroll();
  const [legalDoc, setLegalDoc] = useState<LegalDocumentType | null>(null);

  const currentYear = new Date().getFullYear();

  const handleBackToTop = (): void => {
    scrollTo(0, { duration: 0.9 });
    if (typeof document !== 'undefined') {
      const hero = document.getElementById('hero');
      if (hero instanceof HTMLElement) {
        hero.focus({ preventScroll: true });
      }
    }
  };

  return (
    <>
      <InspectableModule
        as="footer"
        name="ContactFooter"
        layer="Client // System Footer & Legal"
        renderMetric="Status + Legal Modals + Top"
        tone="client"
        className="border-t border-border-subtle bg-surface py-10"
      >
        <Container className="space-y-8">
          {/* Top Row: Identity, System Status & Quick Actions */}
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald-soft px-2.5 py-1 font-mono text-[11px] text-emerald">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60 motion-reduce:hidden" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
                  </span>
                  <span>System Operational</span>
                </span>
                <span className="font-mono text-xs text-ink-muted">
                  {site.owner.location} · {site.owner.timezone}
                </span>
              </div>

              <p className="font-mono text-xs font-medium text-ink">
                {site.owner.name} · {site.owner.role}
              </p>
              <p className="font-mono text-xs text-ink-muted">
                Obsidian &amp; Precision Slate · Next.js 15 App Router · Strict
                TypeScript
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <MagneticButton
                variant="secondary"
                size="sm"
                onClick={openPalette}
                ariaHaspopup="dialog"
                ariaLabel="Command Palette öffnen (⌘K)"
              >
                <Command
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-accent"
                />
                <span>Palette (⌘K)</span>
              </MagneticButton>

              <MagneticButton
                variant="ghost"
                size="sm"
                onClick={toggleInspector}
                ariaPressed={isInspectorActive}
                ariaLabel={
                  isInspectorActive
                    ? 'Architecture X-Ray deaktivieren'
                    : 'Architecture X-Ray aktivieren'
                }
              >
                <ScanEye
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-ink-muted"
                />
                <span>{isInspectorActive ? 'X-Ray An' : 'X-Ray'}</span>
              </MagneticButton>

              <MagneticButton
                variant="primary"
                size="sm"
                onClick={handleBackToTop}
                ariaLabel="Zurück nach oben scrollen"
              >
                <ArrowUp aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
                <span>Nach oben</span>
              </MagneticButton>
            </div>
          </div>

          {/* Bottom Bar: Copyright & German Legal Triggers */}
          <div className="flex flex-col items-start justify-between gap-4 border-t border-border-subtle pt-6 sm:flex-row sm:items-center">
            <p className="font-mono text-xs text-ink-muted">
              © {currentYear} {site.owner.name} (@{site.owner.handle}). Alle
              Rechte vorbehalten.
            </p>

            <nav
              aria-label="Rechtliche Hinweise"
              className="flex flex-wrap items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setLegalDoc('impressum')}
                aria-haspopup="dialog"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 font-mono text-xs text-ink-secondary transition-colors hover:border-border-subtle hover:bg-elevated hover:text-ink"
              >
                <FileText aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Impressum</span>
              </button>

              <button
                type="button"
                onClick={() => setLegalDoc('datenschutz')}
                aria-haspopup="dialog"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 font-mono text-xs text-ink-secondary transition-colors hover:border-border-subtle hover:bg-elevated hover:text-ink"
              >
                <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Datenschutz</span>
              </button>
            </nav>
          </div>
        </Container>
      </InspectableModule>

      <LegalModal
        documentType={legalDoc}
        site={site}
        onClose={() => setLegalDoc(null)}
      />
    </>
  );
}
