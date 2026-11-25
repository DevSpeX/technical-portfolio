'use client';

import { FileText, ShieldCheck, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import type { SiteConfig } from '@/config';

export type LegalDocumentType = 'impressum' | 'datenschutz';

export interface LegalModalProps {
  readonly documentType: LegalDocumentType | null;
  readonly site: SiteConfig;
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

/**
 * Accessible native `<dialog>` modal for German legal notices
 * (Impressum gemäß § 5 DDG & Datenschutzerklärung gemäß DSGVO).
 */
export function LegalModal({ documentType, site, onClose }: LegalModalProps) {
  const isClient = useIsClient();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  const closeDialog = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog && dialog.open) {
      dialog.close();
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (documentType) {
      if (!dialog.open) {
        dialog.showModal();
      }
      window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [documentType]);

  // Safari fallback for `closedby="any"`: require press + release outside dialog bounds
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) {
      return;
    }

    const isOutside = (event: PointerEvent): boolean => {
      const rect = dialog.getBoundingClientRect();
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      );
    };

    let pressedOutside = false;

    const handlePointerDown = (event: PointerEvent): void => {
      pressedOutside = isOutside(event);
    };

    const handlePointerUp = (event: PointerEvent): void => {
      if (pressedOutside && isOutside(event)) {
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

  if (!isClient) {
    return null;
  }

  const closedByProps: Record<string, string> = { closedby: 'any' };
  const isImpressum = documentType === 'impressum';

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={() => {
        if (dialogRef.current) {
          dialogRef.current.returnValue = '';
        }
        onClose();
      }}
      className="legal-modal-dialog"
      {...closedByProps}
    >
      {documentType ? (
        <div className="flex max-h-[min(42rem,calc(100dvh-2.5rem))] w-full flex-col overflow-hidden rounded-2xl border border-border bg-elevated/98 text-ink shadow-[0_24px_80px_-16px_rgba(0,0,0,0.88)] backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent">
                {isImpressum ? (
                  <FileText aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald" />
                )}
              </span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                  {isImpressum ? 'Angaben gemäß § 5 DDG' : 'DSGVO · Art. 13'}
                </p>
                <h1
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-ink sm:text-xl"
                >
                  {isImpressum ? 'Impressum' : 'Datenschutzerklärung'}
                </h1>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeDialog}
              aria-label={
                isImpressum
                  ? 'Impressum schließen'
                  : 'Datenschutzerklärung schließen'
              }
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div
            data-lenis-prevent
            className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 text-sm leading-relaxed text-ink-secondary sm:px-6"
          >
            {isImpressum ? (
              <>
                <div className="rounded-xl border border-amber/30 bg-amber-soft px-4 py-3 font-mono text-xs text-amber">
                  Hinweis: Platzhalter für den deutschen Markt — bitte vor Livegang in{' '}
                  <code className="text-ink">src/config/site.config.ts</code> unter{' '}
                  <code className="text-ink">legal</code> mit deinen realen Daten
                  ausfüllen.
                </div>

                <section aria-label="Verantwortliche Person">
                  <h2 className="font-mono text-xs uppercase tracking-wider text-ink">
                    Verantwortlich für den Inhalt (§ 5 DDG / § 18 Abs. 2 MStV)
                  </h2>
                  <address className="mt-2 not-italic text-ink-secondary">
                    <p className="font-medium text-ink">
                      {site.legal.ownerFullName}
                    </p>
                    <p>{site.legal.streetAddress}</p>
                    <p>{site.legal.postalCity}</p>
                    <p>{site.legal.country}</p>
                  </address>
                </section>

                <section aria-label="Kontaktinformationen">
                  <h2 className="font-mono text-xs uppercase tracking-wider text-ink">
                    Kontakt
                  </h2>
                  <p className="mt-1.5">
                    E-Mail:{' '}
                    <a
                      href={`mailto:${site.legal.email}`}
                      className="font-mono text-xs text-accent underline underline-offset-4 hover:text-accent-hover"
                    >
                      {site.legal.email}
                    </a>
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink-muted">
                    {site.legal.vatNote}
                  </p>
                </section>

                <section aria-label="Haftungsausschluss">
                  <h2 className="font-mono text-xs uppercase tracking-wider text-ink">
                    Haftung für Inhalte &amp; externe Links
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                    Alle Inhalte dieses Portfolios wurden mit größter Sorgfalt
                    erstellt. Für die Inhalte verlinkter externer Seiten (z. B.
                    GitHub, LinkedIn oder Demo-Deployments) sind ausschließlich deren
                    jeweilige Betreiber verantwortlich.
                  </p>
                </section>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-emerald/30 bg-emerald-soft px-4 py-3 font-mono text-xs text-emerald">
                  Privacy-First-Architektur: Keine Tracking-Cookies, keine
                  Drittanbieter-Werbenetzwerke, lokales Font-Self-Hosting via
                  Next.js.
                </div>

                <section aria-label="Verantwortliche Stelle">
                  <h2 className="font-mono text-xs uppercase tracking-wider text-ink">
                    1. Verantwortliche Stelle
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed">
                    {site.legal.ownerFullName}, {site.legal.streetAddress},{' '}
                    {site.legal.postalCity}, {site.legal.country} · E-Mail:{' '}
                    <span className="font-mono text-ink">{site.legal.email}</span>
                  </p>
                </section>

                <section aria-label="Server-Logfiles und Hosting">
                  <h2 className="font-mono text-xs uppercase tracking-wider text-ink">
                    2. Hosting &amp; Server-Logfiles
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed">
                    Beim Aufruf dieser Website verarbeitet der Hosting-Anbieter
                    technisch notwendige Zugriffsdaten (z. B. IP-Adresse, Zeitpunkt,
                    User-Agent) auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zur
                    Gewährleistung von Betriebssicherheit und Ausfallsicherheit.
                  </p>
                </section>

                <section aria-label="Kontaktformular">
                  <h2 className="font-mono text-xs uppercase tracking-wider text-ink">
                    3. Quick-Dispatch Kontaktformular
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed">
                    Daten aus dem Kontaktformular (Name, E-Mail-Adresse, Thema und
                    Nachricht) werden ausschließlich zur Bearbeitung deiner Anfrage
                    verarbeitet (Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO) und nicht
                    ohne Einwilligung an Dritte weitergegeben.
                  </p>
                </section>

                <section aria-label="Betroffenenrechte">
                  <h2 className="font-mono text-xs uppercase tracking-wider text-ink">
                    4. Deine Rechte nach DSGVO
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed">
                    Du hast jederzeit das Recht auf Auskunft (Art. 15 DSGVO),
                    Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO),
                    Einschränkung der Verarbeitung (Art. 18 DSGVO) sowie Beschwerde
                    bei einer Datenschutz-Aufsichtsbehörde.
                  </p>
                </section>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border-subtle bg-surface/85 px-5 py-3.5 sm:px-6">
            <span className="font-mono text-[11px] text-ink-muted">
              Esc oder Klick außerhalb zum Schließen
            </span>
            <button
              type="button"
              onClick={closeDialog}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-elevated px-3.5 py-1.5 font-mono text-xs font-medium text-ink transition-colors hover:border-border-strong"
            >
              Schließen
            </button>
          </div>
        </div>
      ) : null}
    </dialog>,
    document.body,
  );
}
