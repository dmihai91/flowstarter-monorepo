/**
 * Project Name Agent - Type Definitions
 */

export interface NameGenerationResult {
  projectName: string;
  allOptions?: string[];
  category?: string;
  success: boolean;
}

export interface NameExtractionResult {
  projectName?: string;
  needsFollowUp?: boolean;
  suggestedName?: string;
  followUpMessage?: string;
  extractedRequirements?: string[];
  error?: boolean;
  errorType?: string;
  message?: string;
  canRetry?: boolean;
}

export interface ConversationContext {
  previousSuggestion?: string;
  projectDescription?: string;
  previouslySuggested?: string[];
  accumulatedRequirements?: string[];
}

export interface RefinementContext {
  previousName: string;
  refinementFeedback: string;
  projectDescription?: string;
  previouslySuggested?: string[];
  accumulatedRequirements?: string[];
}

export interface GenerateNameOptions {
  templateName?: string;
  returnAllOptions?: boolean;
  userContext?: import('./prompts').UserContext;
}
