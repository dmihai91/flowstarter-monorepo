'use client';

import {
  LogoIcon as DesignSystemLogoIcon,
  LogoMark,
  type LogoProps as DesignSystemLogoProps,
} from '@flowstarter/flow-design-system';
import Link from 'next/link';

import { cn } from '@/lib/utils';

const textSizes = { xs: 16, sm: 20, md: 24, lg: 30, xl: 36 };

/** Beside the wordmark, the default mark size reads taller than the type; step down one notch. */
const markSizeBesideWordmark: Record<
  NonNullable<DesignSystemLogoProps['size']>,
  DesignSystemLogoProps['size']
> = {
  xs: 'xs',
  sm: 'xs',
  md: 'sm',
  lg: 'md',
  xl: 'lg',
};

interface LogoProps extends DesignSystemLogoProps {
  href?: string;
}

function LogoWordmark({
  size = 'md',
  className,
}: {
  size?: LogoProps['size'];
  className?: string;
}) {
  return (
    <div className={cn('flex shrink-0 items-center gap-2.5', className)}>
      <LogoMark
        size={markSizeBesideWordmark[size!]}
        className="shrink-0 self-center"
      />
      <span
        style={{
          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: textSizes[size!],
          letterSpacing: '-0.025em',
        }}
      >
        <span
          style={{
            background:
              'linear-gradient(to right, var(--purple), var(--purple))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Flow
        </span>
        <span style={{ color: 'var(--fs-ink)' }}>starter</span>
      </span>
    </div>
  );
}

export function Logo({
  href,
  size = 'md',
  showText = true,
  className,
}: LogoProps) {
  const content = showText ? (
    <LogoWordmark size={size} className={className} />
  ) : (
    <LogoMark size={size} className={className} />
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {content}
      </Link>
    );
  }

  return <>{content}</>;
}

export function LogoIcon(props: Omit<LogoProps, 'showText'>) {
  return <DesignSystemLogoIcon {...props} />;
}
