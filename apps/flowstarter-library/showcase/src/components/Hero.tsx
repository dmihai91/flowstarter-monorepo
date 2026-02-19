import React from 'react';
import { Sparkles, Code, Palette } from 'lucide-react';

interface HeroProps {
  templateCount: number;
}

export function Hero({ templateCount }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 via-transparent to-transparent dark:from-brand-950/20 dark:via-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-brand-400/10 dark:bg-brand-400/5 rounded-full blur-3xl" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/10 dark:bg-purple-400/5 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100/80 dark:bg-brand-900/30 border border-brand-200/50 dark:border-brand-800/30 mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
              {templateCount} Professional Templates
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="text-surface-900 dark:text-white">Build Websites</span>
            <br />
            <span className="bg-gradient-to-r from-brand-500 via-purple-500 to-brand-600 bg-clip-text text-transparent">
              In Minutes, Not Weeks
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto leading-relaxed">
            Beautiful, production-ready templates built with modern technologies.
            <span className="hidden sm:inline"> Start building faster with Flowstarter Library.</span>
          </p>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-surface-900 dark:text-white">{templateCount}</div>
                <div className="text-sm text-surface-500 dark:text-surface-400">Templates</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-surface-900 dark:text-white">Astro</div>
                <div className="text-sm text-surface-500 dark:text-surface-400">Framework</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-surface-900 dark:text-white">Tailwind</div>
                <div className="text-sm text-surface-500 dark:text-surface-400">Styling</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
