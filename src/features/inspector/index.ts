import type { FeatureModuleMeta } from '@/features/types';

export const INSPECTOR_FEATURE_META: FeatureModuleMeta = {
  id: 'inspector',
  label: 'Architecture Inspector',
  phase: 'Phase 2',
  status: 'active',
  description:
    'Interaktiver X-Ray Blueprint-Inspektor für RSC-/Client-Layer und Performance-Metriken (Alt+I).',
};

export {
  InspectableModule,
  type InspectableElementTag,
  type InspectableLayerTone,
  type InspectableModuleProps,
} from './inspectable-module';
export {
  InspectorProvider,
  useInspector,
  type InspectorContextValue,
  type InspectorProviderProps,
} from './inspector-context';
