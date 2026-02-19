'use client';

import { ReactNode } from 'react';
import FooterCompact from './FooterCompact';

interface ErrorPageLayoutProps {
  children: ReactNode;
}

export function ErrorPageLayout({ children }: ErrorPageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Dashboard-style gradient background */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-white dark:bg-[hsl(240,8%,17%)]">
          <div
            className="absolute inset-0 dashboard-gradient-1"
            style={{
              background: `radial-gradient(ellipse 120% 70% at 0% 0%, var(--dashboard-gradient-top-1) 0%, color-mix(in srgb, var(--dashboard-gradient-top-1) 88%, transparent) 10%, color-mix(in srgb, var(--dashboard-gradient-top-1) 75%, transparent) 22%, color-mix(in srgb, var(--dashboard-gradient-top-1) 60%, transparent) 35%, color-mix(in srgb, var(--dashboard-gradient-top-1) 45%, transparent) 48%, color-mix(in srgb, var(--dashboard-gradient-top-1) 28%, transparent) 58%, color-mix(in srgb, var(--dashboard-gradient-top-1) 12%, transparent) 66%, transparent 72%)`,
              mixBlendMode: 'normal',
            }}
          />
          <div
            className="absolute inset-0 dashboard-gradient-2"
            style={{
              background: `radial-gradient(ellipse 100% 65% at 100% 0%, var(--dashboard-gradient-top-2) 0%, color-mix(in srgb, var(--dashboard-gradient-top-2) 88%, transparent) 10%, color-mix(in srgb, var(--dashboard-gradient-top-2) 75%, transparent) 22%, color-mix(in srgb, var(--dashboard-gradient-top-2) 60%, transparent) 35%, color-mix(in srgb, var(--dashboard-gradient-top-2) 45%, transparent) 48%, color-mix(in srgb, var(--dashboard-gradient-top-2) 28%, transparent) 58%, color-mix(in srgb, var(--dashboard-gradient-top-2) 12%, transparent) 66%, transparent 72%)`,
              mixBlendMode: 'normal',
            }}
          />
          <div
            className="absolute inset-0 dashboard-gradient-3"
            style={{
              background: `radial-gradient(ellipse 90% 55% at 50% 100%, var(--dashboard-gradient-bottom) 0%, color-mix(in srgb, var(--dashboard-gradient-bottom) 88%, transparent) 10%, color-mix(in srgb, var(--dashboard-gradient-bottom) 75%, transparent) 20%, color-mix(in srgb, var(--dashboard-gradient-bottom) 60%, transparent) 32%, color-mix(in srgb, var(--dashboard-gradient-bottom) 45%, transparent) 44%, color-mix(in srgb, var(--dashboard-gradient-bottom) 28%, transparent) 54%, color-mix(in srgb, var(--dashboard-gradient-bottom) 12%, transparent) 61%, transparent 67%)`,
              mixBlendMode: 'normal',
            }}
          />
          {/* Subtle noise texture to smooth gradients (Lovable-style) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.025]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
              backgroundSize: '200px 200px',
              mixBlendMode: 'normal',
            }}
          />
        </div>

        {/* Content */}
        <div className="w-full max-w-2xl relative p-3 md:p-6 mt-15">
          {children}
        </div>
      </div>
      <FooterCompact />
    </div>
  );
}
