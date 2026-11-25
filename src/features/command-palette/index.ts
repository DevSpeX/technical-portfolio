import type { FeatureModuleMeta } from '@/features/types';

export const COMMAND_PALETTE_FEATURE_META: FeatureModuleMeta = {
  id: 'command-palette',
  label: 'Command Palette',
  phase: 'Phase 2',
  status: 'active',
  description:
    'Barrierefreie Cmd/Ctrl+K Command-Palette mit Portal, Fokus-Trap und dynamischer Aktionssuche.',
};

export { CommandPalette } from './command-palette';
export {
  CommandPaletteProvider,
  useCommandPalette,
  type CommandPaletteContextValue,
  type CommandPaletteProviderProps,
} from './command-palette-context';
export type {
  CommandGroup,
  CommandIconName,
  CommandItem,
} from './command-registry';
