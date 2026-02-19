'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from '@/lib/i18n';
import { useMemo } from 'react';

// Local icon asset
const assistantIconDark = '/assets/icons/assistant-dark.svg';

interface PreviewLoadingProps {
  projectName: string;
  isGenerating?: boolean;
}

export function PreviewLoading({
  projectName,
  isGenerating = true,
}: PreviewLoadingProps) {
  const { resolvedTheme } = useTheme();
  const isDark = useMemo(() => resolvedTheme === 'dark', [resolvedTheme]);
  const { t } = useTranslations();

  const title = t('wizard.review.generatingPreview', {
    projectName,
  });

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      {/* Main content */}
      <div className="relative flex flex-col items-center justify-center px-6 animate-fade-in z-10">
        {/* Glassmorphic card container */}
        <div className="glass-3d relative overflow-hidden rounded-[16px] px-8 py-10 backdrop-blur-xl border border-gray-300/60 dark:border-white/15 bg-white/50 dark:bg-[rgba(58,58,74,0.25)] shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_2px_6px_rgba(0,0,0,0.08)]">
          <div className="relative z-10 flex flex-col items-center">
            {/* Animated spinner with assistant icon */}
            <div className="relative w-20 h-20 mb-8">
              {/* Glow effect */}
              <div
                className="absolute inset-[-8px] rounded-full blur-xl animate-pulse"
                style={{
                  background: isDark
                    ? 'radial-gradient(circle, rgba(193, 200, 255, 0.2) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(193, 200, 255, 0.3) 0%, transparent 70%)',
                }}
              />

              {/* Rotating ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                style={{
                  animationDuration: '2s',
                  borderTopColor: isDark
                    ? 'rgba(193, 200, 255, 0.6)'
                    : 'rgba(193, 200, 255, 0.5)',
                  borderRightColor: isDark
                    ? 'rgba(193, 200, 255, 0.2)'
                    : 'rgba(193, 200, 255, 0.15)',
                }}
              />

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img
                    src={assistantIconDark}
                    alt="Flowstarter Assistant"
                    className="w-full h-full object-contain animate-pulse"
                    style={{
                      filter: isDark ? 'none' : 'brightness(0.8)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Text content */}
            <div className="text-center space-y-3 max-w-sm">
              <h3
                className="text-lg font-medium tracking-tight dark:text-white text-gray-900"
                style={{
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {title}
              </h3>

              <p
                className="text-sm leading-relaxed dark:text-[#bfbfc8] text-gray-600"
                style={{
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {t('wizard.review.generatingPreviewSubtitle')}
              </p>

              {/* Progress dots */}
              {isGenerating && (
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{
                        animationDelay: `${i * 0.15}s`,
                        background: isDark
                          ? 'rgba(193, 200, 255, 0.6)'
                          : 'rgba(193, 200, 255, 0.7)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
