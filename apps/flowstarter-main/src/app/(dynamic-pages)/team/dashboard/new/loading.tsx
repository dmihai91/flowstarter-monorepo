'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 relative">
      {/* Solid background to cover any gradient */}
      <div className="fixed inset-0 bg-[#FAFAFA] dark:bg-[#0a0a0c] z-[60]" />
      <div className="relative z-[70] flex flex-col items-center gap-4">
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
