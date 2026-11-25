'use server';

import { randomBytes } from 'node:crypto';
import { Resend } from 'resend';
import { z } from 'zod';
import { SITE_CONFIG } from '@/config';

export type ContactTopic =
  | 'architecture'
  | 'ai-pipeline'
  | 'gamedev'
  | 'general';

export interface ContactFieldErrors {
  readonly name?: string;
  readonly email?: string;
  readonly topic?: string;
  readonly message?: string;
}

export type ContactDispatchErrorCode =
  | 'VALIDATION_ERROR'
  | 'CONFIG_MISSING'
  | 'DELIVERY_ERROR';

export interface ContactDispatchResult {
  readonly status: 'success' | 'error';
  readonly message: string;
  readonly ticketId?: string;
  readonly code?: ContactDispatchErrorCode;
  readonly fieldErrors?: ContactFieldErrors;
}

const TOPIC_LABELS: Record<ContactTopic, string> = {
  architecture: 'Web Architecture',
  'ai-pipeline': 'AI-Orchestration',
  gamedev: 'Game Dev / Unity',
  general: 'Austausch / OSS',
};

const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Bitte gib deinen Namen ein (mindestens 2 Zeichen).')
    .max(100, 'Der Name darf maximal 100 Zeichen lang sein.'),
  email: z
    .string()
    .trim()
    .max(160, 'Die E-Mail-Adresse ist zu lang.')
    .email('Bitte gib eine gültige E-Mail-Adresse im Format name@domain.de ein.'),
  topic: z.enum(['architecture', 'ai-pipeline', 'gamedev', 'general'], {
    message: 'Bitte wähle eine gültige Kategorie aus.',
  }),
  message: z
    .string()
    .trim()
    .min(15, 'Bitte beschreibe dein Anliegen kurz (mindestens 15 Zeichen).')
    .max(2000, 'Die Nachricht darf maximal 2000 Zeichen lang sein.'),
});

const FREEMAIL_SENDER_DOMAINS = new Set<string>([
  'gmail.com',
  'googlemail.com',
  'yahoo.de',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'outlook.com',
  'hotmail.com',
  'gmx.de',
  'gmx.net',
  'web.de',
  't-online.de',
]);

function extractEmailDomain(rawEmailOrHeader: string): string | null {
  const bracketMatch = /<([^>]+)>/.exec(rawEmailOrHeader);
  const emailPart = (bracketMatch?.[1] ?? rawEmailOrHeader).trim();
  const atIndex = emailPart.lastIndexOf('@');
  if (atIndex === -1) {
    return null;
  }
  const domain = emailPart.slice(atIndex + 1).trim().toLowerCase();
  return domain || null;
}

function mapResendErrorMessage(errorMessage: string | undefined): string {
  const normalized = (errorMessage ?? '').toLowerCase();

  if (/domain.*not verified|not a verified domain/.test(normalized)) {
    return 'Absender-Domain ist bei Resend nicht verifiziert. Nutze für Tests CONTACT_FROM_EMAIL="Portfolio Dispatch <onboarding@resend.dev>" oder verifiziere deine eigene Domain unter resend.com/domains.';
  }

  if (
    /testing emails to your own email|only send testing emails/.test(
      normalized,
    )
  ) {
    return 'Im Resend-Testmodus (onboarding@resend.dev) darf nur an die eigene Resend-Registrierungs-E-Mail gesendet werden. Prüfe CONTACT_TO_EMAIL in .env.local oder verifiziere eine eigene Domain bei Resend.';
  }

  if (/api key is invalid|invalid api key|unauthorized/.test(normalized)) {
    return 'Der konfigurierte RESEND_API_KEY ist ungültig. Bitte prüfe deinen API-Key im Resend Dashboard und starte den Server neu.';
  }

  const devDetail =
    process.env.NODE_ENV !== 'production' && errorMessage
      ? ` (${errorMessage})`
      : '';

  return `Der Mail-Provider konnte die Nachricht momentan nicht zustellen${devDetail}. Bitte versuche es in Kürze erneut oder nutze Direct Mail.`;
}

function readFormEntry(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Next.js Server Action that validates contact submissions with Zod,
 * applies honeypot anti-spam protection, and dispatches emails via Resend.
 */
export async function sendContactEmail(
  formData: FormData,
): Promise<ContactDispatchResult> {
  // 1. Honeypot anti-spam trap: silently accept bots without sending email
  const honeypot = readFormEntry(formData, 'company_website').trim();
  if (honeypot.length > 0) {
    return {
      status: 'success',
      ticketId: 'DSP-ACCEPTED',
      message: 'Nachricht wurde erfolgreich übermittelt.',
    };
  }

  // 2. Strict Zod validation
  const parsed = contactFormSchema.safeParse({
    name: readFormEntry(formData, 'name'),
    email: readFormEntry(formData, 'email'),
    topic: readFormEntry(formData, 'topic'),
    message: readFormEntry(formData, 'message'),
  });

  if (!parsed.success) {
    const fieldErrors: {
      name?: string;
      email?: string;
      topic?: string;
      message?: string;
    } = {};

    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        (key === 'name' ||
          key === 'email' ||
          key === 'topic' ||
          key === 'message') &&
        !fieldErrors[key]
      ) {
        fieldErrors[key] = issue.message;
      }
    }

    return {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Bitte prüfe die markierten Pflichtfelder.',
      fieldErrors,
    };
  }

  const { name, email, topic, message } = parsed.data;

  // 3. Verify Resend environment configuration
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();
  const toEmail =
    process.env.CONTACT_TO_EMAIL?.trim() || SITE_CONFIG.owner.email.trim();

  if (!resendApiKey || /^re_x+$/i.test(resendApiKey) || !fromEmail) {
    return {
      status: 'error',
      code: 'CONFIG_MISSING',
      message:
        'E-Mail-Versand ist lokal noch nicht konfiguriert: Trage RESEND_API_KEY und CONTACT_FROM_EMAIL in deine .env.local ein (siehe .env.example & README.md) und starte den Server neu. Alternativ steht Direct Mail links bereit.',
    };
  }

  const fromDomain = extractEmailDomain(fromEmail);
  if (fromDomain && FREEMAIL_SENDER_DOMAINS.has(fromDomain)) {
    return {
      status: 'error',
      code: 'CONFIG_MISSING',
      message: `Resend erlaubt keine Freemail-Absender (@${fromDomain}). Nutze "Portfolio Dispatch <onboarding@resend.dev>" in .env.local oder eine verifizierte eigene Domain.`,
    };
  }

  if (!toEmail || toEmail.endsWith('.invalid')) {
    return {
      status: 'error',
      code: 'CONFIG_MISSING',
      message:
        'Keine gültige Empfänger-Adresse konfiguriert. Bitte prüfe CONTACT_TO_EMAIL in .env.local oder SITE_CONFIG.owner.email in site.config.ts.',
    };
  }

  // 4. Send email via Resend with Reply-To set to the sender
  const ticketId = `DSP-${randomBytes(3).toString('hex').toUpperCase()}`;
  const topicLabel = TOPIC_LABELS[topic];
  const submittedAt = new Date().toISOString();

  const textBody = [
    `Neue Portfolio-Anfrage (${ticketId})`,
    `----------------------------------------`,
    `Kategorie: ${topicLabel}`,
    `Name:      ${name}`,
    `E-Mail:    ${email}`,
    `Zeitpunkt: ${submittedAt}`,
    ``,
    `Nachricht:`,
    message,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background:#07080a; color:#f1f5f9; padding:24px; border-radius:12px; border:1px solid #1e2430;">
      <p style="margin:0 0 8px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12px; color:#60a5fa; text-transform:uppercase; letter-spacing:0.08em;">
        Portfolio Quick-Dispatch · ${escapeHtml(ticketId)}
      </p>
      <h2 style="margin:0 0 16px; font-size:18px; color:#f1f5f9;">
        [${escapeHtml(topicLabel)}] Anfrage von ${escapeHtml(name)}
      </h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:13px;">
        <tr>
          <td style="padding:6px 0; color:#7e8ba3; width:110px;">Absender</td>
          <td style="padding:6px 0; color:#f1f5f9;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#7e8ba3;">Reply-To</td>
          <td style="padding:6px 0; color:#60a5fa;">${escapeHtml(email)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#7e8ba3;">Kategorie</td>
          <td style="padding:6px 0; color:#34d399;">${escapeHtml(topicLabel)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#7e8ba3;">Ticket-ID</td>
          <td style="padding:6px 0; font-family: ui-monospace, monospace; color:#f1f5f9;">${escapeHtml(ticketId)}</td>
        </tr>
      </table>
      <div style="background:#11141b; border:1px solid #2c3444; border-radius:8px; padding:14px; font-size:14px; line-height:1.6; color:#e2e8f0;">
        ${escapeHtml(message).replaceAll('\n', '<br />')}
      </div>
    </div>
  `;

  try {
    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: email,
      subject: `[Portfolio · ${topicLabel}] ${name} (${ticketId})`,
      text: textBody,
      html: htmlBody,
    });

    if (error) {
      console.error('[sendContactEmail] Resend API error:', error);
      return {
        status: 'error',
        code: 'DELIVERY_ERROR',
        message: mapResendErrorMessage(error.message),
      };
    }

    return {
      status: 'success',
      ticketId,
      message: `Deine Nachricht wurde direkt an ${SITE_CONFIG.owner.name} zugestellt. Antwort erfolgt i. d. R. innerhalb von 24 Stunden an ${email}.`,
    };
  } catch (err) {
    console.error('[sendContactEmail] Unexpected error:', err);
    return {
      status: 'error',
      code: 'DELIVERY_ERROR',
      message:
        'Netzwerk- oder Serverfehler beim E-Mail-Versand. Bitte versuche es erneut oder kopiere die direkte E-Mail-Adresse.',
    };
  }
}
