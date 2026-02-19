'use client';

import { PreviewLoading } from '@/components/editor/PreviewLoading';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ProjectConfig } from '@/types/project-config';
import type { ProjectTemplate } from '@/types/project-types';
import { Check, Eye, Globe, Sparkles } from 'lucide-react';
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
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

  const displayUrl = useMemo(() => {
    // If we have project config with a name, use that for the URL
    if (projectConfig?.name) {
      const slug = projectConfig.name.toLowerCase().replace(/\s+/g, '-');
      return `https://${slug}.com`;
    }
    // Otherwise fall back to template slug
    const slug =
      (template as unknown as { slug?: string })?.slug || template.id;
    return `https://${slug}.com`;
  }, [template.id, template, projectConfig?.name]);

  const handleTemplateClick = () => {
    onSelectAction(template);
  };

  const previewProjectName = projectConfig?.name || template.name;

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

        {/* Hover-only Preview Icon */}
        <button
          type="button"
          aria-label={t('wizard.template.preview')}
          onClick={(e) => {
            e.stopPropagation();
            setIsIframeLoading(true);
            setIsPreviewOpen(true);
          }}
          className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-black/45 dark:bg-white/10 backdrop-blur flex items-center justify-center text-white/90 active:bg-black/70 sm:hover:bg-black/60 focus:outline-hidden focus:ring-2 focus:ring-white/50 touch-manipulation"
        >
          <Eye className="w-4 h-4 sm:w-4 sm:h-4 text-white/90" />
        </button>
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

      {/* Fullscreen Preview Modal - renders live HTML via iframe */}
      <Dialog
        open={isPreviewOpen}
        onOpenChange={(open) => {
          setIsPreviewOpen(open);
          // Reset loader each time preview is opened
          if (open) {
            setIsIframeLoading(true);
          }
        }}
      >
        <DialogContent
          className="p-0 fixed inset-0 top-0! left-0! translate-x-0! translate-y-0! max-w-none! w-screen! h-dvh! rounded-none border-0 sm:max-w-none! overflow-hidden"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            transform: 'none',
          }}
        >
          <DialogTitle className="sr-only">
            {t('wizard.template.preview')}: {template.name}
          </DialogTitle>
          <div className="relative flex flex-col w-full h-[100dvh] bg-background">
            {/* Header */}
            <div className="w-full border-b border-border bg-background/80 backdrop-blur px-6 py-4 shrink-0">
              <div className="w-full">
                <div className="text-sm font-medium text-foreground">
                  {template.name} — {t('wizard.template.preview')}
                </div>
                {template.description ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Content - Full Width Preview */}
            <div className="w-full flex-1 overflow-hidden flex flex-col">
              {/* Faux browser chrome */}
              <div className="flex items-center gap-3 px-3 py-2 bg-muted border-b border-border shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground w-full min-w-0">
                    <Globe className="w-3.5 h-3.5 opacity-70" />
                    <span className="truncate">{displayUrl}</span>
                  </div>
                </div>
              </div>

              {/* Live compiled preview in iframe - Full Width */}
              <div className="relative w-full flex-1 bg-background overflow-hidden">
                {isIframeLoading && (
                  <div className="absolute inset-0 z-10">
                    <PreviewLoading
                      projectName={previewProjectName}
                      isGenerating={true}
                    />
                  </div>
                )}
                <iframe
                  src={(() => {
                    const params = new URLSearchParams({
                      theme: resolvedTheme === 'dark' ? 'dark' : 'light',
                      enhanceWithAI: 'true', // Always enable AI enhancement
                    });

                    if (projectConfig) {
                      if (projectConfig.name)
                        params.set('projectName', projectConfig.name);
                      if (projectConfig.description)
                        params.set(
                          'projectDescription',
                          projectConfig.description
                        );
                      if (projectConfig.USP)
                        params.set('projectUSP', projectConfig.USP);
                      if (projectConfig.targetUsers)
                        params.set('targetUsers', projectConfig.targetUsers);
                    }

                    return `/template-preview/${
                      template.id
                    }?${params.toString()}`;
                  })()}
                  className="w-full h-full border-0"
                  title={`${template.name} preview`}
                  sandbox="allow-scripts allow-same-origin"
                  onLoad={() => setIsIframeLoading(false)}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
