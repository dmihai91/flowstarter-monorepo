import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

// Keep this in sync with the client hook types
export type MessageType =
  | 'welcome'
  | 'after-description'
  | 'name-prompt'
  | 'after-name'
  | 'business-uvp-prompt'
  | 'business-audience-prompt'
  | 'business-goals-prompt'
  | 'business-tone-prompt'
  | 'business-selling-prompt'
  | 'business-pricing-prompt'
  | 'business-summary'
  | 'template-prompt'
  | 'personalization-prompt'
  | 'building'
  | 'complete'
  | 'error'
  | 'step-transition'
  | 'unsupported'; // For unsupported business types

// ═══════════════════════════════════════════════════════════════════════════
// CHAT CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

export interface ChatContext {
  projectDescription?: string;
  projectName?: string;
  templateName?: string;
  uvp?: string;
  targetAudience?: string;
  businessGoals?: string[];
  brandTone?: string;
  sellingMethod?: string;
  pricingOffers?: string;
  username?: string;
  projectId?: string;
  sessionId?: string; // For tracking unsupported requests

  // Step transition context
  fromStep?: string;
  toStep?: string;
  fromStepLabel?: string;
  toStepLabel?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ZOD SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const StepTransitionResponseSchema = z.object({
  acknowledgment: z.string().min(1, 'Acknowledgment is required'),
  projectName: z.string().optional(),
  prompt: z.string().min(1, 'Prompt is required'),
});

export type StepTransitionResponse = z.infer<typeof StepTransitionResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// SELLING METHOD TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SellingMethodCategory = 'ecommerce' | 'bookings' | 'leads' | 'subscriptions' | 'content' | 'other';

export interface ExtractedSellingMethod {
  category: SellingMethodCategory;
  details: string;
  confidence: 'high' | 'medium' | 'low';
}

// ═══════════════════════════════════════════════════════════════════════════
// USER INTENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UserIntent = 'confirm' | 'edit' | 'skip' | 'unclear';

export interface DetectedIntent {
  intent: UserIntent;
  editField?: string; // If intent is 'edit', which field they want to change
  confidence: 'high' | 'medium' | 'low';
}

export type IntentContext = 'summary-confirmation' | 'skip-pricing' | 'general';

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST BODY TYPE
// ═══════════════════════════════════════════════════════════════════════════

export interface OnboardingChatRequestBody {
  action: 'generate-message' | 'extract-selling-method' | 'detect-intent';
  messageType?: MessageType;
  context?: ChatContext;
  userInput?: string;
  intentContext?: IntentContext;
}
