/**
 * useTemplateSelection Hook
 *
 * Manages deterministic template browsing and selection. Initial template
 * choice comes from the main platform handoff; editor-side AI recommendations
 * are retired.
 */

import { useState, useCallback } from 'react';
import { useTemplates } from '~/lib/hooks/useTemplates';
import type { Template } from '~/components/onboarding';
import type { TemplateRecommendation } from '~/components/editor/template-preview/types';
import type { BusinessInfo } from '../types';
import type { UseTemplateSelectionOptions, UseTemplateSelectionReturn } from '../types/sharedState';

export function useTemplateSelection(options: UseTemplateSelectionOptions = {}): UseTemplateSelectionReturn {
  const { onTemplateSelect, onRecommendationSelect } = options;

  const {
    templates,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useTemplates({ autoFetch: false });

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<string>>(new Set());
  const [selectedRecommendation, setSelectedRecommendation] = useState<TemplateRecommendation | null>(null);
  const [previewRecommendation, setPreviewRecommendation] = useState<TemplateRecommendation | null>(null);

  const handleTemplateSelect = useCallback(
    (template: Template) => {
      setSelectedTemplate(template);
      setSelectedRecommendation({
        template,
        palettes: template.palettes || [],
        fonts: template.fonts || [],
        reasoning: '',
        matchScore: 0,
      });
      onTemplateSelect?.(template);
    },
    [onTemplateSelect],
  );

  const handleRecommendationSelect = useCallback(
    (recommendation: TemplateRecommendation) => {
      setSelectedRecommendation(recommendation);
      setSelectedTemplate(recommendation.template);
      onRecommendationSelect?.(recommendation);
    },
    [onRecommendationSelect],
  );

  const fetchRecommendations = useCallback(
    async (_businessInfo: BusinessInfo, _projectName: string, _description: string) => {},
    [],
  );

  const handleThumbnailError = useCallback((templateId: string) => {
    setThumbnailErrors((prev) => new Set(prev).add(templateId));
  }, []);

  const openPreview = useCallback((templateOrRecommendation: Template | TemplateRecommendation) => {
    if ('template' in templateOrRecommendation && 'reasoning' in templateOrRecommendation) {
      const rec = templateOrRecommendation as TemplateRecommendation;
      setPreviewRecommendation(rec);
      setPreviewTemplate(rec.template);
      return;
    }

    setPreviewTemplate(templateOrRecommendation as Template);
    setPreviewRecommendation(null);
  }, []);

  return {
    templates,
    templatesLoading,
    templatesError,
    selectedTemplate,
    previewTemplate,
    thumbnailErrors,
    recommendations: [],
    recommendationsLoading: false,
    recommendationsError: null,
    selectedRecommendation,
    previewRecommendation,
    refetchTemplates,
    handleTemplateSelect,
    handleRecommendationSelect,
    fetchRecommendations,
    handleThumbnailError,
    openPreview,
    setPreviewTemplate,
    setPreviewRecommendation,
  };
}

export type { UseTemplateSelectionOptions, UseTemplateSelectionReturn };
