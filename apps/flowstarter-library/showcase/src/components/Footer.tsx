import React from 'react';
import { Logo } from '@flowstarter/flow-design-system';

interface FooterProps {
  darkMode?: boolean;
}

function ArrowIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
}

export function Footer({ darkMode = false }: FooterProps): React.ReactElement {
  const muted = darkMode ? 'text-neutral-400' : 'text-neutral-500';
  const link = darkMode
    ? 'text-neutral-300 hover:text-white transition-colors text-base sm:text-sm flex items-center gap-1.5 no-underline'
    : 'text-neutral-600 hover:text-neutral-900 transition-colors text-base sm:text-sm flex items-center gap-1.5 no-underline';
  const divider = darkMode ? 'border-[#ffffff0a]' : 'border-neutral-200';

  return (
    <footer className={'mt-4 border-t ' + divider}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top row */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <a href="/" className="flex items-center gap-2.5 no-underline group">
              <Logo size="sm" />
              <span className="text-[11px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--purple-primary)]/10 text-[var(--purple-primary)] border border-[var(--purple-primary)]/20 group-hover:bg-[var(--purple-primary)]/20 transition-colors">
                Library
              </span>
            </a>
            <p className={'text-base sm:text-sm max-w-xs leading-relaxed ' + muted}>
              Production-ready templates built with care. Used by real clients. Powered by Astro.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <p className={'text-xs font-semibold uppercase tracking-widest mb-1 ' + muted}>Templates</p>
              <a href="/?category=coaching" className={link}>Coaching</a>
              <a href="/?category=education" className={link}>Education</a>
              <a href="/?category=health" className={link}>Health &amp; Wellness</a>
              <a href="/?category=creative" className={link}>Creative</a>
            </div>
            <div className="flex flex-col gap-3">
              <p className={'text-xs font-semibold uppercase tracking-widest mb-1 ' + muted}>Platform</p>
              <a href="https://flowstarter.dev" target="_blank" rel="noopener noreferrer" className={link}>
                FlowStarter App <ArrowIcon />
              </a>
              <a href="https://flowstarter.dev/dashboard" target="_blank" rel="noopener noreferrer" className={link}>
                Dashboard <ArrowIcon />
              </a>
              <a href="https://flowstarter.dev/#pricing" target="_blank" rel="noopener noreferrer" className={link}>
                Pricing <ArrowIcon />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className={'mt-8 pt-5 border-t flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ' + divider}>
          <p className={'text-sm sm:text-xs ' + muted}>
            &copy; {new Date().getFullYear()} FlowStarter. Professional templates for operators.
          </p>
          <a href="https://flowstarter.dev" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm sm:text-xs font-medium text-purple-500 hover:text-purple-400 transition-colors no-underline">
            Build sites with FlowStarter <ArrowIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
