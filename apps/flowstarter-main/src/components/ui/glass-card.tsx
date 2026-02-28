'use client';

/**
 * GlassCard - re-exported from the shared design system with Next.js Link support.
 *
 * The base GlassCard lives in @flowstarter/flow-design-system and renders
 * plain <a> tags for links. This wrapper overrides as="link" to use Next.js
 * <Link> for client-side navigation.
 */

import Link from 'next/link';
import { forwardRef, type ReactNode } from 'react';
import {
  GlassCard as BaseGlassCard,
  type GlassCardProps as BaseGlassCardProps,
} from '@flowstarter/flow-design-system';

export type GlassCardProps = BaseGlassCardProps;

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ as, href, children, ...props }, ref) => {
    // For link mode, wrap with Next.js Link for client-side navigation
    if (as === 'link' && href) {
      return (
        <Link href={href} className="block h-full">
          <BaseGlassCard ref={ref} as="div" noHover={props.noHover} {...props}>
            {children}
          </BaseGlassCard>
        </Link>
      );
    }

    return (
      <BaseGlassCard ref={ref} as={as} href={href} {...props}>
        {children}
      </BaseGlassCard>
    );
  },
);

GlassCard.displayName = 'GlassCard';
