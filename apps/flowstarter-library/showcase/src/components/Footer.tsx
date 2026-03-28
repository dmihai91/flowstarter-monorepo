import React from 'react';
import { Logo } from '@flowstarter/flow-design-system';

interface FooterProps {
  darkMode?: boolean;
}

function ArrowIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
}

export function Footer(_props: FooterProps): React.ReactElement {
  const muted = 'text-gray-500 dark:text-white/50';
  const link = 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors text-sm flex items-center gap-1.5 no-underline';

  return (
    <footer className="mt-4 border-t border-gray-200/80 dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top row */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <a href="/" className="flex items-center gap-2.5 no-underline group">
              <Logo size="sm" />
              <span
                className="text-[11px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded transition-all duration-200"
                style={{
                  background: 'color-mix(in srgb, var(--purple) 10%, transparent)',
                  color: 'var(--purple)',
                  border: '1px solid color-mix(in srgb, var(--purple) 20%, transparent)',
                }}
              >
                Library
              </span>
            </a>
            <p className={`text-sm max-w-xs leading-relaxed ${muted}`}>
              Templates built for real businesses. Pick one, customise it, ship it.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <p className={`text-xs font-semibold uppercase tracking-widest mb-1 text-gray-400 dark:text-white/40`}>Templates</p>
              <a href="/?category=coaching" className={link}>Coaching</a>
              <a href="/?category=education" className={link}>Education</a>
              <a href="/?category=health" className={link}>Health &amp; Wellness</a>
              <a href="/?category=creative" className={link}>Creative</a>
            </div>
            <div className="flex flex-col gap-3">
              <p className={`text-xs font-semibold uppercase tracking-widest mb-1 text-gray-400 dark:text-white/40`}>Platform</p>
              <a href="https://flowstarter.dev" target="_blank" rel="noopener noreferrer" className={link}>
                Flowstarter <ArrowIcon />
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
        <div className="mt-8 pt-5 border-t border-gray-200/80 dark:border-white/[0.06] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-xs ${muted}`}>
            &copy; {new Date().getFullYear()} Flowstarter. Professional templates for operators.
          </p>
          <a href="https://flowstarter.dev" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium transition-colors no-underline"
            style={{ color: 'var(--purple)' }}>
            Launch your site with Flowstarter <ArrowIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
