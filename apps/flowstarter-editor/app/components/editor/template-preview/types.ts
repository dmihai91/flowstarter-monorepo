import type { ColorPalette } from '~/lib/stores/palettes';

export interface TemplateTheme {
  default: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

/**
 * Template-specific color palette
 * Each template has curated palettes that match its style
 */
export interface TemplatePalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

/**
 * Template-specific font pairing
 * Each template has curated font pairings that match its aesthetic
 */
export interface TemplateFont {
  id: string;
  name: string;
  heading: string;
  body: string;
  googleFonts?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  theme?: TemplateTheme;
  palettes?: TemplatePalette[];
  fonts?: TemplateFont[];
}

/**
 * Template recommendation returned by the recommend-templates API
 */
export interface TemplateRecommendation {
  template: Template;
  palettes: TemplatePalette[];
  fonts: TemplateFont[];
  reasoning: string;
  matchScore: number;
}

export interface TemplatePreviewDialogProps {
  isOpen: boolean;
  template: Template | null;
  initialPalette: ColorPalette;

  /** Recommendation palettes (from API recommendations) to include in palette dropdown */
  recommendationPalettes?: TemplatePalette[];
  onClose: () => void;
  onUseTemplate: (template: Template, palette: ColorPalette) => void;
}

export type ViewportType = 'mobile' | 'tablet' | 'desktop';

