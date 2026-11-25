export type FeatureModuleId =
  | 'hero'
  | 'projects'
  | 'github-telemetry'
  | 'command-palette'
  | 'inspector'
  | 'audio-engine'
  | 'experience'
  | 'contact';

export type FeatureModuleStatus = 'active' | 'foundation-ready' | 'scaffolded';

export interface FeatureModuleMeta {
  readonly id: FeatureModuleId;
  readonly label: string;
  readonly phase: string;
  readonly status: FeatureModuleStatus;
  readonly description: string;
}
