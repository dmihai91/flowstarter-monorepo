import { ProjectFeature } from './project-types';

export type ProjectWizardStep = 'details' | 'template' | 'design' | 'review';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string | { name: string; description: string; icon: string };
  features: string[] | ProjectFeature[];
  complexity: 'simple' | 'medium' | 'advanced';
  previewComponent?: string;
}

export interface DesignConfig {
  primaryColor: string;
  headingFont?: string;
  bodyFont?: string;
  generatedPalettes: Array<{
    name: string;
    description: string;
    colors: Record<string, string>;
  }>;
  selectedPalette: number;
  logoFile?: File | null;
  logoUrl?: string | null;
  logoPrompt?: string | null;
  logoOption: 'upload' | 'ai' | 'none';
  logoStyle?: string | null;
  logoColors?: string | null;
  businessInfo?: {
    industry: string;
    targetAudience: string;
    brandValues: string;
    competitors: string;
    additionalNotes: string;
  };
}

export interface DomainConfig {
  domain: string;
  provider: string;
  domainType: 'custom' | 'hosted';
}

export interface ProjectConfig {
  industry?: string;
  platformType?: string;
  name: string;
  description: string;
  userDescription?: string;
  targetUsers: string;
  businessGoals: string;
  logoDescription?: string;
  template: ProjectTemplate;
  designConfig: DesignConfig;
  domainConfig: DomainConfig;
  businessModel?: string;
  brandTone?: string;
  keyServices?: string;
  USP?: string;
  primaryCTA?: string;
  contactPreference?: string;
  additionalFeatures?: string;
  publishImmediately?: boolean;
  aiTemplateRecommendations?: Array<{
    templateId: string;
    score: number;
    reasons: string[];
  }>;
}

export interface WizardStepProps {
  onNext: () => void;
  onBack: () => void;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
}

export interface TemplateStepProps extends WizardStepProps {
  onTemplateSelect: (template: ProjectTemplate) => void;
  selectedTemplate: ProjectTemplate | null;
  initialAvailableIds?: string[];
}

export interface ConfigStepProps extends WizardStepProps {
  config: ProjectConfig;
  onConfigChange: (config: ProjectConfig) => void;
}

export interface FeaturesStepProps extends WizardStepProps {
  template: ProjectTemplate | null;
  selectedFeatures: string[];
  onFeatureToggle: (featureId: string) => void;
}

export interface DomainAvailabilityState {
  isChecking: boolean;
  isAvailable: boolean | null;
  domain: string;
  error?: string;
}

export interface DesignStepProps extends WizardStepProps {
  designConfig: DesignConfig;
  onDesignConfigChange: (config: DesignConfig) => void;
  onPrimaryColorChange: (color: string) => void;
  domainAvailability?: DomainAvailabilityState;
  onCheckDomainAvailability?: (domain: string) => Promise<void>;
}

export interface GenerateStepProps extends WizardStepProps {
  projectConfig: ProjectConfig;
  selectedTemplate: ProjectTemplate | null;
  selectedFeatures: string[];
  isGenerating: boolean;
  generationProgress: number;
  generationError: string | null;
  currentGenerationStep: string;
  onGenerate: () => void;
  onRetry: () => void;
}

export type PlatformType = 'business-site' | 'personal-brand' | 'portfolio';
