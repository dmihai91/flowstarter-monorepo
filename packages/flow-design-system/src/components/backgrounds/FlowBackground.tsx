import { forwardRef, type HTMLAttributes } from 'react';

export type FlowBackgroundVariant = 'dashboard' | 'editor' | 'landing' | 'wizard' | 'auth';

export interface FlowBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  variant?: FlowBackgroundVariant;
  animated?: boolean;
}

/**
 * FlowBackground — zero-JS, pure-CSS atmospheric gradient.
 *
 * All styling lives in brand.css. This component only renders DOM structure.
 * No useState, no useEffect, no dangerouslySetInnerHTML — zero hydration risk.
 * Theme switching (light/dark) is handled entirely by CSS class on <html>.
 */

export const FlowBackground = forwardRef<HTMLDivElement, FlowBackgroundProps>(
  ({ variant = 'dashboard', animated = true, className = '', style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`fs-bg fs-bg--${variant} ${animated ? 'fs-bg--animated' : ''} ${className}`}
        style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: -1, ...style }}
        {...props}
      >
        <div className="fs-bg__base" />
        <div className="fs-bg__bloom" />
        <div className="fs-bg__secondary" />
        <div className="fs-bg__warm" />
        <div className="fs-bg__tertiary" />
        <svg className="fs-bg__lines" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="fs-lg-a" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="transparent" />
              <stop offset="20%"  stopColor="hsl(233,65%,50%)" stopOpacity="0.6" />
              <stop offset="60%"  stopColor="hsl(233,70%,58%)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="fs-lg-b" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="transparent" />
              <stop offset="30%"  stopColor="hsl(233,60%,52%)" stopOpacity="0.5" />
              <stop offset="70%"  stopColor="hsl(30,70%,42%)"  stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <g className="fs-bg__lines-a" stroke="url(#fs-lg-a)" strokeWidth="1.0">
            <path d="M-60,180 C200,140 420,220 720,175 S1100,135 1500,195" />
            <path d="M-60,340 C180,300 400,380 720,330 S1060,295 1500,360" />
            <path d="M-60,520 C220,480 440,555 720,505 S1080,470 1500,530" />
            <path d="M-60,700 C200,665 440,730 720,685 S1100,650 1500,710" />
          </g>
          <g className="fs-bg__lines-b" stroke="url(#fs-lg-b)" strokeWidth="0.7">
            <path d="M-60,260 C240,220 460,300 720,255 S1080,215 1500,280" />
            <path d="M-60,430 C200,395 420,465 720,420 S1060,385 1500,445" />
            <path d="M-60,610 C210,575 440,645 720,600 S1080,565 1500,625" />
            <path d="M-60,800 C240,765 460,840 720,795 S1090,755 1500,815" />
          </g>
        </svg>
      </div>
    );
  }
);

FlowBackground.displayName = 'FlowBackground';
