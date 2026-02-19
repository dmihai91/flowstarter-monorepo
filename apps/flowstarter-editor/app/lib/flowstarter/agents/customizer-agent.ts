/**
 * CustomizerAgent - FlowOps-based Design Customization
 *
 * Unified agent for all design customization tasks:
 * - Font selection and pairing (from template metadata)
 * - Color palette generation (from template metadata)
 * - Theme customization
 * - Brand style application
 *
 * IMPORTANT: Fonts and palettes are sourced from template metadata,
 * NOT hardcoded. Templates from the MCP library include curated
 * palettes and fonts that match each template's aesthetic.
 *
 * Built on FlowOps protocol for standardized agent communication.
 */

import { BaseAgent, type AgentContext, type AgentResponse } from '~/lib/flowops/agent';
import { generateJSON } from '~/lib/services/llm';
import type { TemplatePalette, TemplateFont, Template } from '~/components/editor/template-preview/types';

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

export interface FontPairing {
  id: string;
  name: string;
  heading: string;
  body: string;
  googleFonts?: string;
}

export interface FontRecommendation {
  font: FontPairing;
  reasoning: string;
  matchScore: number;
}

export interface ColorPalette {
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

export interface PaletteRecommendation {
  palette: ColorPalette;
  reasoning: string;
  matchScore: number;
}

export interface ThemeCustomization {
  font: FontPairing;
  palette: ColorPalette;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  spacing?: 'compact' | 'normal' | 'relaxed';
  style?: 'minimal' | 'modern' | 'classic' | 'bold' | 'playful';
}

export interface BusinessContext {
  businessName: string;
  industry?: string;
  brandTone: string;
  targetAudience?: string;
  existingColors?: string[];
  preferences?: {
    darkMode?: boolean;
    colorPreferences?: string[];
    fontStyle?: 'serif' | 'sans-serif' | 'mixed';
  };
}

export interface CustomizeRequest {
  type: 'fonts' | 'palette' | 'theme' | 'full';
  template: Template;
  businessContext: BusinessContext;
  count?: number;
}

export interface CustomizeResponse {
  success: boolean;
  fonts?: FontRecommendation[];
  palettes?: PaletteRecommendation[];
  theme?: ThemeCustomization;
  error?: string;
}

/*
 * ============================================================================
 * Fallback Defaults (used when template has no metadata)
 * ============================================================================
 */

const DEFAULT_FONTS: TemplateFont[] = [
  {
    id: 'inter',
    name: 'Inter',
    heading: 'Inter',
    body: 'Inter',
    googleFonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
  {
    id: 'poppins-opensans',
    name: 'Poppins & Open Sans',
    heading: 'Poppins',
    body: 'Open Sans',
    googleFonts:
      'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Open+Sans:wght@400;500;600&display=swap',
  },
  {
    id: 'montserrat-lato',
    name: 'Montserrat & Lato',
    heading: 'Montserrat',
    body: 'Lato',
    googleFonts:
      'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Lato:wght@400;700&display=swap',
  },
];

const DEFAULT_PALETTES: TemplatePalette[] = [
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    colors: { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6', background: '#ffffff', text: '#0f172a' },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    colors: { primary: '#16a34a', secondary: '#15803d', accent: '#22c55e', background: '#f0fdf4', text: '#052e16' },
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    colors: { primary: '#ea580c', secondary: '#c2410c', accent: '#f97316', background: '#fffbeb', text: '#451a03' },
  },
];

/*
 * ============================================================================
 * CustomizerAgent Implementation
 * ============================================================================
 */

export class CustomizerAgent extends BaseAgent {
  constructor() {
    super({
      name: 'customizer',
      description: 'Handles font selection, color palette generation, and theme customization using template metadata',
      version: '2.0.0',
      systemPrompt: `You are an expert UI/UX designer specializing in typography and color theory.
Your job is to recommend fonts and color palettes from the available options that best match the brand's personality and target audience.
Always consider accessibility (contrast ratios) and modern design trends.`,
      allowedTools: [],
      allowedAgents: ['business-data', 'template-recommender'],
    });
  }

  protected async process(message: string, context: AgentContext): Promise<AgentResponse> {
    let request: CustomizeRequest;

    try {
      request = JSON.parse(message);
    } catch {
      return this.createErrorResponse('Invalid JSON. Expected CustomizeRequest object.');
    }

    if (!request.template) {
      return this.createErrorResponse('template is required');
    }

    if (!request.businessContext) {
      return this.createErrorResponse('businessContext is required');
    }

    context.onProgress?.('Generating design recommendations from template options...', 20);

    try {
      switch (request.type) {
        case 'fonts':
          return this.handleFonts(request, context);
        case 'palette':
          return this.handlePalette(request, context);
        case 'theme':
          return this.handleTheme(request, context);
        case 'full':
          return this.handleFull(request, context);
        default:
          return this.createErrorResponse(`Unknown request type: ${request.type}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Customization failed:', errMsg);

      return this.createErrorResponse(`Customization failed: ${errMsg}`);
    }
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Request Handlers
   * ──────────────────────────────────────────────────────────────────────────
   */

  private async handleFonts(request: CustomizeRequest, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Selecting font pairings from template options...', 40);

    const fonts = await this.recommendFonts(request.template, request.businessContext, request.count ?? 3);

    const response: CustomizeResponse = {
      success: true,
      fonts,
    };

    return this.createSuccessResponse(response);
  }

  private async handlePalette(request: CustomizeRequest, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Selecting color palettes from template options...', 40);

    const palettes = await this.recommendPalettes(request.template, request.businessContext, request.count ?? 3);

    const response: CustomizeResponse = {
      success: true,
      palettes,
    };

    return this.createSuccessResponse(response);
  }

  private async handleTheme(request: CustomizeRequest, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Creating theme from template options...', 40);

    const theme = await this.generateTheme(request.template, request.businessContext);

    const response: CustomizeResponse = {
      success: true,
      theme,
    };

    return this.createSuccessResponse(response);
  }

  private async handleFull(request: CustomizeRequest, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Generating full customization from template options...', 30);

    const fonts = await this.recommendFonts(request.template, request.businessContext, request.count ?? 3);
    context.onProgress?.('Fonts selected...', 50);

    const palettes = await this.recommendPalettes(request.template, request.businessContext, request.count ?? 3);
    context.onProgress?.('Palettes selected...', 70);

    const theme = await this.generateTheme(request.template, request.businessContext);
    context.onProgress?.('Theme created...', 90);

    const response: CustomizeResponse = {
      success: true,
      fonts,
      palettes,
      theme,
    };

    return this.createSuccessResponse(response);
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Font Recommendations (from template metadata)
   * ──────────────────────────────────────────────────────────────────────────
   */

  private async recommendFonts(template: Template, ctx: BusinessContext, count: number): Promise<FontRecommendation[]> {
    // Get fonts from template metadata, fallback to defaults
    const availableFonts: TemplateFont[] = template.fonts && template.fonts.length > 0 ? template.fonts : DEFAULT_FONTS;

    if (availableFonts.length < count) {
      // If we have fewer fonts than requested, return all with default reasoning
      return availableFonts.map((font, i) => ({
        font: this.templateFontToFontPairing(font),
        reasoning: `${font.name} is a curated font pairing for this template.`,
        matchScore: 90 - i * 5,
      }));
    }

    // Use LLM to rank fonts based on business context
    const prompt = `Given this business context:
- Business: ${ctx.businessName}
- Industry: ${ctx.industry || 'General'}
- Brand Tone: ${ctx.brandTone}
- Target Audience: ${ctx.targetAudience || 'General'}

Rank these font pairings from best to worst match:
${availableFonts.map((f, i) => `${i}. "${f.name}" - Heading: ${f.heading}, Body: ${f.body}`).join('\n')}

Respond with JSON:
{
  "rankings": [
    { "index": 0, "score": 95, "reasoning": "Why this font works for this brand" }
  ]
}
Include all ${availableFonts.length} fonts in rankings, sorted by score descending.`;

    try {
      const result = await generateJSON<{
        rankings: Array<{ index: number; score: number; reasoning: string }>;
      }>([{ role: 'user', content: prompt }], { temperature: 0.5 });

      const sortedRankings = result.rankings.sort((a, b) => b.score - a.score).slice(0, count);

      return sortedRankings.map((r) => ({
        font: this.templateFontToFontPairing(availableFonts[r.index]),
        reasoning: r.reasoning,
        matchScore: r.score,
      }));
    } catch {
      // Fallback: return first N fonts
      return availableFonts.slice(0, count).map((font, i) => ({
        font: this.templateFontToFontPairing(font),
        reasoning: `${font.name} is a curated font pairing for this template.`,
        matchScore: 90 - i * 5,
      }));
    }
  }

  private templateFontToFontPairing(font: TemplateFont): FontPairing {
    return {
      id: font.id,
      name: font.name,
      heading: font.heading,
      body: font.body,
      googleFonts: font.googleFonts,
    };
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Palette Recommendations (from template metadata)
   * ──────────────────────────────────────────────────────────────────────────
   */

  private async recommendPalettes(
    template: Template,
    ctx: BusinessContext,
    count: number,
  ): Promise<PaletteRecommendation[]> {
    // Get palettes from template metadata, fallback to defaults
    const availablePalettes: TemplatePalette[] =
      template.palettes && template.palettes.length > 0 ? template.palettes : DEFAULT_PALETTES;

    if (availablePalettes.length <= count) {
      // If we have fewer palettes than requested, return all
      return availablePalettes.map((palette, i) => ({
        palette: this.templatePaletteToColorPalette(palette),
        reasoning: `${palette.name} is a curated color palette for this template.`,
        matchScore: 90 - i * 5,
      }));
    }

    // Use LLM to rank palettes based on business context
    const prompt = `Given this business context:
- Business: ${ctx.businessName}
- Industry: ${ctx.industry || 'General'}
- Brand Tone: ${ctx.brandTone}
${ctx.existingColors?.length ? `- Existing brand colors: ${ctx.existingColors.join(', ')}` : ''}

Rank these color palettes from best to worst match:
${availablePalettes.map((p, i) => `${i}. "${p.name}" - Primary: ${p.colors.primary}, Accent: ${p.colors.accent}`).join('\n')}

Respond with JSON:
{
  "rankings": [
    { "index": 0, "score": 95, "reasoning": "Why this palette works for this brand" }
  ]
}
Include all ${availablePalettes.length} palettes in rankings, sorted by score descending.`;

    try {
      const result = await generateJSON<{
        rankings: Array<{ index: number; score: number; reasoning: string }>;
      }>([{ role: 'user', content: prompt }], { temperature: 0.5 });

      const sortedRankings = result.rankings.sort((a, b) => b.score - a.score).slice(0, count);

      return sortedRankings.map((r) => ({
        palette: this.templatePaletteToColorPalette(availablePalettes[r.index]),
        reasoning: r.reasoning,
        matchScore: r.score,
      }));
    } catch {
      // Fallback: return first N palettes
      return availablePalettes.slice(0, count).map((palette, i) => ({
        palette: this.templatePaletteToColorPalette(palette),
        reasoning: `${palette.name} is a curated color palette for this template.`,
        matchScore: 90 - i * 5,
      }));
    }
  }

  private templatePaletteToColorPalette(palette: TemplatePalette): ColorPalette {
    return {
      id: palette.id,
      name: palette.name,
      colors: palette.colors,
    };
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Theme Generation
   * ──────────────────────────────────────────────────────────────────────────
   */

  private async generateTheme(template: Template, ctx: BusinessContext): Promise<ThemeCustomization> {
    const fonts = await this.recommendFonts(template, ctx, 1);
    const palettes = await this.recommendPalettes(template, ctx, 1);

    // Determine style based on brand tone
    const styleMap: Record<string, ThemeCustomization['style']> = {
      professional: 'modern',
      corporate: 'classic',
      friendly: 'modern',
      playful: 'playful',
      luxury: 'classic',
      tech: 'minimal',
      modern: 'modern',
      bold: 'bold',
      minimal: 'minimal',
    };

    const borderRadiusMap: Record<string, ThemeCustomization['borderRadius']> = {
      professional: 'md',
      corporate: 'sm',
      friendly: 'lg',
      playful: 'full',
      luxury: 'none',
      tech: 'sm',
      modern: 'md',
      minimal: 'sm',
    };

    const defaultFont: FontPairing = {
      id: 'inter',
      name: 'Inter',
      heading: 'Inter',
      body: 'Inter',
    };

    const defaultPalette: ColorPalette = {
      id: 'default',
      name: 'Default',
      colors: { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6', background: '#ffffff', text: '#0f172a' },
    };

    return {
      font: fonts[0]?.font ?? defaultFont,
      palette: palettes[0]?.palette ?? defaultPalette,
      borderRadius: borderRadiusMap[ctx.brandTone.toLowerCase()] ?? 'md',
      spacing: 'normal',
      style: styleMap[ctx.brandTone.toLowerCase()] ?? 'modern',
    };
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Response Helpers
   * ──────────────────────────────────────────────────────────────────────────
   */

  private createSuccessResponse(data: CustomizeResponse): AgentResponse {
    return {
      message: this.createMessage('agent', JSON.stringify(data)),
      complete: true,
      toolCalls: [],
    };
  }

  private createErrorResponse(error: string): AgentResponse {
    const data: CustomizeResponse = {
      success: false,
      error,
    };
    return {
      message: this.createMessage('agent', JSON.stringify(data)),
      complete: false,
      nextAction: 'Provide valid input',
    };
  }
}

/*
 * ============================================================================
 * Singleton
 * ============================================================================
 */

let customizerAgentInstance: CustomizerAgent | null = null;

export function getCustomizerAgent(): CustomizerAgent {
  if (!customizerAgentInstance) {
    customizerAgentInstance = new CustomizerAgent();
  }

  return customizerAgentInstance;
}

export function resetCustomizerAgent(): void {
  customizerAgentInstance = null;
}


