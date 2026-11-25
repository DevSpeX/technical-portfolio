import type { FeatureModuleMeta } from '@/features/types';

export {
  CaseStudyDrawer,
  type CaseStudyDrawerProps,
} from './case-study-drawer';
export { ProjectsSection, type ProjectsSectionProps } from './projects-section';

export const PROJECTS_FEATURE_META: FeatureModuleMeta = {
  id: 'projects',
  label: 'Interactive Case-Study Bento Grid',
  phase: 'Phase 3',
  status: 'active',
  description:
    'Asymmetrisches Bento-Grid mit Kategorie-Filtern und nativem Top-Layer Case-Study-Drawer (inkl. URL-Hash-Sync).',
};
