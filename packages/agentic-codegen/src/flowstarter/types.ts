export enum ProjectState {
  INTAKE = 'INTAKE',
  PREVIEW_READY = 'PREVIEW_READY',
  DEPOSIT_PAID = 'DEPOSIT_PAID',
  AGENTS_WORKING = 'AGENTS_WORKING',
  HUMAN_QA = 'HUMAN_QA',
  LIVE_SUBSCRIPTION = 'LIVE_SUBSCRIPTION',
}

export type SocialPlatform = 'instagram' | 'linkedin';

export interface SocialMediaTarget {
  platform: SocialPlatform;
  /** A handle such as `flowstarter` (without secrets or access tokens). */
  handle?: string;
  /** Canonical public profile URL supplied by the client. */
  profileUrl: string;
  scraper: {
    provider: string;
    jobId?: string;
    requestedAt?: string;
    status?: 'pending' | 'running' | 'complete' | 'failed';
  };
}

export interface BusinessIntakePayload {
  projectId: string;
  business: {
    name: string;
    niche: string;
    location: string;
    description?: string;
    targetAudience?: string;
    primaryGoal?: string;
    existingWebsiteUrl?: string;
  };
  socialMedia: SocialMediaTarget[];
  locale: string;
  submittedAt: string;
  consent: {
    publicProfileAnalysis: boolean;
    acceptedAt: string;
  };
}

export interface ScrapedTextDocument {
  sourceId: string;
  platform: SocialPlatform | 'website' | 'intake';
  kind: 'bio' | 'post' | 'caption' | 'about' | 'intake_answer';
  text: string;
  publishedAt?: string;
  sourceUrl?: string;
}

export interface ScrapedImageToken {
  sourceId: string;
  /** Private S3 object key. Never place signed URLs in prompts or logs. */
  objectKey: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Base64 is populated only in the transient analyzer worker. */
  base64?: string;
  altText?: string;
  sourceUrl?: string;
}

export interface ScrapeCorpus {
  projectId: string;
  documents: ScrapedTextDocument[];
  images: ScrapedImageToken[];
  completedAt: string;
}

export type HexColor = `#${string}`;

export interface BrandConfig {
  schemaVersion: '1.0';
  colors: {
    primary: HexColor;
    onPrimary: HexColor;
    secondary: HexColor;
    onSecondary: HexColor;
    accent: HexColor;
    onAccent: HexColor;
    background: HexColor;
    surface: HexColor;
    text: HexColor;
    mutedText: HexColor;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fallbackStack: string;
    source: 'google_fonts' | 'system';
  };
  voice: {
    /** All matrix values are normalized from 0 to 1. */
    formality: number;
    warmth: number;
    energy: number;
    playfulness: number;
    directness: number;
    adjectives: [string, string, string];
    avoidPhrases: string[];
    sampleHeadline: string;
    sampleBody: string;
    primaryCta: string;
  };
  ideas: {
    positioning: string;
    heroAngle: string;
    sections: Array<{
      id: string;
      purpose: string;
      evidenceSourceIds: string[];
    }>;
    contentThemes: string[];
  };
  evidence: {
    textSourceIds: string[];
    imageSourceIds: string[];
    assumptions: string[];
  };
}

export type BillingCadence = 'monthly' | 'yearly';

export interface ProjectBillingGate {
  currency: string;
  finalValueMinor: number;
  depositPercent: 20;
  balancePercent: 80;
  depositPaymentIntentId?: string;
  depositPaidAt?: string;
  balancePaymentIntentId?: string;
  balancePaidAt?: string;
  subscription?: {
    stripeSubscriptionId: string;
    cadence: BillingCadence;
    status: 'trialing' | 'active' | 'past_due' | 'canceled';
  };
}

export interface ProjectLifecycle {
  projectId: string;
  state: ProjectState;
  billing: ProjectBillingGate;
  brandConfig?: BrandConfig;
  template?: {
    slug: string;
    version: string;
    selectionReason: string;
  };
  previewUrl?: string;
  build?: {
    branch: string;
    worktreePath: string;
    pullRequestUrl?: string;
    stagingUrl?: string;
  };
  production?: {
    deploymentId: string;
    url: string;
    customDomain?: string;
  };
  updatedAt: string;
}

export interface TemplateCandidate {
  slug: string;
  displayName: string;
  description: string;
  category: string;
  useCase: string[];
  fileCount: number;
  totalLOC: number;
}

export interface TemplateSelection {
  slug: string;
  reason: string;
  matchedSignals: string[];
  confidence: number;
}

export interface TemplateScaffoldFile {
  path: string;
  content: string;
  type: 'file';
}

export interface TemplateScaffold {
  template: {
    metadata: TemplateCandidate & { features?: string[] };
    config: Record<string, unknown>;
  };
  files: TemplateScaffoldFile[];
}

export interface InlineEditRequest {
  projectId: string;
  targetId: string;
  originalContent: string;
  instruction: string;
  requestedBy: string;
}

export interface InlineEditResult {
  targetId: string;
  originalContent: string;
  replacementContent: string;
}

export interface MaintenanceRequest {
  projectId: string;
  requestedBy: string;
  requestedCapability: Exclude<
    import('./editor-policy').EditorCapability,
    'content'
  >;
  instruction: string;
  status: 'queued' | 'in_review' | 'completed' | 'declined';
  createdAt: string;
}
