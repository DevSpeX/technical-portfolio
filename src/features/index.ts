import { AUDIO_ENGINE_FEATURE_META } from './audio-engine';
import { COMMAND_PALETTE_FEATURE_META } from './command-palette';
import { CONTACT_FEATURE_META } from './contact';
import { EXPERIENCE_FEATURE_META } from './experience';
import { GITHUB_TELEMETRY_FEATURE_META } from './github-telemetry';
import { HERO_FEATURE_META } from './hero';
import { INSPECTOR_FEATURE_META } from './inspector';
import { PROJECTS_FEATURE_META } from './projects';
import type { FeatureModuleMeta } from './types';

export type {
  FeatureModuleId,
  FeatureModuleMeta,
  FeatureModuleStatus,
} from './types';

export const FEATURE_REGISTRY: readonly FeatureModuleMeta[] = [
  HERO_FEATURE_META,
  PROJECTS_FEATURE_META,
  GITHUB_TELEMETRY_FEATURE_META,
  COMMAND_PALETTE_FEATURE_META,
  INSPECTOR_FEATURE_META,
  AUDIO_ENGINE_FEATURE_META,
  EXPERIENCE_FEATURE_META,
  CONTACT_FEATURE_META,
];
