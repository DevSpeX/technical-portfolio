'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { AudioProvider } from '@/features/audio-engine';
import { CommandPalette, CommandPaletteProvider } from '@/features/command-palette';
import { InspectorProvider } from '@/features/inspector';
import { PortfolioFilterProvider } from './portfolio-filter-provider';
import { SmoothScrollProvider } from './smooth-scroll-provider';
import { ToastProvider } from './toast-provider';

export interface AppProvidersProps {
  readonly children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScrollProvider>
        <ToastProvider>
          <AudioProvider>
            <PortfolioFilterProvider>
              <InspectorProvider>
                <CommandPaletteProvider>
                  {children}
                  <CommandPalette />
                </CommandPaletteProvider>
              </InspectorProvider>
            </PortfolioFilterProvider>
          </AudioProvider>
        </ToastProvider>
      </SmoothScrollProvider>
    </MotionConfig>
  );
}
