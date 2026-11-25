import type { FeatureModuleMeta } from '@/features/types';

export {
  sendContactEmail,
  type ContactDispatchErrorCode,
  type ContactDispatchResult,
  type ContactFieldErrors,
  type ContactTopic,
} from './actions/sendContactEmail';
export { ContactFooter, type ContactFooterProps } from './contact-footer';
export { ContactSection, type ContactSectionProps } from './contact-section';
export {
  LegalModal,
  type LegalDocumentType,
  type LegalModalProps,
} from './legal-modal';

export const CONTACT_FEATURE_META: FeatureModuleMeta = {
  id: 'contact',
  label: 'Contact & Collaboration',
  phase: 'Phase 4',
  status: 'active',
  description:
    'Quick-Dispatch-Kontaktformular (Server Action / Resend-ready), One-Click-Copy für E-Mail/Discord/Socials sowie System-Footer mit Impressum- & Datenschutz-Modals.',
};
