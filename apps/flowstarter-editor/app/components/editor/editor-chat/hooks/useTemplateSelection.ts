/**
 * useTemplateSelection Hook
 *
 * Manages template browsing, selection, recommendations, and preview state.
 * Uses React Query for caching and deduplication.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTemplates } from '~/lib/hooks/useTemplates';
import { useRecommendations, queryKeys } from '~/lib/hooks/useApiQueries';
import type { Template } from '~/components/onboarding';
import type { TemplateRecommendation } from '~/components/editor/template-preview/types';
import type { BusinessInfo } from '../types';
import type { UseTemplateSelectionOptions, UseTemplateSelectionReturn } from '../types/sharedState';

export function useTemplateSelection(options: UseTemplateSelectionOptions = {}): UseTemplateSelectionReturn {
  const { onTemplateSelect, onRecommendationSelect } = options;
  const queryClient = useQueryClient();

  /*
   * ─── Templates from API ───────────────────────────────────────────────────
   * Note: autoFetch is false by default to improve startup performance.
   * Templates are fetched when the user reaches the template step.
   */
  const {
    templates,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useTemplates({ autoFetch: false });

  // ─── State ────────────────────────────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<string>>(new Set());

  // Recommendations state (for manual fetch control)
  const [recommendationParams, setRecommendationParams] = useState<{
    businessInfo: BusinessInfo;
    projectName: string;
    projectDescription: string;
  } | null>(null);

  const [selectedRecommendation, setSelectedRecommendation] = useState<TemplateRecommendation | null>(null);
  const [previewRecommendation, setPreviewRecommendation] = useState<TemplateRecommendation | null>(null);

  // ─── React Query for Recommendations ──────────────────────────────────────
  const {
    data: recommendations = [],
    isLoading: recommendationsLoading,
    error: recommendationsQueryError,
    refetch: refetchRecommendations,
  } = useRecommendations(recommendationParams);

  const recommendationsError = recommendationsQueryError
    ? recommendationsQueryError instanceof Error
      ? recommendationsQueryError.message
      : 'Failed to fetch recommendations'
    : null;

  // ─── Callbacks ────────────────────────────────────────────────────────────

  const handleTemplateSelect = useCallback(
    (template: Template) => {
      setSelectedTemplate(template);
      setSelectedRecommendation(null);
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

  /**
   * Fetch recommendations - triggers React Query
   * Results are cached by business info, so repeated calls with same info are instant
   */
  const fetchRecommendations = useCallback(
    async (businessInfo: BusinessInfo, projectName: string, description: string) => {
      if (!businessInfo || !description) {
        console.warn('[fetchRecommendations] Missing businessInfo or description');
        return;
      }

      // Set params to trigger React Query
      setRecommendationParams({
        businessInfo,
        projectName: projectName || 'My Project',
        projectDescription: description,
      });
    },
    [],
  );

  const handleThumbnailError = useCallback((templateId: string) => {
    setThumbnailErrors((prev) => new Set(prev).add(templateId));
  }, []);

  const openPreview = useCallback((templateOrRecommendation: Template | TemplateRecommendation) => {
    // Check if it's a recommendation (has 'template' property)
    if ('template' in templateOrRecommendation && 'reasoning' in templateOrRecommendation) {
      const rec = templateOrRecommendation as TemplateRecommendation;
      setPreviewRecommendation(rec);
      setPreviewTemplate(rec.template);
    } else {
      setPreviewTemplate(templateOrRecommendation as Template);
      setPreviewRecommendation(null);
    }
  }, []);

  return {
    // State
    templates,
    templatesLoading,
    templatesError,
    selectedTemplate,
    previewTemplate,
    thumbnailErrors,

    // Recommendations
    recommendations,
    recommendationsLoading,
    recommendationsError,
    selectedRecommendation,
    previewRecommendation,

    // Actions
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

