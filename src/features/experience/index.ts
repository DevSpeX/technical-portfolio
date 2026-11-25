import type { FeatureModuleMeta } from '@/features/types';

export { ExperienceMatrixSection } from './experience-matrix-section';
export {
  ENGINEERING_PILLARS,
  PILLAR_CONNECTIONS,
  type EngineeringPillar,
  type MatrixTool,
  type PillarConnection,
  type PillarId,
} from './matrix-data';

export const EXPERIENCE_FEATURE_META: FeatureModuleMeta = {
  id: 'experience',
  label: 'Tech-Stack & Philosophy Matrix',
  phase: 'Phase 3',
  status: 'active',
  description:
    'Interaktive 4-Säulen-Architektur-Matrix mit Hover-/Focus-Synergien für Frontend, Backend/Linux, AI-Workflows und Game Engines.',
};
