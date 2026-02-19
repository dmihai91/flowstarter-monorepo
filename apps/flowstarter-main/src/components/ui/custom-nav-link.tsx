'use client';

import { cn } from '@/lib/utils';
import { handleSmoothScroll } from '@/utils/smoothScroll';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';

export function CustomNavLink({
  className,
  onClick,
  href,
  ...props
}: ComponentProps<typeof Link>) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Handle smooth scrolling for hash links
    if (typeof href === 'string' && href.includes('#')) {
      // Extract the hash from href (e.g., "/#features" -> "#features")
      const hashIndex = href.indexOf('#');
      const hash = href.substring(hashIndex);

      // Only apply smooth scroll if we're already on the homepage
      const isOnHomepage = pathname === '/';

      // Only apply smooth scroll if we're on the same page
      if (href.startsWith('/') && href.charAt(1) === '#') {
        // Link like "/#features" - only smooth scroll if on homepage
        if (isOnHomepage) {
          handleSmoothScroll(e, hash);
        }
        // Otherwise let Next.js navigate normally to /#features
      } else if (href.startsWith('#')) {
        // Link like "#features" - same page
        handleSmoothScroll(e, href);
      }
    }

    // Call original onClick if provided
    onClick?.(e);
  };

  return (
    <Link
      {...props}
      href={href}
      onClick={handleClick}
      className={cn(
        'underline-offset-4 hover:underline hover:decoration-2 hover:opacity-85 transition-colors hover:text-foreground inline-flex items-center leading-none',
        className
      )}
    />
  );
}

export default CustomNavLink;
