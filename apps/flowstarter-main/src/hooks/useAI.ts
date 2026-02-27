'use client';

import { useMutation } from '@tanstack/react-query';

export interface ClassifyProjectData {
  description: string;
}

export interface ClassifyProjectResult {
  industry: string;
  template: string;
  confidence: number;
}

export interface ModerateContentData {
  content: string;
  type?: 'description' | 'name' | 'general';
}

export interface ModerateContentResult {
  allowed: boolean;
  reason?: string;
  flagged_categories?: string[];
}

/**
 * Hook for classifying project industry/template based on description
 */
export function useAIClassify() {
  return useMutation({
    mutationFn: async (data: ClassifyProjectData): Promise<ClassifyProjectResult> => {
      const res = await fetch('/api/ai/classify-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to classify project');
      }
      return res.json();
    },
  });
}

/**
 * Hook for content moderation
 */
export function useAIModerate() {
  return useMutation({
    mutationFn: async (data: ModerateContentData): Promise<ModerateContentResult> => {
      const res = await fetch('/api/ai/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to moderate content');
      }
      return res.json();
    },
  });
}
