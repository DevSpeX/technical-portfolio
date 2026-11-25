import type { FeatureModuleMeta } from '@/features/types';

export const AUDIO_ENGINE_FEATURE_META: FeatureModuleMeta = {
  id: 'audio-engine',
  label: 'Procedural Web Audio Engine',
  phase: 'Phase 5',
  status: 'active',
  description:
    'Zero-Asset Web Audio API Synthesizer für subtile, taktile Hardware-Sounds mit Opt-in Persistence.',
};

export {
  AudioProvider,
  useSoundFX,
  type AudioProviderProps,
  type SoundFXContextValue,
} from './audio-context';
export { SoundEngine } from './sound-engine';
