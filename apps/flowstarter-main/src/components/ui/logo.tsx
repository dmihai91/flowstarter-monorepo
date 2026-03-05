'use client';

import {
  Logo as DesignSystemLogo,
  LogoIcon as DesignSystemLogoIcon,
  type LogoProps as DesignSystemLogoProps,
} from '@flowstarter/flow-design-system';
import Link from 'next/link';

interface LogoProps extends DesignSystemLogoProps {
  href?: string;
}

export function Logo({ href, ...props }: LogoProps) {
  if (href) {
    return (
      <Link href={href} style={{ display: 'flex', alignItems: 'center' }}>
        <DesignSystemLogo {...props} />
      </Link>
    );
  }

  return <DesignSystemLogo {...props} />;
}

export function LogoIcon(props: Omit<DesignSystemLogoProps, 'showText'>) {
  return <DesignSystemLogoIcon {...props} />;
}
