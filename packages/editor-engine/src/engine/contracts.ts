export type FlowstarterEngineVersion = 'v1';

export type ProjectGoal =
  | 'leads'
  | 'bookings'
  | 'sales'
  | 'newsletter'
  | 'awareness';

export type OfferType = 'premium' | 'accessible' | 'free' | 'custom';

export type BrandTone =
  | 'professional'
  | 'warm'
  | 'premium'
  | 'playful'
  | 'minimalist'
  | 'bold'
  | 'calming'
  | 'trustworthy'
  | 'energetic'
  | 'modern';

export type PageIntent =
  | 'landing'
  | 'about'
  | 'services'
  | 'pricing'
  | 'contact';

export type IntegrationKind =
  | 'booking'
  | 'newsletter'
  | 'analytics'
  | 'leadCapture';

export interface BrandProfile {
  brandTone: {
    primary: BrandTone;
    secondary?: BrandTone[];
    notes?: string;
  };
  valueProposition?: string;
  primaryGoal?: string;
  desiredCustomerAction?: string;
  differentiators?: string[];
  trustSignals?: string[];
  contentStylePreference?: string;
  operatorNotes?: string;
}

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

export interface TemplateFont {
  id: string;
  name: string;
  heading: {
    family: string;
    weight?: number;
  };
  body: {
    family: string;
    weight?: number;
  };
}

export interface ProjectBrief {
  version: FlowstarterEngineVersion;
  source: 'concierge' | 'editor' | 'imported';
  projectId?: string;
  projectName: string;
  summary: string;
  business: {
    industry: string;
    targetAudience: string;
    valueProposition: string;
    brandTone: BrandTone;
    offerType: OfferType;
    offerings: string[];
    goals: ProjectGoal[];
  };
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };
  client?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  constraints: {
    preferredTemplateSlug?: string;
    platformType?: string;
    pagePreference: 'single-page' | 'multi-page';
    requiredIntegrations: IntegrationKind[];
  };
  brandProfile?: BrandProfile;
  sourceData: Record<string, unknown>;
}

export interface TemplateRegistryEntry {
  slug: string;
  name: string;
  description: string;
  category: string;
  framework: string;
  features: string[];
  tags: string[];
  previewImage?: string;
  defaultPaletteId?: string;
  defaultFontId?: string;
  palettes: TemplatePalette[];
  fonts: TemplateFont[];
  integrations: Partial<Record<IntegrationKind, { optional: boolean; providers: string[] }>>;
}

export interface TemplateSelectionCandidate {
  templateSlug: string;
  score: number;
  reasons: string[];
}

export interface TemplateSelection {
  version: FlowstarterEngineVersion;
  templateSlug: string;
  templateName: string;
  strategy: 'manual' | 'deterministic' | 'fallback';
  score: number;
  reasons: string[];
  alternatives: TemplateSelectionCandidate[];
}

export interface BlockDefinition {
  type: string;
  label: string;
  editableFields: string[];
  allowedPageIntents: PageIntent[];
}

export interface AssemblySection {
  id: string;
  blockType: string;
  label: string;
  editableFields: string[];
  contentSlots: string[];
}

export interface AssemblyPage {
  id: string;
  path: string;
  title: string;
  intent: PageIntent;
  sections: AssemblySection[];
}

export interface AssemblyIntegration {
  kind: IntegrationKind;
  required: boolean;
  providerHint?: string;
  source: 'project-brief' | 'template' | 'default';
}

export interface AssemblySpec {
  version: FlowstarterEngineVersion;
  templateSlug: string;
  pages: AssemblyPage[];
  integrations: AssemblyIntegration[];
}

export interface ContentMapEntry {
  pageId: string;
  sectionId: string;
  slot: string;
  value: string;
}

export interface ContentMap {
  version: FlowstarterEngineVersion;
  entries: ContentMapEntry[];
}

export interface ValidationCheck {
  id: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface ValidationReport {
  version: FlowstarterEngineVersion;
  status: 'pass' | 'warn' | 'fail';
  checks: ValidationCheck[];
}

export interface NormalizeProjectBriefInput {
  source?: ProjectBrief['source'];
  projectId?: string;
  projectName?: string;
  summary?: string;
  industry?: string;
  targetAudience?: string;
  valueProposition?: string;
  brandTone?: string;
  offerType?: string;
  offerings?: string | string[];
  goals?: string | string[];
  platformType?: string;
  preferredTemplateSlug?: string;
  brandProfile?: BrandProfile;
  contact?: ProjectBrief['contact'];
  client?: ProjectBrief['client'];
  raw?: Record<string, unknown>;
}
