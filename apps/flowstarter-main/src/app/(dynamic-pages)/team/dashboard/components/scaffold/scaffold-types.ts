import type { EngineArtifacts } from '@/lib/engine/contracts';

// ── Phase ────────────────────────────────────────────────────────────────────

export type ScaffoldPhase =
  | 'client'
  | 'input'
  | 'progress'
  | 'clarify'
  | 'review'
  | 'template'
  | 'personalization'
  | 'logo'
  | 'integrations'
  | 'domain'
  | 'payment'
  | 'build';

// ── Logo ─────────────────────────────────────────────────────────────────────

export interface SelectedLogo {
  type: 'uploaded' | 'text' | 'none';
  url?: string;
  name?: string;
}

// ── Integrations ─────────────────────────────────────────────────────────────

export interface IntegrationsConfig {
  calendly?: { enabled: boolean; url: string };
  googleAnalytics?: { enabled: boolean; measurementId: string };
  mailchimp?: { enabled: boolean; audienceId: string; apiKey: string };
  stripe?: { enabled: boolean; publishableKey: string; priceId?: string };
}

// ── Enums (mirrors editor-engine contracts) ──────────────────────────────────

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
export type PagePref = 'single-page' | 'multi-page';
export type Integration =
  | 'booking'
  | 'newsletter'
  | 'analytics'
  | 'leadCapture';

// ── Template design ──────────────────────────────────────────────────────────

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
  heading: { family: string; weight?: number };
  body: { family: string; weight?: number };
}

// ── Brand profile ────────────────────────────────────────────────────────────

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

// ── Draft — all fields editable, matches ProjectBrief structure ──────────────

export interface ProjectBriefDraft {
  projectName: string;
  industry: string;
  summary: string;
  targetAudience: string;
  valueProposition: string;
  offerings: string[];
  goals: ProjectGoal[];
  offerType: OfferType;
  brandTone: BrandTone;
  pagePreference: PagePref;
  integrations: Integration[];
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  valuePropositionDetail: string;
  primaryGoal: string;
  desiredCustomerAction: string;
  differentiators: string[];
  trustSignals: string[];
  contentStylePreference: string;
  brandSecondaryTones: BrandTone[];
  brandNotes: string;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  businessName?: string;
}

export interface AiStep {
  label: string;
  done: boolean;
}

export type ConciergeResponse =
  | { status: 'needsMoreInfo'; followUpQuestions: string[] }
  | ({ status: 'complete' } & EngineArtifacts);

// ── Defaults ─────────────────────────────────────────────────────────────────

export const EMPTY_CLIENT: ClientInfo = {
  name: '',
  email: '',
  phone: '',
  businessName: '',
};

export const EMPTY_BRIEF: ProjectBriefDraft = {
  projectName: '',
  industry: '',
  summary: '',
  targetAudience: '',
  valueProposition: '',
  offerings: [],
  goals: [],
  offerType: 'accessible',
  brandTone: 'professional',
  pagePreference: 'multi-page',
  integrations: [],
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  valuePropositionDetail: '',
  primaryGoal: '',
  desiredCustomerAction: '',
  differentiators: [],
  trustSignals: [],
  contentStylePreference: '',
  brandSecondaryTones: [],
  brandNotes: '',
};

export const REVIEW_STEP_COUNT = 4;

// ── Helpers ──────────────────────────────────────────────────────────────────

export function briefFromEngine(
  brief: EngineArtifacts['projectBrief']
): ProjectBriefDraft {
  const goal = brief.goal as ProjectGoal | undefined;
  return {
    projectName: brief.siteName || '',
    industry: brief.industry || '',
    summary: brief.summary || '',
    targetAudience: brief.targetAudience || '',
    valueProposition: brief.usp || '',
    offerings: brief.offerings || [],
    goals: goal ? [goal] : [],
    offerType: (brief.offerType as OfferType) || 'accessible',
    brandTone: (brief.brandTone as BrandTone) || 'professional',
    pagePreference: 'multi-page',
    integrations: [],
    contactEmail: brief.contact.email || '',
    contactPhone: brief.contact.phone || '',
    contactAddress: brief.contact.address || '',
    valuePropositionDetail: '',
    primaryGoal: '',
    desiredCustomerAction: '',
    differentiators: [],
    trustSignals: [],
    contentStylePreference: '',
    brandSecondaryTones: [],
    brandNotes: '',
  };
}

export function toBrandProfile(brief: ProjectBriefDraft): BrandProfile {
  return {
    brandTone: {
      primary: brief.brandTone,
      secondary:
        brief.brandSecondaryTones.length > 0
          ? brief.brandSecondaryTones
          : undefined,
      notes: brief.brandNotes || undefined,
    },
    valueProposition:
      brief.valuePropositionDetail || brief.valueProposition || undefined,
    primaryGoal: brief.primaryGoal || brief.goals[0] || undefined,
    desiredCustomerAction: brief.desiredCustomerAction || undefined,
    differentiators:
      brief.differentiators.length > 0 ? brief.differentiators : undefined,
    trustSignals:
      brief.trustSignals.length > 0 ? brief.trustSignals : undefined,
    contentStylePreference: brief.contentStylePreference || undefined,
    operatorNotes: brief.brandNotes || undefined,
  };
}
