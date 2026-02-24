'use client';

import { Code2, Palette, Rocket, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AnimatedFeaturesVisual() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <div className="grid grid-cols-2 gap-3 w-full">
        {[
          {
            icon: Sparkles,
            label: 'AI Powered',
            color: 'var(--purple)',
            delay: '0s',
          },
          {
            icon: Code2,
            label: 'No Code',
            color: 'var(--blue)',
            delay: '0.2s',
          },
          {
            icon: Palette,
            label: 'Custom Design',
            color: 'var(--green)',
            delay: '0.4s',
          },
          {
            icon: Rocket,
            label: 'Fast Launch',
            color: 'var(--purple)',
            delay: '0.6s',
          },
        ].map((feature, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center gap-2 p-3 rounded-lg backdrop-blur-xl border border-white dark:border-white/40 animate-fade-in bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] shadow-lg"
            style={{
              animationDelay: feature.delay,
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse bg-[rgba(243,243,243,0.5)] dark:bg-[rgba(58,58,74,0.5)]"
              style={{
                animationDelay: feature.delay,
              }}
            >
              <feature.icon
                className="w-5 h-5"
                style={{ color: feature.color }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {feature.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
