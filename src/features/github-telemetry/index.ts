import type { FeatureModuleMeta } from '@/features/types';

export {
  fetchGitHubTelemetry,
  getLanguageColor,
  type GitHubCommitActivity,
  type GitHubProfileMetrics,
  type GitHubRepository,
  type GitHubTelemetryData,
  type LanguageStat,
  type TelemetrySource,
} from './api/github';
export {
  GitHubTelemetryBoard,
  type GitHubTelemetryBoardProps,
} from './github-telemetry-board';
export { GitHubTelemetrySection } from './github-telemetry-section';

export const GITHUB_TELEMETRY_FEATURE_META: FeatureModuleMeta = {
  id: 'github-telemetry',
  label: 'Live GitHub Telemetry Engine',
  phase: 'Phase 3',
  status: 'active',
  description:
    'Server-seitige GitHub-REST-API-Telemetrie (ISR 3600s), Fallback-Engine, Sprachverteilung & Repo-Cards.',
};
