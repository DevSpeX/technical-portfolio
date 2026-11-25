import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface ContainerProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly size?: 'default' | 'narrow' | 'wide';
}

const SIZE_CLASSES: Record<NonNullable<ContainerProps['size']>, string> = {
  narrow: 'max-w-4xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
};

export function Container({
  children,
  className,
  size = 'default',
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-8 lg:px-10',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
