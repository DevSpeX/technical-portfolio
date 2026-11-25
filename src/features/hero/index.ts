import type { FeatureModuleMeta } from '@/features/types';

export {
  FoundationBlueprint,
  type FoundationBlueprintProps,
} from './foundation-blueprint';
export { HeroSection, type HeroSectionProps } from './hero-section';
export { SystemArchitectureGraph } from './system-architecture-graph';

export const HERO_FEATURE_META: FeatureModuleMeta = {
  id: 'hero',
  label: 'Asymmetric Kinetic Hero',
  phase: 'Phase 3',
  status: 'active',
  description:
    'Gestaffelte Typografie, Magnetic CTAs und interaktiver System-Architecture- & Telemetry-Graph.',
};
