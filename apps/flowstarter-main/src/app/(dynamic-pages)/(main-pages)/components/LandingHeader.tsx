'use client';

import { useState, useEffect } from 'react';
import { LANDING } from './landing-content';
import { CTAButton } from './CTAButton';

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-sm shadow-gray-200/50 dark:shadow-none border-b border-gray-200/50 dark:border-white/5'
        : 'bg-transparent'
    }`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white">F</span>
          Flowstarter
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {LANDING.nav.links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <CTAButton size="sm" href="/team/dashboard">{LANDING.nav.cta}</CTAButton>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-gray-600 dark:text-gray-400"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            }
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-6 pb-6">
          {LANDING.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-base font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4">
            <CTAButton size="md" href="/team/dashboard" className="w-full">{LANDING.nav.cta}</CTAButton>
          </div>
        </div>
      )}
    </header>
  );
}
