import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColorPalette } from '~/lib/stores/palettes';
import type { Template } from '~/components/editor/template-preview/types';
import { DEFAULT_PALETTE } from '~/components/editor/template-preview/constants';

interface UseTemplateThemeResult {
  selectedPalette: ColorPalette;
  setSelectedPalette: (palette: ColorPalette) => void;
  templatePalette: ColorPalette;
  isLoadingTheme: boolean;
}

// ─── Fetch Template Theme ───────────────────────────────────────────────────

async function fetchTemplateTheme(templateId: string): Promise<ColorPalette | null> {
  const response = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'theme', slug: templateId }),
  });

  const data = (await response.json()) as { success: boolean; data?: any };

  if (data.success && data.data) {
    let themeData = data.data;

    if (data.data?.content?.[0]?.text) {
      try {
        themeData = JSON.parse(data.data.content[0].text);
      } catch {
        // Keep as-is
      }
    }

    const theme = themeData?.theme || themeData?.colors || themeData;

    if (theme && (theme.primary || theme.colors?.primary)) {
      const primary = theme.primary || theme.colors?.primary || '#4D5DD9';
      const secondary = theme.secondary || theme.colors?.secondary || '#C1C8FF';
      const accent = theme.accent || theme.colors?.accent || secondary;
      const background = theme.background || theme.colors?.background || '#0F0F1A';

      return {
        id: 'default',
        name: 'Original',
        colors: [primary, secondary, accent, background] as [string, string, string, string],
      };
    }
  }

  return null;
}

export function useTemplateTheme(
  template: Template | null,
  isOpen: boolean,
  initialPalette: ColorPalette | null | undefined,
): UseTemplateThemeResult {
  // Ensure we always have a valid initial palette
  const safeInitialPalette = initialPalette || DEFAULT_PALETTE;
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(safeInitialPalette);

  // Track if we've already initialized for this dialog session
  const hasInitializedRef = useRef(false);
  const lastTemplateIdRef = useRef<string | null>(null);

  // ─── React Query for Theme ────────────────────────────────────────────────
  const {
    data: fetchedTheme,
    isLoading: isLoadingTheme,
  } = useQuery({
    queryKey: ['templateTheme', template?.id],
    queryFn: () => fetchTemplateTheme(template!.id),
    enabled: !!template?.id && isOpen,
    staleTime: 30 * 60 * 1000, // 30 minutes - themes rarely change
    gcTime: 60 * 60 * 1000,    // 1 hour
  });

  // Compute template palette from fetched theme or template data
  const templatePalette = useMemo<ColorPalette>(() => {
    if (fetchedTheme) {
      return fetchedTheme;
    }

    if (template?.theme) {
      return {
        id: 'default',
        name: 'Original',
        colors: [
          template.theme.colors?.primary || '#4D5DD9',
          template.theme.colors?.secondary || '#C1C8FF',
          template.theme.colors?.accent || '#C1C8FF',
          template.theme.colors?.background || '#0F0F1A',
        ] as [string, string, string, string],
      };
    }

    return DEFAULT_PALETTE;
  }, [template?.theme, fetchedTheme]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [isOpen]);

  // Update selected palette when theme is fetched
  useEffect(() => {
    if (!isOpen || !template?.id) return;

    // Handle template change - reset to initial palette
    if (lastTemplateIdRef.current !== template.id) {
      lastTemplateIdRef.current = template.id;
      setSelectedPalette(safeInitialPalette);
      hasInitializedRef.current = false;
    }

    // When theme is fetched, update selected palette if using default
    if (fetchedTheme && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (safeInitialPalette.id === 'default') {
        setSelectedPalette(fetchedTheme);
      }
    }
  }, [template?.id, isOpen, fetchedTheme, safeInitialPalette]);

  // Stable setter that won't cause unnecessary re-renders
  const handleSetSelectedPalette = useCallback((palette: ColorPalette) => {
    setSelectedPalette(palette);
  }, []);

  return {
    selectedPalette,
    setSelectedPalette: handleSetSelectedPalette,
    templatePalette,
    isLoadingTheme,
  };
}

