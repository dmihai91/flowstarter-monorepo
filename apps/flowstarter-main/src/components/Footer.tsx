'use client';

import Link from 'next/link';
import { Footer as DSFooter, type FooterProps } from '@flowstarter/flow-design-system';
import type { ReactNode } from 'react';

export default function Footer(props: FooterProps) {
  return (
    <DSFooter
      {...props}
      renderLink={(href, children, className) => (
        <Link href={href} className={className}>{children}</Link>
      )}
    />
  );
}
