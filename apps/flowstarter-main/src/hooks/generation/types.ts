import type { TemplateInfo, WebsiteProjectDetails } from '@/lib/ai/types';

export type ProjectDetails = WebsiteProjectDetails;

// Type definitions
export interface StepData {
  plan?: string;
  files?: number;
  tested?: boolean;
  score?: number;
  issues?: number;
  coverage?: number;
  test_files?: number;
  passed?: boolean;
  docs?: number;
  auto_fixed?: boolean;
  workspace_id?: string;
  [key: string]: unknown;
}

export interface GenerationStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped' | 'error';
  message?: string;
  data?: StepData;
}

export interface GenerationProgress {
  stage: string;
  step?: number;
  name?: string;
  message?: string;
  data?: StepData;
  html?: string; // Preview HTML from preview_updated events
  type?: string; // Event type (e.g., 'preview_updated')
  preview_url?: string; // Live preview URL from dev server
}

export interface QualityMetrics {
  code_review?: {
    passed: boolean;
    score: number;
    issues: Array<{
      severity: string;
      category: string;
      file: string;
      line: number;
      message: string;
    }>;
    metrics: {
      total_issues: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  validation?: {
    passed: boolean;
    coverage: number;
    met_requirements: string[];
    missing_requirements: string[];
  };
  performance?: {
    lighthouse_score: {
      performance: number;
      accessibility: number;
      best_practices: number;
      seo: number;
    };
    bundle_size: {
      total: number;
      js: number;
      css: number;
      status: string;
    };
  };
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationResult {
  siteId: string;
  generatedCode: string;
  files: GeneratedFile[];
  architecture?: string;
  tested: boolean;
  orchestrated: boolean;
  qualityMetrics?: QualityMetrics;
  daytonaWorkspace?: string;
  timestamp?: string;
}

// Re-export from shared types for convenience
export type { TemplateInfo, WebsiteProjectDetails };
// Keep ProjectDetails as alias for backward compatibility
export type ProjectDetails = WebsiteProjectDetails;

export interface UseStreamingWebsiteGenerationOptions {
  sessionId?: string | null; // Convex session ID for real-time sync
}

export interface UseStreamingWebsiteGenerationResult {
  isGenerating: boolean;
  progress: GenerationProgress | null;
  steps: GenerationStep[];
  currentStep: number;
  error: string | null;
  result: GenerationResult | null;
  previewUrl: string | null; // Live preview URL from dev server
  generate: (
    projectDetails: ProjectDetails,
    templateInfo: TemplateInfo,
    templateCode?: string
  ) => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

// No longer hardcoded - steps are built dynamically from agent stream

