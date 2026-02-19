/**
 * Claude Agent Service - Type Definitions
 *
 * Shared types for site generation.
 */

export interface IntegrationConfig {
  id: string;
  name: string;
  config: {
    provider?: string;
    url?: string;
    [key: string]: any;
  };
}

/**
 * Generated asset from fal.ai
 */
export interface GeneratedAsset {
  type: 'hero' | 'product' | 'team' | 'background' | 'feature';
  name: string;
  url: string;
  prompt?: string;
}

export interface SiteGenerationInput {
  projectId: string;
  siteName: string;
  /** Optional: used as fallback for businessInfo.name */
  projectName?: string;
  businessInfo: {
    name: string;
    tagline?: string;
    description?: string;
    services?: string[];
    /** Logo image URL or data URI, if uploaded */
    logo?: string;
    contact?: {
      email?: string;
      phone?: string;
      address?: string;
    };
  };
  template: {
    slug: string;
    name: string;
  };
  design: {
    primaryColor: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    headingFont?: string;
  };
  integrations?: IntegrationConfig[];
  
  /**
   * AI-generated assets from fal.ai
   * These will be used in the template instead of placeholders
   */
  generatedAssets?: GeneratedAsset[];
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface SiteGenerationResult {
  success: boolean;
  files?: GeneratedFile[];
  error?: string;
  /** Assets that were generated for this site */
  generatedAssets?: GeneratedAsset[];
}

export interface BuildError {
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

