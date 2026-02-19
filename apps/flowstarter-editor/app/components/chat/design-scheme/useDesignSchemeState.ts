/**
 * useDesignSchemeState Hook
 *
 * Manages design scheme state including palette, features, fonts, and styling options.
 */

import { useState, useEffect, useCallback } from 'react';
import type { DesignScheme } from '~/types/design-scheme';
import { defaultDesignScheme } from '~/types/design-scheme';

export interface UseDesignSchemeStateProps {
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
}

export interface PaletteState {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export interface UseDesignSchemeStateReturn {
  // State
  palette: PaletteState;
  mode: 'light' | 'dark';
  features: string[];
  font: string[];
  borderRadius: string;
  shadow: string;
  spacing: string;
  isDialogOpen: boolean;
  activeSection: 'colors' | 'typography' | 'features' | 'styling';
  expandedColorGroups: string[];

  // Setters
  setPalette: (palette: PaletteState) => void;
  setMode: (mode: 'light' | 'dark') => void;
  setFeatures: (features: string[]) => void;
  setFont: (font: string[]) => void;
  setBorderRadius: (radius: string) => void;
  setShadow: (shadow: string) => void;
  setSpacing: (spacing: string) => void;
  setIsDialogOpen: (open: boolean) => void;
  setActiveSection: (section: 'colors' | 'typography' | 'features' | 'styling') => void;

  // Actions
  handleColorChange: (role: string, value: string) => void;
  handleFeatureToggle: (key: string) => void;
  handleFontToggle: (key: string) => void;
  handleSave: () => void;
  handleReset: () => void;
  toggleColorGroup: (groupKey: string) => void;

  // Computed
  getBorderRadius: () => string;
  getBoxShadow: () => string;
  getBorderRadiusPixels: (key: string) => string;
  getSpacingPixels: (key: string) => string;
}

export function useDesignSchemeState({
  designScheme,
  setDesignScheme,
}: UseDesignSchemeStateProps): UseDesignSchemeStateReturn {
  const [palette, setPalette] = useState<PaletteState>(() => {
    if (designScheme?.palette) {
      return {
        light: { ...defaultDesignScheme.palette.light, ...designScheme.palette.light },
        dark: { ...defaultDesignScheme.palette.dark, ...designScheme.palette.dark },
      };
    }

    return defaultDesignScheme.palette;
  });

  const [mode, setMode] = useState<'light' | 'dark'>(designScheme?.mode || defaultDesignScheme.mode);
  const [features, setFeatures] = useState<string[]>(designScheme?.features || defaultDesignScheme.features);
  const [font, setFont] = useState<string[]>(designScheme?.font || defaultDesignScheme.font);
  const [borderRadius, setBorderRadius] = useState<string>(
    designScheme?.borderRadius || defaultDesignScheme.borderRadius,
  );
  const [shadow, setShadow] = useState<string>(designScheme?.shadow || defaultDesignScheme.shadow);
  const [spacing, setSpacing] = useState<string>(designScheme?.spacing || defaultDesignScheme.spacing);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'features' | 'styling'>('colors');
  const [expandedColorGroups, setExpandedColorGroups] = useState<string[]>([
    'primary',
    'secondary',
    'accent',
    'background',
  ]);

  useEffect(() => {
    if (designScheme) {
      setPalette(() => ({
        light: { ...defaultDesignScheme.palette.light, ...(designScheme.palette?.light || {}) },
        dark: { ...defaultDesignScheme.palette.dark, ...(designScheme.palette?.dark || {}) },
      }));
      setMode(designScheme.mode || defaultDesignScheme.mode);
      setFeatures(designScheme.features || defaultDesignScheme.features);
      setFont(designScheme.font || defaultDesignScheme.font);
      setBorderRadius(designScheme.borderRadius || defaultDesignScheme.borderRadius);
      setShadow(designScheme.shadow || defaultDesignScheme.shadow);
      setSpacing(designScheme.spacing || defaultDesignScheme.spacing);
    } else {
      setPalette(defaultDesignScheme.palette);
      setMode(defaultDesignScheme.mode);
      setFeatures(defaultDesignScheme.features);
      setFont(defaultDesignScheme.font);
      setBorderRadius(defaultDesignScheme.borderRadius);
      setShadow(defaultDesignScheme.shadow);
      setSpacing(defaultDesignScheme.spacing);
    }
  }, [designScheme]);

  const handleColorChange = useCallback(
    (role: string, value: string) => {
      setPalette((prev) => ({
        ...prev,
        [mode]: {
          ...prev[mode],
          [role]: value,
        },
      }));
    },
    [mode],
  );

  const handleFeatureToggle = useCallback((key: string) => {
    setFeatures((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  }, []);

  const handleFontToggle = useCallback((key: string) => {
    setFont((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  }, []);

  const handleSave = useCallback(() => {
    setDesignScheme?.({ palette, features, font, mode, borderRadius, shadow, spacing });
    setIsDialogOpen(false);
  }, [palette, features, font, mode, borderRadius, shadow, spacing, setDesignScheme]);

  const handleReset = useCallback(() => {
    setPalette(defaultDesignScheme.palette);
    setMode(defaultDesignScheme.mode);
    setFeatures(defaultDesignScheme.features);
    setFont(defaultDesignScheme.font);
    setBorderRadius(defaultDesignScheme.borderRadius);
    setShadow(defaultDesignScheme.shadow);
    setSpacing(defaultDesignScheme.spacing);
  }, []);

  const toggleColorGroup = useCallback((groupKey: string) => {
    setExpandedColorGroups((prev) =>
      prev.includes(groupKey) ? prev.filter((key) => key !== groupKey) : [...prev, groupKey],
    );
  }, []);

  const getBorderRadius = useCallback(() => {
    if (features.includes('rounded')) {
      return '1.5rem';
    }

    switch (borderRadius) {
      case 'none':
        return '0px';
      case 'sm':
        return '0.25rem';
      case 'md':
        return '0.375rem';
      case 'lg':
        return '0.5rem';
      case 'xl':
        return '0.75rem';
      default:
        return '1rem';
    }
  }, [features, borderRadius]);

  const getBoxShadow = useCallback(() => {
    if (!features.includes('shadow')) {
      return 'none';
    }

    switch (shadow) {
      case 'none':
        return 'none';
      case 'sm':
        return '0 1px 2px 0 rgb(0 0 0 / 0.1)';
      case 'md':
        return '0 4px 6px -1px rgb(0 0 0 / 0.1)';
      case 'lg':
        return '0 10px 15px -3px rgb(0 0 0 / 0.1)';
      case 'xl':
        return '0 20px 25px -5px rgb(0 0 0 / 0.1)';
      default:
        return 'none';
    }
  }, [features, shadow]);

  const getBorderRadiusPixels = useCallback((key: string): string => {
    switch (key) {
      case 'none':
        return '0px';
      case 'sm':
        return '0.25rem';
      case 'md':
        return '0.375rem';
      case 'lg':
        return '0.5rem';
      case 'xl':
        return '0.75rem';
      case 'full':
        return '9999px';
      default:
        return '0.375rem';
    }
  }, []);

  const getSpacingPixels = useCallback((key: string): string => {
    switch (key) {
      case 'tight':
        return '0.5rem';
      case 'normal':
        return '1rem';
      case 'relaxed':
        return '1.25rem';
      case 'loose':
        return '1.5rem';
      default:
        return '1rem';
    }
  }, []);

  return {
    // State
    palette,
    mode,
    features,
    font,
    borderRadius,
    shadow,
    spacing,
    isDialogOpen,
    activeSection,
    expandedColorGroups,

    // Setters
    setPalette,
    setMode,
    setFeatures,
    setFont,
    setBorderRadius,
    setShadow,
    setSpacing,
    setIsDialogOpen,
    setActiveSection,

    // Actions
    handleColorChange,
    handleFeatureToggle,
    handleFontToggle,
    handleSave,
    handleReset,
    toggleColorGroup,

    // Computed
    getBorderRadius,
    getBoxShadow,
    getBorderRadiusPixels,
    getSpacingPixels,
  };
}

