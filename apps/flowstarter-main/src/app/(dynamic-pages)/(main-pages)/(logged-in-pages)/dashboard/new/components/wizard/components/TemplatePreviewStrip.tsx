'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ProjectTemplate } from '@/types/project-types';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface TemplatePreviewStripProps {
  templates: ProjectTemplate[];
  onSelectTemplateAction: (template: ProjectTemplate) => void;
  onViewAllAction: () => void;
  selectedTemplateId?: string;
}

export function TemplatePreviewStrip({
  templates,
  onSelectTemplateAction,
  onViewAllAction,
  selectedTemplateId,
}: TemplatePreviewStripProps) {
  const { t } = useTranslations();

  if (templates.length === 0) {
    return null;
  }

  // Show up to 3 templates
  const displayTemplates = templates.slice(0, 3);

  return (
    <div className="space-y-4 pt-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('wizard.transition.recommendedTemplates')}
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onViewAllAction}
          className="text-xs h-8 px-3"
        >
          {t('wizard.transition.viewAll')}
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {displayTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplateAction(template)}
              className={cn(
                'group relative rounded-xl border-2 overflow-hidden transition-all duration-200',
                'hover:border-primary/60 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50',
                isSelected
                  ? 'border-primary shadow-md'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              {/* Thumbnail */}
              <div className="relative aspect-16/10 bg-[var(--surface-2)] overflow-hidden">
                {template.thumbnailUrl ? (
                  <Image
                    src={template.thumbnailUrl}
                    alt={template.name}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Sparkles className="w-8 h-8" />
                  </div>
                )}

                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-primary text-white shadow-lg">
                    <Check className="w-3 h-3" />
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>

              {/* Template Info */}
              <div className="p-3 bg-white dark:bg-gray-900">
                <div className="font-medium text-xs text-gray-900 dark:text-gray-100 line-clamp-1">
                  {template.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                  {template.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-center text-muted-foreground">
        {t('wizard.transition.templatesBasedOnProject')}
      </p>
    </div>
  );
}
