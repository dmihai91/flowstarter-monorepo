'use client';

import { handleSmoothScroll } from '@/utils/smoothScroll';
import Link from 'next/link';
import { ComponentProps } from 'react';

interface SmoothScrollLinkProps extends ComponentProps<typeof Link> {
  href: string;
  children: React.ReactNode;
}

/**
 * Link component with smooth scrolling behavior for hash links
 */
export function SmoothScrollLink({
  href,
  children,
  onClick,
  ...props
}: SmoothScrollLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Call smooth scroll handler if it's a hash link
    if (href.startsWith('#')) {
      handleSmoothScroll(e, href);
    }

    // Call the original onClick if provided
    onClick?.(e);
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
