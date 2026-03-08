/**
 * Types and model configuration for the template customization API.
 */

// Phase 1: Architect (strategic planning) - Opus 4.6 for best quality
export const ARCHITECT_MODEL = 'anthropic/claude-opus-4-6';
// Phase 2: Builder (fast execution)
export const BUILDER_MODEL = 'moonshotai/kimi-k2-instruct-0905';
// Fallback if primary fails
export const FALLBACK_MODEL = 'deepseek/deepseek-chat';

export interface BusinessInfo {
  uvp: string;
  targetAudience: string;
  businessGoals: string[];
  brandTone: string;
  pricingOffers?: string;
}

export interface CustomizationRequest {
  files: Record<string, string>;
  projectDescription: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  templateName?: string;
  businessInfo?: BusinessInfo;
}

export interface DesignBrief {
  brandPersonality: string;
  toneGuidelines: string;
  heroHeadline: string;
  heroSubheadline: string;
  tagline: string;
  valuePropositions: string[];
  keyBenefits: string[];
  socialProof: string;
  primaryCTA: string;
  secondaryCTA: string;
  aboutSection: { headline: string; paragraph: string };
  servicesSection: {
    headline: string;
    items: { title: string; description: string }[];
  };
  contactSection: { headline: string; subheadline: string };
  colorUsage: { primary: string; secondary: string; accent: string };
  avoidList: string[];
}

export interface StreamEvent {
  type: 'progress' | 'file' | 'file_content' | 'done' | 'error';
  data: Record<string, unknown>;
}
