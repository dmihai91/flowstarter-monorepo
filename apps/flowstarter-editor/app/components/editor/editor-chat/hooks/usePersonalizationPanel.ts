/**
 * usePersonalizationPanel Hook
 *
 * Manages state and callbacks for the PersonalizationPanel component:
 * - Logo upload to Convex
 * - AI logo generation via React Query
 * - AI images toggle
 *
 * Note: Palette and font selection are now dashboard-only (handled by NewProjectWizard).
 */

import { useState, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { useMutation as useReactQueryMutation } from '@tanstack/react-query';
import { api } from '~/convex/_generated/api';
import type { Id } from '~/convex/_generated/dataModel';
import type { LogoInfo, BusinessInfo } from '~/components/editor/editor-chat/types';

type PersonalizationSection = 'logo';

interface UsePersonalizationPanelProps {
  initialUseAiImages?: boolean;
  businessInfo?: Partial<BusinessInfo>;
  onLogoSelect: (logo: LogoInfo, useAiImages?: boolean) => void;
}

export function usePersonalizationPanel({
  initialUseAiImages = false,
  businessInfo,
  onLogoSelect,
}: UsePersonalizationPanelProps) {
  const [currentSection, setCurrentSection] = useState<PersonalizationSection>('logo');
  const [selectedLogo, setSelectedLogo] = useState<LogoInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [useAiImages, setUseAiImages] = useState(initialUseAiImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex mutations for logo upload
  const generateUploadUrl = useMutation(api.logos.generateUploadUrl);
  const saveLogo = useMutation(api.logos.saveLogo);

  const sections: PersonalizationSection[] = ['logo'];
  const sectionIndex = sections.indexOf(currentSection);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file) {
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setGenerationError('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setGenerationError('Please upload an image file');
        return;
      }

      setUploading(true);
      setGenerationError(null);

      try {
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadResult.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadData = (await uploadResult.json()) as { storageId: Id<'_storage'> };
        const result = await saveLogo({
          projectId: businessInfo?.uvp || 'temp',
          storageId: uploadData.storageId,
          type: 'uploaded',
        });

        const logoInfo: LogoInfo = { type: 'uploaded', url: result.url!, file };
        setSelectedLogo(logoInfo);
        onLogoSelect(logoInfo, useAiImages);
      } catch (error) {
        console.error('Error uploading logo:', error);
        setGenerationError('Failed to upload logo. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl, saveLogo, businessInfo, onLogoSelect, useAiImages],
  );

  // React Query mutation for logo generation
  const generateLogoMutation = useReactQueryMutation({
    mutationFn: async (params: { prompt: string; businessInfo: Partial<BusinessInfo> | undefined }) => {
      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.prompt,
          businessInfo: {
            uvp: params.businessInfo?.uvp,
            brandTone: params.businessInfo?.brandTone,
            industry: params.businessInfo?.industry,
          },
        }),
      });

      const data = (await response.json()) as { success?: boolean; imageUrl?: string; error?: string };

      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || 'Failed to generate logo');
      }

      return data.imageUrl;
    },
    retry: 1,
    retryDelay: 2000,
  });

  const handleGenerateLogo = useCallback(async () => {
    if (!generationPrompt.trim()) {
      return;
    }

    setGenerating(true);
    setGenerationError(null);

    try {
      const imageUrl = await generateLogoMutation.mutateAsync({
        prompt: generationPrompt,
        businessInfo,
      });

      setGeneratedImageUrl(imageUrl);

      const logoInfo: LogoInfo = { type: 'generated', url: imageUrl, prompt: generationPrompt };
      setSelectedLogo(logoInfo);
      onLogoSelect(logoInfo, useAiImages);
    } catch (error) {
      console.error('Error generating logo:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate logo');
    } finally {
      setGenerating(false);
    }
  }, [generationPrompt, businessInfo, onLogoSelect, generateLogoMutation, useAiImages]);

  const handleSkipLogo = useCallback(() => {
    const logoInfo: LogoInfo = { type: 'none' };
    setSelectedLogo(logoInfo);
    onLogoSelect(logoInfo, useAiImages);
  }, [onLogoSelect, useAiImages]);

  /** Skip all remaining personalization — use defaults and proceed to build */
  const handleSkipAll = useCallback(() => {
    const logoInfo: LogoInfo = { type: 'none' };
    setSelectedLogo(logoInfo);
    onLogoSelect(logoInfo, useAiImages);
  }, [onLogoSelect, useAiImages]);

  /** Skip current section only */
  const handleSkipSection = useCallback(() => {
    if (currentSection === 'logo') {
      handleSkipLogo();
    }
  }, [currentSection, handleSkipLogo]);

  return {
    currentSection,
    sections,
    sectionIndex,
    selectedLogo,
    uploading,
    generating,
    generationPrompt,
    setGenerationPrompt,
    generationError,
    generatedImageUrl,
    useAiImages,
    setUseAiImages,
    fileInputRef,
    handleFileUpload,
    handleGenerateLogo,
    handleSkipLogo,
    handleSkipAll,
    handleSkipSection,
  };
}

export type { PersonalizationSection };
