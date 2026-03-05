'use client';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ProjectConfig } from '@/types/project-config';
import type { ProjectTemplate } from '@/types/project-types';
import { Check, Sparkles } from 'lucide-react';
import NextImage from 'next/image';
import { useEffect, useMemo, useState } from 'react';

type TemplateCardProps = {
  template: ProjectTemplate;
  isSelected: boolean;
  isRecommended: boolean;
  showRecommendedBadge?: boolean;
  onSelectAction: (template: ProjectTemplate) => void;
  projectConfig?: ProjectConfig;
};

export function TemplateCard({
  template,
  isSelected,
  isRecommended,
  showRecommendedBadge = false,
  onSelectAction,
  projectConfig,
}: TemplateCardProps) {
  const { t } = useTranslations();
  const { resolvedTheme } = useTheme();
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      // Mobile detection logic can be added here if needed in the future
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use theme-aware thumbnail URL (always use regular thumbnails, not mobile variants)
  const thumbSrc = useMemo(() => {
    if (!template.thumbnailUrl) return undefined;
    if (imageError) return undefined;

    // If dark mode and URL points to template-thumbnails, use -dark variant
    if (
      resolvedTheme === 'dark' &&
      template.thumbnailUrl.includes('/template-thumbnails/')
    ) {
      return template.thumbnailUrl.replace('.png', '-dark.png');
    }
    return template.thumbnailUrl;
  }, [template.thumbnailUrl, resolvedTheme, imageError]);

  const handleTemplateClick = () => {
    onSelectAction(template);
  };

  const handleTemplateDoubleClick = () => {
    onSelectAction(template);
    // Smooth scroll to continue button after selection
    setTimeout(() => {
      const continueButton = document.getElementById('wizard-continue-button');
      if (continueButton) {
        continueButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    }, 100);
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden will-change-transform transition-all duration-500 ease-out bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-lg sm:rounded-xl p-0 gap-0',
        isSelected
          ? 'border-0 ring-2 ring-offset-1 sm:ring-offset-2 ring-offset-transparent shadow-[0_8px_32px_0_rgba(31,38,135,0.25)] scale-[1.01] active:scale-[0.98] sm:hover:-translate-y-1'
          : 'border border-white/30 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] active:scale-[0.98] sm:hover:-translate-y-1 sm:hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--secondary-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transform-none'
      )}
      style={
        isSelected
          ? ({
              '--tw-ring-color': 'var(--wizard-section-template-bg)',
              boxShadow: `0 10px 15px -3px color-mix(in srgb, var(--wizard-section-template-bg) 25%, transparent), 0 4px 6px -4px color-mix(in srgb, var(--wizard-section-template-bg) 25%, transparent), 0 0 0 2px var(--wizard-section-template-bg)`,
            } as React.CSSProperties)
          : undefined
      }
      onClick={handleTemplateClick}
      onDoubleClick={handleTemplateDoubleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectAction(template);
        }
      }}
      aria-pressed={isSelected}
      aria-label={template.name}
    >
      <div className="relative aspect-4/3 bg-linear-to-br from-gray-200 to-gray-300 dark:from-[#3a3a44] dark:to-[#44444e] rounded-t-lg sm:rounded-t-xl overflow-hidden w-full">
        {thumbSrc && !imageError ? (
          <NextImage
            src={thumbSrc}
            alt={template.name}
            fill
            className="object-cover"
            loading="lazy"
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => {
              console.error('Failed to load thumbnail:', thumbSrc);
              setImageError(true);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              <div className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                {t('wizard.template.preview')}
              </div>
            </div>
          </div>
        )}

        {showRecommendedBadge && isRecommended && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-1 rounded-full bg-yellow-500 flex items-center gap-1 shadow-lg z-10">
            <Sparkles className="h-3 w-3 text-white" />
            <span className="text-sm sm:text-xs font-semibold text-white">
              {t('wizard.template.recommended')}
            </span>
          </div>
        )}
        {isSelected && (
          <div
            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-900 border-2 scale-100 opacity-100 z-10"
            style={{
              borderColor: 'var(--wizard-section-template-bg)',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Check
              className="h-4 w-4 sm:h-5 sm:w-5 transition-all"
              style={{ color: 'var(--wizard-section-template-bg)' }}
            />
          </div>
        )}
      </div>

      <CardHeader className="px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4 w-full">
        <CardTitle className="text-sm sm:text-base font-semibold text-foreground mb-1">
          {template.name}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm line-clamp-2 text-muted-foreground mb-2">
          {template.description}
        </CardDescription>
        {template.styleTags && template.styleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2">
            {template.styleTags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 sm:px-2 text-sm sm:text-xs rounded-full bg-gray-100/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 border border-gray-300/30 dark:border-gray-600/30"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
