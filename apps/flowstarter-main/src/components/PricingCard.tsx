'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface PricingFeature {
  icon: LucideIcon;
  text: string;
}

export interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  description: string;
  features: PricingFeature[];
  ctaText: string;
  ctaHref: string;
  badge?: string;
  className?: string;
  ctaClassName?: string;
  ctaStyle?: React.CSSProperties;
  borderColor?: string;
  badgeClassName?: string;
}

export function PricingCard({
  title,
  price,
  period,
  description,
  features,
  ctaText,
  ctaHref,
  badge,
  className,
  ctaClassName,
  ctaStyle,
  borderColor,
  badgeClassName,
}: PricingCardProps) {
  const cardClassName = badge
    ? `flex flex-col gap-0 h-full relative border-2 mt-0 sm:mt-8 ${
        className || ''
      }`
    : `flex flex-col gap-0 h-full ${className || ''}`;

  const defaultCtaClassName =
    'inline-flex h-11 w-full items-center justify-center rounded-[12px] px-4 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-[0.98] bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-md hover:shadow-lg';

  return (
    <GlassCard
      className={cardClassName}
      style={borderColor ? { borderColor } : undefined}
    >
      {badge && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
          <span
            className={`text-white text-xs sm:text-sm px-3 py-1 rounded-full shadow-lg ${
              badgeClassName || ''
            }`}
            style={{ backgroundColor: borderColor || 'var(--purple)' }}
          >
            {badge}
          </span>
        </div>
      )}
      <div className={`space-y-4 ${badge ? 'pt-6 sm:pt-8' : ''}`}>
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="text-3xl font-bold">
          {price}
          <span className="text-base font-normal text-muted-foreground">
            {period}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-6 space-y-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="flex items-center space-x-2">
              <Icon className="h-5 w-5" style={{ color: 'var(--purple)' }} />
              <span className="text-sm">{feature.text}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-auto pt-6">
        <Link
          href={ctaHref}
          target={ctaHref.startsWith('http') ? '_blank' : undefined}
          rel={ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
          className={ctaClassName || defaultCtaClassName}
          style={ctaStyle}
        >
          {ctaText}
        </Link>
      </div>
    </GlassCard>
  );
}
