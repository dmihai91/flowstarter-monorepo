/**
 * Shared type definitions for AI services
 * Used by both frontend and backend
 */

export interface TemplateInfo {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

/**
 * Frontend project details for website generation
 */
export interface WebsiteProjectDetails {
  name: string;
  description: string;
  targetUsers?: string;
  businessGoals?: string;
  USP?: string;
  brandTone?: string;
  keyServices?: string;
  designConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontHeading?: string;
    fontBody?: string;
  };
}
