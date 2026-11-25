'use client';

import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Loader2,
  Mail,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  useCallback,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent as ReactFormEvent,
} from 'react';
import type { SiteConfig, SocialLink } from '@/config';
import { useSoundFX } from '@/features/audio-engine';
import { InspectableModule } from '@/features/inspector';
import { MagneticButton, SpotlightCard } from '@/shared/components';
import { cn } from '@/shared/lib/cn';
import { useToast } from '@/shared/providers/toast-provider';
import { Container } from '@/shared/ui/container';
import { StatusPill, type StatusTone } from '@/shared/ui/status-pill';
import {
  sendContactEmail,
  type ContactDispatchResult,
  type ContactTopic,
} from './actions/sendContactEmail';

export interface ContactSectionProps {
  readonly site: SiteConfig;
}

interface FormValues {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  companyWebsite: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const TOPIC_OPTIONS: ReadonlyArray<{
  readonly value: ContactTopic;
  readonly label: string;
  readonly hint: string;
}> = [
    {
      value: 'architecture',
      label: 'Web Architecture',
      hint: 'Next.js, TypeScript, Systems',
    },
    {
      value: 'ai-pipeline',
      label: 'AI-Orchestration',
      hint: 'Agents, Tool-Calling, Eval',
    },
    {
      value: 'gamedev',
      label: 'Game Dev / Unity',
      hint: 'C#, WebGL, Simulation',
    },
    {
      value: 'general',
      label: 'Austausch / OSS',
      hint: 'Linux, VoidStation, Collab',
    },
  ];

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
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
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function getAvailabilityTone(
  status: SiteConfig['owner']['availabilityStatus'],
): StatusTone {
  switch (status) {
    case 'available':
      return 'emerald';
    case 'selective':
      return 'amber';
    case 'unavailable':
      return 'neutral';
  }
}

function validateField(
  field: keyof FieldErrors,
  value: string,
): string | undefined {
  const trimmed = value.trim();
  if (field === 'name') {
    if (trimmed.length < 2) {
      return 'Bitte gib deinen Namen ein (mindestens 2 Zeichen).';
    }
    return undefined;
  }
  if (field === 'email') {
    if (!EMAIL_PATTERN.test(trimmed)) {
      return 'Bitte gib eine gültige E-Mail-Adresse im Format name@domain.de ein.';
    }
    return undefined;
  }
  if (field === 'message') {
    if (trimmed.length < 15) {
      return 'Bitte beschreibe dein Anliegen kurz (mindestens 15 Zeichen).';
    }
    return undefined;
  }
  return undefined;
}

/**
 * Interactive Contact & Collaboration section with One-Click-Copy channels
 * (Email, Discord & Socials from `SITE_CONFIG`) and an accessible Quick-Dispatch
 * form backed by a Resend-ready Next.js Server Action.
 */
export function ContactSection({ site }: ContactSectionProps) {
  const { toast } = useToast();
  const { playClick } = useSoundFX();
  const [isPending, startTransition] = useTransition();

  const headingId = useId();
  const formHeadingId = useId();
  const nameId = useId();
  const nameErrorId = useId();
  const emailId = useId();
  const emailHintId = useId();
  const emailErrorId = useId();
  const messageId = useId();
  const messageHintId = useId();
  const messageErrorId = useId();

  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [dispatchResult, setDispatchResult] =
    useState<ContactDispatchResult | null>(null);

  const [values, setValues] = useState<FormValues>({
    name: '',
    email: '',
    topic: 'architecture',
    message: '',
    companyWebsite: '',
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [dirty, setDirty] = useState<Record<keyof FieldErrors, boolean>>({
    name: false,
    email: false,
    message: false,
  });

  const discordSocial = site.socials.find((s) => s.platform === 'discord');
  const secondarySocials: readonly SocialLink[] = site.socials.filter(
    (s) => s.platform !== 'email' && s.platform !== 'discord',
  );

  const handleCopy = useCallback(
    async (id: string, label: string, value: string) => {
      const ok = await copyToClipboard(value);
      if (ok) {
        setCopiedId(id);
        window.setTimeout(() => {
          setCopiedId((current) => (current === id ? null : current));
        }, 2000);
      }

      toast({
        title: ok ? `${label} kopiert` : 'Zwischenablage nicht verfügbar',
        description: value,
        tone: ok ? 'emerald' : 'amber',
      });
    },
    [toast],
  );

  const handleFieldChange = (
    field: keyof FieldErrors,
    nextValue: string,
  ): void => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setDirty((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

    // On active typing: clear existing error once valid; never show new errors mid-keystroke
    if (errors[field]) {
      const nextError = validateField(field, nextValue);
      if (!nextError) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    }

    if (dispatchResult?.status === 'error') {
      setDispatchResult(null);
    }
  };

  const handleFieldBlur = (field: keyof FieldErrors): void => {
    if (!dirty[field]) {
      return;
    }
    const fieldError = validateField(field, values[field]);
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
    if (fieldError) {
      setLiveAnnouncement(fieldError);
    }
  };

  const handleReset = (): void => {
    playClick();
    setValues({
      name: '',
      email: '',
      topic: 'architecture',
      message: '',
      companyWebsite: '',
    });
    setErrors({});
    setDirty({ name: false, email: false, message: false });
    setDispatchResult(null);
    setLiveAnnouncement('Formular zurückgesetzt.');
    window.requestAnimationFrame(() => {
      nameRef.current?.focus();
    });
  };

  const handleSubmit = (event: ReactFormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (isPending) {
      return;
    }

    const nextErrors: FieldErrors = {
      name: validateField('name', values.name),
      email: validateField('email', values.email),
      message: validateField('message', values.message),
    };

    setErrors(nextErrors);
    setDirty({ name: true, email: true, message: true });

    if (nextErrors.name) {
      setLiveAnnouncement(`Fehler im Feld Name: ${nextErrors.name}`);
      nameRef.current?.focus();
      return;
    }
    if (nextErrors.email) {
      setLiveAnnouncement(`Fehler im Feld E-Mail: ${nextErrors.email}`);
      emailRef.current?.focus();
      return;
    }
    if (nextErrors.message) {
      setLiveAnnouncement(`Fehler im Feld Nachricht: ${nextErrors.message}`);
      messageRef.current?.focus();
      return;
    }

    playClick();
    setDispatchResult(null);

    const formData = new FormData();
    formData.set('name', values.name);
    formData.set('email', values.email);
    formData.set('topic', values.topic);
    formData.set('message', values.message);
    formData.set('company_website', values.companyWebsite);

    startTransition(async () => {
      try {
        const result = await sendContactEmail(formData);
        setDispatchResult(result);

        if (result.status === 'error') {
          if (result.fieldErrors) {
            setErrors({
              name: result.fieldErrors.name,
              email: result.fieldErrors.email,
              message: result.fieldErrors.message,
            });
          }
          setLiveAnnouncement(result.message);
          toast({
            title:
              result.code === 'CONFIG_MISSING'
                ? 'SMTP / Resend Setup fehlt'
                : 'Versand fehlgeschlagen',
            description: result.message,
            tone: 'amber',
          });
          return;
        }

        setLiveAnnouncement(result.message);
        toast({
          title: 'E-Mail erfolgreich zugestellt',
          description: result.ticketId
            ? `Ticket-ID: ${result.ticketId}`
            : result.message,
          tone: 'emerald',
        });
      } catch {
        const fallbackError: ContactDispatchResult = {
          status: 'error',
          code: 'DELIVERY_ERROR',
          message:
            'Unerwarteter Verbindungsfehler zur Server Action. Bitte versuche es erneut oder nutze Direct Mail.',
        };
        setDispatchResult(fallbackError);
        setLiveAnnouncement(fallbackError.message);
        toast({
          title: 'Versand fehlgeschlagen',
          description: fallbackError.message,
          tone: 'amber',
        });
      }
    });
  };

  const formState: 'idle' | 'sending' | 'success' | 'error' = isPending
    ? 'sending'
    : dispatchResult?.status === 'success'
      ? 'success'
      : dispatchResult?.status === 'error'
        ? 'error'
        : 'idle';

  const emailDescribedBy = errors.email
    ? `${emailHintId} ${emailErrorId}`
    : emailHintId;
  const messageDescribedBy = errors.message
    ? `${messageHintId} ${messageErrorId}`
    : messageHintId;

  return (
    <InspectableModule
      as="section"
      id="contact"
      tabIndex={-1}
      name="ContactSection"
      layer="Client + Server Action // Quick-Dispatch"
      renderMetric="Server Action · Zod + Resend"
      tone="client"
      className="scroll-mt-24 border-t border-border-subtle py-16 sm:py-24"
    >
      <Container>
        {/* Single polite live region for validation & dispatch status announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {liveAnnouncement}
        </div>

        {/* Section Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-accent">
              05 // Contact &amp; Collaboration
            </p>
            <h2
              id={headingId}
              className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
            >
              Direktkanal &amp; Quick-Dispatch
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
              Für technische Architektur-Mandate, AI-Pipeline-Prototypen,
              Open-Source-Austausch oder Game-Engineering-Projekte — direkt per
              Dispatch-Formular oder One-Click-Copy.
            </p>
          </div>

          <StatusPill
            label={site.owner.availabilityLabel}
            tone={getAvailabilityTone(site.owner.availabilityStatus)}
            className="self-start sm:self-auto"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Direct Channels & One-Click-Copy */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            {/* Primary Channel 1: Direct Email */}
            <SpotlightCard tone="cobalt" className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent">
                    <Mail aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                      Direct E-Mail
                    </p>
                    <p className="truncate font-mono text-sm font-medium text-ink">
                      {site.owner.email}
                    </p>
                  </div>
                </div>

                <a
                  href={`mailto:${site.owner.email}`}
                  aria-label={`E-Mail an ${site.owner.email} im Mail-Client öffnen`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
                >
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3.5">
                <span className="font-mono text-[11px] text-ink-muted">
                  Antwortzeit i. d. R. &lt; 24 h · {site.owner.timezone}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    void handleCopy('email', 'E-Mail', site.owner.email)
                  }
                  aria-label={`E-Mail-Adresse ${site.owner.email} in die Zwischenablage kopieren`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-xs text-ink transition-colors hover:border-accent/60 hover:text-accent"
                >
                  {copiedId === 'email' ? (
                    <>
                      <Check
                        aria-hidden="true"
                        className="h-3.5 w-3.5 text-emerald"
                      />
                      <span className="text-emerald">Kopiert</span>
                    </>
                  ) : (
                    <>
                      <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                      <span>Kopieren</span>
                    </>
                  )}
                </button>
              </div>
            </SpotlightCard>

            {/* Primary Channel 2: Discord */}
            {discordSocial ? (
              <SpotlightCard tone="emerald" className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-emerald">
                      <MessageSquare aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                        {discordSocial.label}
                      </p>
                      <p className="truncate font-mono text-sm font-medium text-ink">
                        {discordSocial.handle}
                      </p>
                    </div>
                  </div>

                  <a
                    href={discordSocial.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Discord-Profil ${discordSocial.handle} in neuem Tab öffnen`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
                  >
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3.5">
                  <span className="font-mono text-[11px] text-ink-muted">
                    Schneller Sync für Dev- &amp; OSS-Themen
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      void handleCopy(
                        discordSocial.id,
                        discordSocial.label,
                        discordSocial.copyValue ?? discordSocial.handle,
                      )
                    }
                    aria-label={`Discord-Handle ${discordSocial.copyValue ?? discordSocial.handle} kopieren`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-xs text-ink transition-colors hover:border-emerald/60 hover:text-emerald"
                  >
                    {copiedId === discordSocial.id ? (
                      <>
                        <Check
                          aria-hidden="true"
                          className="h-3.5 w-3.5 text-emerald"
                        />
                        <span className="text-emerald">Kopiert</span>
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                        <span>Handle kopieren</span>
                      </>
                    )}
                  </button>
                </div>
              </SpotlightCard>
            ) : null}

            {/* Socials Matrix */}
            <SpotlightCard tone="neutral" className="flex-1 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                  Socials &amp; Endpoints
                </p>
                <span className="font-mono text-[11px] text-ink-muted">
                  {site.owner.location}
                </span>
              </div>

              <ul className="mt-3.5 divide-y divide-border-subtle">
                {secondarySocials.map((social) => {
                  const copyTarget = social.copyValue ?? social.href;
                  const isCopied = copiedId === social.id;

                  return (
                    <li
                      key={social.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Globe
                          aria-hidden="true"
                          className="h-3.5 w-3.5 shrink-0 text-ink-muted"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-ink">
                            {social.label}
                          </p>
                          <p className="truncate font-mono text-[11px] text-ink-muted">
                            {social.handle}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void handleCopy(social.id, social.label, copyTarget)
                          }
                          aria-label={`${social.label} (${copyTarget}) kopieren`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-surface text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
                        >
                          {isCopied ? (
                            <Check
                              aria-hidden="true"
                              className="h-3.5 w-3.5 text-emerald"
                            />
                          ) : (
                            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${social.label} in neuem Tab öffnen`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-surface text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
                        >
                          <ArrowUpRight
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SpotlightCard>
          </div>

          {/* Right Column: Interactive Quick-Dispatch Form */}
          <SpotlightCard tone="cobalt" className="p-5 sm:p-6 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-4">
              <div>
                <h3
                  id={formHeadingId}
                  className="text-base font-semibold tracking-tight text-ink sm:text-lg"
                >
                  Quick-Dispatch Formular
                </h3>
                <p className="mt-0.5 font-mono text-xs text-ink-muted">
                  Next.js Server Action · Zod-validiert · Resend Live-Relay
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors',
                  formState === 'success'
                    ? 'border-emerald/40 bg-emerald-soft text-emerald'
                    : formState === 'error'
                      ? 'border-crimson/40 bg-crimson/10 text-crimson'
                      : 'border-border bg-surface text-ink-secondary',
                )}
              >
                {formState === 'sending' ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      className="h-3 w-3 animate-spin text-accent"
                    />
                    <span>Wird gesendet...</span>
                  </>
                ) : formState === 'success' ? (
                  <>
                    <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
                    <span>Zugestellt</span>
                  </>
                ) : formState === 'error' ? (
                  <>
                    <AlertCircle aria-hidden="true" className="h-3 w-3" />
                    <span>Aktion erforderlich</span>
                  </>
                ) : (
                  <>
                    <Sparkles
                      aria-hidden="true"
                      className="h-3 w-3 text-accent"
                    />
                    <span>Pflichtfelder *</span>
                  </>
                )}
              </span>
            </div>

            {formState === 'success' && dispatchResult ? (
              <div
                role="status"
                className="mt-6 rounded-xl border border-emerald/35 bg-emerald-soft p-5"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-ink">
                      E-Mail erfolgreich zugestellt
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
                      {dispatchResult.message}
                    </p>
                    {dispatchResult.ticketId ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-emerald/30 bg-surface/80 px-3 py-2">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                          Ticket-ID
                        </span>
                        <code className="font-mono text-xs font-semibold text-emerald">
                          {dispatchResult.ticketId}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            void handleCopy(
                              'ticket',
                              'Ticket-ID',
                              dispatchResult.ticketId ?? '',
                            )
                          }
                          aria-label={`Ticket-ID ${dispatchResult.ticketId} kopieren`}
                          className="ml-auto inline-flex items-center gap-1 rounded-md border border-border-subtle bg-elevated px-2 py-1 font-mono text-[10px] text-ink-secondary transition-colors hover:border-border hover:text-ink"
                        >
                          {copiedId === 'ticket' ? (
                            <>
                              <Check
                                aria-hidden="true"
                                className="h-3 w-3 text-emerald"
                              />
                              <span className="text-emerald">Kopiert</span>
                            </>
                          ) : (
                            <>
                              <Copy aria-hidden="true" className="h-3 w-3" />
                              <span>Kopieren</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5">
                  <MagneticButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleReset}
                  >
                    <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                    <span>Weitere Nachricht senden</span>
                  </MagneticButton>
                </div>
              </div>
            ) : (
              <form
                aria-labelledby={formHeadingId}
                aria-busy={isPending}
                method="POST"
                noValidate
                onSubmit={handleSubmit}
                className="mt-5 space-y-5"
              >
                {/* Accessible honeypot field hidden from keyboard & assistive tech */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="company_website">Website</label>
                  <input
                    id="company_website"
                    name="company_website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.companyWebsite}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        companyWebsite: event.target.value,
                      }))
                    }
                  />
                </div>

                {/* Topic Selector (4 mutually exclusive choices -> visible radios per forms guide) */}
                <fieldset disabled={isPending}>
                  <legend className="font-mono text-xs font-medium uppercase tracking-wider text-ink-secondary">
                    Themenbereich
                  </legend>
                  <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {TOPIC_OPTIONS.map((option) => {
                      const radioId = `contact-topic-${option.value}`;
                      const isChecked = values.topic === option.value;

                      return (
                        <div key={option.value} className="relative">
                          <input
                            id={radioId}
                            type="radio"
                            name="topic"
                            value={option.value}
                            checked={isChecked}
                            disabled={isPending}
                            onChange={() =>
                              setValues((prev) => ({
                                ...prev,
                                topic: option.value,
                              }))
                            }
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={radioId}
                            className={cn(
                              'flex min-h-12 cursor-pointer flex-col justify-center rounded-xl border px-3.5 py-2.5 transition-colors peer-disabled:cursor-not-allowed peer-disabled:opacity-65 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
                              isChecked
                                ? 'border-accent/60 bg-accent-soft text-ink'
                                : 'border-border-subtle bg-surface/80 text-ink-secondary hover:border-border hover:text-ink',
                            )}
                          >
                            <span className="text-xs font-semibold">
                              {option.label}
                            </span>
                            <span className="font-mono text-[11px] text-ink-muted">
                              {option.hint}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Name & Email */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={nameId}
                      className="text-xs font-medium text-ink"
                    >
                      Name{' '}
                      <span aria-hidden="true" className="text-accent">
                        *
                      </span>
                    </label>
                    <input
                      ref={nameRef}
                      id={nameId}
                      name="name"
                      type="text"
                      required
                      disabled={isPending}
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      enterKeyHint="next"
                      placeholder="Alex Weber"
                      value={values.name}
                      onChange={(event) =>
                        handleFieldChange('name', event.target.value)
                      }
                      onBlur={() => handleFieldBlur('name')}
                      aria-invalid={errors.name ? 'true' : 'false'}
                      aria-describedby={errors.name ? nameErrorId : undefined}
                      className={cn(
                        'contact-input min-h-12 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-muted/70 transition-colors disabled:cursor-not-allowed disabled:opacity-65',
                        errors.name
                          ? 'border-crimson'
                          : 'border-border hover:border-border-strong',
                      )}
                    />
                    {errors.name ? (
                      <p
                        id={nameErrorId}
                        className="flex items-start gap-1.5 text-xs text-crimson"
                      >
                        <AlertCircle
                          aria-hidden="true"
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        />
                        <span>{errors.name}</span>
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <label
                        htmlFor={emailId}
                        className="text-xs font-medium text-ink"
                      >
                        E-Mail{' '}
                        <span aria-hidden="true" className="text-accent">
                          *
                        </span>
                      </label>
                      <span
                        id={emailHintId}
                        className="font-mono text-[11px] text-ink-muted"
                      >
                        name@domain.de
                      </span>
                    </div>
                    <input
                      ref={emailRef}
                      id={emailId}
                      name="email"
                      type="email"
                      required
                      disabled={isPending}
                      maxLength={160}
                      autoComplete="email"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      enterKeyHint="next"
                      placeholder="alex@company.de"
                      value={values.email}
                      onChange={(event) =>
                        handleFieldChange('email', event.target.value)
                      }
                      onBlur={() => handleFieldBlur('email')}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={emailDescribedBy}
                      className={cn(
                        'contact-input min-h-12 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-muted/70 transition-colors disabled:cursor-not-allowed disabled:opacity-65',
                        errors.email
                          ? 'border-crimson'
                          : 'border-border hover:border-border-strong',
                      )}
                    />
                    {errors.email ? (
                      <p
                        id={emailErrorId}
                        className="flex items-start gap-1.5 text-xs text-crimson"
                      >
                        <AlertCircle
                          aria-hidden="true"
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        />
                        <span>{errors.email}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <label
                      htmlFor={messageId}
                      className="text-xs font-medium text-ink"
                    >
                      Projektkontext / Nachricht{' '}
                      <span aria-hidden="true" className="text-accent">
                        *
                      </span>
                    </label>
                    <span
                      id={messageHintId}
                      className="font-mono text-[11px] text-ink-muted"
                    >
                      {values.message.trim().length}/2000 (min. 15)
                    </span>
                  </div>
                  <textarea
                    ref={messageRef}
                    id={messageId}
                    name="message"
                    required
                    disabled={isPending}
                    minLength={15}
                    maxLength={2000}
                    rows={4}
                    enterKeyHint="done"
                    placeholder="Kurzbeschreibung: Zielsystem, Zeitrahmen oder technischer Kontext..."
                    value={values.message}
                    onChange={(event) =>
                      handleFieldChange('message', event.target.value)
                    }
                    onBlur={() => handleFieldBlur('message')}
                    aria-invalid={errors.message ? 'true' : 'false'}
                    aria-describedby={messageDescribedBy}
                    className={cn(
                      'contact-input min-h-32 w-full resize-y rounded-xl border bg-surface px-3.5 py-3 text-base leading-relaxed text-ink placeholder:text-ink-muted/70 transition-colors disabled:cursor-not-allowed disabled:opacity-65',
                      errors.message
                        ? 'border-crimson'
                        : 'border-border hover:border-border-strong',
                    )}
                  />
                  {errors.message ? (
                    <p
                      id={messageErrorId}
                      className="flex items-start gap-1.5 text-xs text-crimson"
                    >
                      <AlertCircle
                        aria-hidden="true"
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      />
                      <span>{errors.message}</span>
                    </p>
                  ) : null}
                </div>

                {formState === 'error' && dispatchResult ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-xs text-crimson"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="leading-relaxed">
                          {dispatchResult.message}
                        </p>
                        {dispatchResult.code === 'CONFIG_MISSING' ? (
                          <div className="rounded-lg border border-crimson/30 bg-surface/90 px-3 py-2 font-mono text-[11px] text-ink-secondary">
                            <p className="text-ink">
                              Benötigt in <span className="text-accent">.env.local</span>:
                            </p>
                            <p className="mt-1">RESEND_API_KEY=re_...</p>
                            <p>CONTACT_FROM_EMAIL=&quot;Portfolio &lt;onboarding@resend.dev&gt;&quot;</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Submit Row */}
                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-mono text-[11px] text-ink-muted">
                    Kein Tracking · Zod + Resend Server Action
                  </p>

                  <MagneticButton
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    {isPending ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin text-accent"
                        />
                        <span>Sende E-Mail...</span>
                      </>
                    ) : (
                      <>
                        <Send
                          aria-hidden="true"
                          className="h-4 w-4 text-accent"
                        />
                        <span>Nachricht absenden</span>
                      </>
                    )}
                  </MagneticButton>
                </div>
              </form>
            )}
          </SpotlightCard>
        </div>
      </Container>
    </InspectableModule>
  );
}
