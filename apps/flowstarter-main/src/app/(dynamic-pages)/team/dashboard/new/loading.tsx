'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 relative">
      {/* Wizard gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white dark:bg-[hsl(240,8%,17%)]">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 120% 70% at 0% 0%, var(--wizard-gradient-left) 0%, color-mix(in srgb, var(--wizard-gradient-left) 70%, transparent) 28%, transparent 85%)`,
            filter: 'blur(70px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 100% 65% at 100% 0%, var(--wizard-gradient-right) 0%, color-mix(in srgb, var(--wizard-gradient-right) 70%, transparent) 28%, transparent 85%)`,
            filter: 'blur(70px)',
          }}
        />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[var(--purple)]/10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--purple)]" />
        </div>
        <div className="text-center">
          <p className="text-gray-900 dark:text-white font-medium">Loading...</p>
        </div>
      </div>
    </div>
  );
}
