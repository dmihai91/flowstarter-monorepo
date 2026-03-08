import type { Template } from '~/components/onboarding';
import type { OrchestratorStatusDTO } from '~/lib/hooks/types/orchestrator.dto';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  component?: React.ReactNode;
  /** Live agent events for AgentStatusMessage card */
  agentEvents?: import('~/components/editor/AgentActivityPanel').AgentActivityEvent[];
  isAgentActive?: boolean;
}

export interface SuggestedReply {
  id: string;
  text: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[]; // Array of hex colors [primary, secondary, accent, background, text]
  // For compatibility with TemplatePalette
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
}

export interface SystemFont {
  id: string;
  name: string;
  heading: string;
  body: string;
  googleFonts?: string; // Google Fonts import string
}

export interface AttachedImage {
  file: File;
  preview: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAMLINED ONBOARDING (6 Steps for <5 min completion)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Streamlined onboarding flow:
 * welcome → describe → name → quick-profile → business-uvp → template → personalization → creating → ready
 * 
 * Legacy steps are preserved for backward compatibility but deprecated.
 */
export type OnboardingStep =
  // === STREAMLINED FLOW ===
  | 'welcome'          // Greeting + showcase
  | 'describe'         // What do you sell + who is it for?
  | 'name'             // Project/business name
  | 'quick-profile'    // Goal + Offer + Tone - 3 multiple choice
  | 'business-uvp'     // What makes you different? (UVP)
  | 'business-offering' // Package/offering details + selling method
  | 'business-contact'  // Business contact info (email, phone, address, website)
  | 'template'         // Pick from recommended templates
  | 'personalization'  // Logo + Colors + Font
  | 'creating'         // Build in progress
  | 'ready'            // Done!
  
  // === LEGACY STEPS (deprecated, kept for migration) ===
  | 'business-audience'// @deprecated - merged into describe
  | 'business-goals'   // @deprecated - merged into quick-profile
  | 'business-tone'    // @deprecated - merged into quick-profile
  | 'business-selling' // @deprecated - merged into quick-profile
  | 'business-pricing' // @deprecated - merged into quick-profile
  | 'business-contact' // @deprecated - collect post-publish
  | 'business-summary' // @deprecated - removed
  | 'integrations';    // @deprecated - moved to post-publish

// ═══════════════════════════════════════════════════════════════════════════
// QUICK PROFILE - Replaces 8 business discovery steps
// ═══════════════════════════════════════════════════════════════════════════

/** Primary business goal - determines CTA structure */
export type BusinessGoal = 'leads' | 'sales' | 'bookings';

/** Offer pricing tier - affects messaging strategy */
export type OfferType = 'high-ticket' | 'low-ticket' | 'free';

/** Brand tone - controls copy voice */
export type BrandTone = 'professional' | 'bold' | 'friendly';

/**
 * QuickProfile - The 3 essential choices collected in one step
 * Everything else is auto-inferred from the description
 */
export interface QuickProfile {
  goal: BusinessGoal;      // leads | sales | bookings
  offerType: OfferType;    // high-ticket | low-ticket | free
  tone: BrandTone;         // professional | bold | friendly
}

/** Display labels for quick profile options (icons are Lucide icon names) */
export const QUICK_PROFILE_OPTIONS = {
  goal: {
    leads: { label: 'Get Leads', description: 'Collect inquiries & contact info', icon: 'mail' },
    sales: { label: 'Make Sales', description: 'Sell products or services directly', icon: 'credit-card' },
    bookings: { label: 'Get Bookings', description: 'Schedule appointments & sessions', icon: 'calendar' },
  },
  offerType: {
    'high-ticket': { label: 'Premium', description: '€500+ per client', icon: 'gem' },
    'low-ticket': { label: 'Accessible', description: 'Under €500 per client', icon: 'tag' },
    free: { label: 'Free First', description: 'Free consultation or trial', icon: 'gift' },
  },
  tone: {
    professional: { label: 'Professional', description: 'Polished & trustworthy', icon: 'briefcase' },
    bold: { label: 'Bold', description: 'Energetic & confident', icon: 'zap' },
    friendly: { label: 'Friendly', description: 'Warm & approachable', icon: 'smile' },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS INFO (Simplified - mostly auto-inferred)
// ═══════════════════════════════════════════════════════════════════════════

export interface BusinessInfo {
  // Core (from description + quick profile)
  description: string;           // What they do + who they serve
  quickProfile: QuickProfile;    // Goal + Offer + Tone
  
  // Auto-inferred from description
  businessType?: string;         // e.g., "life coach", "therapist"
  targetAudience?: string;       // Extracted from description
  uvp?: string;                  // Unique value proposition (inferred)
  industry?: string;             // Category detection
  
  // Legacy fields (for backward compatibility)
  /** @deprecated Use quickProfile.goal instead */
  businessGoals?: string[];
  /** @deprecated Use quickProfile.tone instead */
  brandTone?: string;
  /** @deprecated Use quickProfile.goal to determine selling method */
  sellingMethod?: 'ecommerce' | 'bookings' | 'leads' | 'subscriptions' | 'content' | 'other';
  sellingMethodDetails?: string;
  offerings?: string;           // Package/offering description
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  website?: string;
  pricingOffers?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXISTING TYPES (Unchanged)
// ═══════════════════════════════════════════════════════════════════════════

export interface LogoInfo {
  type: 'uploaded' | 'generated' | 'none';
  url?: string;
  storageId?: string; // Convex storage ID for persisted logos
  file?: File;
  prompt?: string; // For AI-generated logos
}

export interface ContactDetails {
  email: string;
  phone?: string;
  address?: string;
  // Social links
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface PreviewInfo {
  url: string;
  status: 'starting' | 'ready' | 'error';
}

export type BuildPhase = 'idle' | 'generating' | 'cloning' | 'syncing' | 'installing' | 'starting' | 'customizing' | 'deploying' | 'deploying-upload' | 'deploying-install' | 'deploying-server' | 'deploying-waiting' | 'fixing' | 'fixing-retry' | 'complete' | 'complete-healed';

export interface InitialChatState {
  step: OnboardingStep;
  projectDescription: string;
  selectedTemplateId: string | null;
  selectedTemplateName: string | null;
  selectedPalette: ColorPalette | null;
  selectedFont: SystemFont | null;
  selectedLogo?: LogoInfo | null;
  projectUrlId: string | null;
  buildPhase?: BuildPhase;
  projectName?: string | null;

  // NEW: Quick profile for streamlined flow
  quickProfile?: QuickProfile | null;

  // Business info fields (now simplified)
  businessInfo?: BusinessInfo | null;
  messages: Array<{ id: string; role: string; content: string; createdAt: number }>;

  // Orchestration state (for resuming interrupted builds)
  orchestrationState?: 'idle' | 'running' | 'completed' | 'failed';
  orchestrationId?: string | null;

  // Integrations configured by user (moved to post-publish in new flow)
  integrations?: IntegrationConfig[];

  // Contact details (collected post-publish in new flow)
  contactDetails?: ContactDetails;

  // AI image generation preference (collected during personalization)
  useAiImages?: boolean;

  // Convex project ID for linking with database
  convexProjectId?: string | null;
}

export interface EditorChatPanelProps {
  onOpenTerminal?: () => void;
  userName?: string;
  userAvatar?: string;
  conversationId?: string;
  initialState?: InitialChatState;

  /** Existing project ID from parent component (e.g., from conversation context) */
  projectId?: string | null;
  onProjectReady?: (urlId: string) => void;
  onStepChange?: (step: OnboardingStep) => void;
  onPreviewChange?: (preview: PreviewInfo | null) => void;
  onStateChange?: (state: Partial<InitialChatState>) => void;
  onOrchestrationStatusChange?: (status: OrchestratorStatusDTO) => void;
}

export interface CategoryColors {
  bg: string;
  text: string;
  gradient: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP FLOW HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** New streamlined step order */
export const STREAMLINED_STEPS: OnboardingStep[] = [
  'welcome',
  'describe', 
  'quick-profile',
  'business-uvp',
  'business-offering',
  'business-contact',
  'template',
  'personalization',
  'creating',
  'ready',
];

/** Check if a step is part of the new streamlined flow */
export function isStreamlinedStep(step: OnboardingStep): boolean {
  return STREAMLINED_STEPS.includes(step);
}

/** Get next step in streamlined flow */
export function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = STREAMLINED_STEPS.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex >= STREAMLINED_STEPS.length - 1) {
    return null;
  }
  return STREAMLINED_STEPS[currentIndex + 1];
}

/** Get previous step in streamlined flow */
export function getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = STREAMLINED_STEPS.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return STREAMLINED_STEPS[currentIndex - 1];
}

/** Get step progress (0-100) */
export function getStepProgress(step: OnboardingStep): number {
  const index = STREAMLINED_STEPS.indexOf(step);
  if (index === -1) return 0;
  return Math.round((index / (STREAMLINED_STEPS.length - 1)) * 100);
}

export type { Template };
