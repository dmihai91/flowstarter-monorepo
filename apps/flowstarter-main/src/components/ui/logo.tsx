'use client';

import {
  LogoIcon as DesignSystemLogoIcon,
  LogoMark,
  type LogoProps as DesignSystemLogoProps,
} from '@flowstarter/flow-design-system';
import Link from 'next/link';

const textSizes = { xs: 16, sm: 20, md: 24, lg: 30, xl: 36 };

interface LogoProps extends DesignSystemLogoProps {
  href?: string;
}

function LogoWordmark({ size = 'md' }: { size?: LogoProps['size'] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <LogoMark size={size} />
      <span style={{
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        fontWeight: 700,
        fontSize: textSizes[size!],
        letterSpacing: '-0.025em',
      }}>
        <span style={{
          background: 'linear-gradient(to right, var(--purple, #4D5DD9), #7C3AED)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Flow
        </span>
        <span style={{ color: 'var(--text-primary, #09090b)' }}>
          starter
        </span>
      </span>
    </div>
  );
}

export function Logo({ href, size = 'md', showText = true, className }: LogoProps) {
  const content = showText ? <LogoWordmark size={size} /> : <LogoMark size={size} className={className} />;

  if (href) {
    return (
      <Link href={href} style={{ display: 'flex', alignItems: 'center' }}>
        {content}
      </Link>
    );
  }

  return <>{content}</>;
}

export function LogoIcon(props: Omit<LogoProps, 'showText'>) {
  return <DesignSystemLogoIcon {...props} />;
}
