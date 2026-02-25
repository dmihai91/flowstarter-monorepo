'use client';

import { Sparkles, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export function QuickModeSection() {
  return (
    <div className="p-5 rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Quick Mode - AI powered</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
        Hi! Let&apos;s build the best site for your client. Tell us about the project and our AI will guide you to build it. Be specific and offer all details about the: industry, audience, goals, visual style.
      </p>

      {/* Input Area */}
      <Link 
        href="/team/dashboard/new"
        className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] hover:border-[var(--purple)]/50 hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors group"
      >
        <ImageIcon className="w-5 h-5 text-gray-400 dark:text-white/40 group-hover:text-[var(--purple)] transition-colors" />
        <span className="text-sm text-gray-500 dark:text-white/50 group-hover:text-gray-700 dark:group-hover:text-white/70 transition-colors">
          Describe your project or paste a reference...
        </span>
      </Link>
    </div>
  );
}
