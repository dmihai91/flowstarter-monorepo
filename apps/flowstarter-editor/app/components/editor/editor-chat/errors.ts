/**
 * Editor Chat Error Messages
 *
 * Centralized user-facing error messages with helpful suggestions.
 * These messages are designed to be informative while avoiding technical jargon.
 */

// ─── Error Message Types ──────────────────────────────────────────────────────

export interface ErrorMessage {
  /** The main error message shown to the user */
  readonly message: string;

  /** Suggested actions the user can take */
  readonly suggestions?: readonly string[];

  /** Whether this error is recoverable (affects UI presentation) */
  readonly recoverable: boolean;
}

// ─── Error Categories ─────────────────────────────────────────────────────────

export const BUILD_ERRORS = {
  MISSING_TEMPLATE: {
    message:
      "**Missing template selection**\n\nWe couldn't find your selected template. This might happen if you refreshed the page.",
    suggestions: ['Go back and select a template again', 'Try a different template'],
    recoverable: true,
  },
  MISSING_PALETTE: {
    message: "**Missing color palette**\n\nWe couldn't find your color choices. Let's pick them again.",
    suggestions: ['Select your colors again', 'Use the default palette'],
    recoverable: true,
  },
  CLONE_FAILED: {
    message:
      "**Couldn't create your project**\n\nWe ran into an issue while setting up your site. This is usually temporary.",
    suggestions: ['Try again', 'Choose a different template', 'Contact support if this keeps happening'],
    recoverable: true,
  },
  ORCHESTRATION_FAILED: {
    message:
      "**Customization interrupted**\n\nWe couldn't finish personalizing your site, but the base design is ready.",
    suggestions: ['Continue with the current design', 'Try customizing again', 'Make changes manually'],
    recoverable: true,
  },
  PREVIEW_FAILED: {
    message: "**Preview not available**\n\nWe're having trouble showing your site preview right now.",
    suggestions: ['Refresh the page', 'Wait a moment and try again', 'Check your internet connection'],
    recoverable: true,
  },
  SNAPSHOT_FAILED: {
    message:
      "**Couldn't save checkpoint**\n\nWe weren't able to save a snapshot of your work, but your changes are still there.",
    suggestions: ['Continue working - your current changes are safe', 'Try saving again later'],
    recoverable: true,
  },
} as const;

export const NAME_GENERATION_ERRORS = {
  GENERATION_FAILED: {
    message:
      "**Name generation unavailable**\n\nWe couldn't come up with a name right now. No worries - you can type your own!",
    suggestions: ['Type your own project name', 'Try generating again'],
    recoverable: true,
  },
  EXTRACTION_FAILED: {
    message:
      "**Couldn't understand your response**\n\nWe had trouble processing your input. Could you try a different approach?",
    suggestions: ['Type the project name directly', 'Ask for a suggestion'],
    recoverable: true,
  },
} as const;

export const BUSINESS_INFO_ERRORS = {
  GENERATION_FAILED: {
    message:
      "**Couldn't analyze your business**\n\nWe ran into an issue gathering business details. You can skip this step if needed.",
    suggestions: ['Try again', 'Skip and continue', 'Enter details manually'],
    recoverable: true,
  },
} as const;

export const TEMPLATE_ERRORS = {
  FETCH_FAILED: {
    message: "**Couldn't load templates**\n\nWe're having trouble fetching our template library right now.",
    suggestions: ['Refresh the page', 'Check your internet connection', 'Try again in a moment'],
    recoverable: true,
  },
  RECOMMENDATIONS_FAILED: {
    message:
      "**Recommendations unavailable**\n\nWe couldn't find personalized recommendations, but you can browse all templates.",
    suggestions: ['Browse all templates', 'Try describing your project differently'],
    recoverable: true,
  },
  THUMBNAIL_FAILED: {
    message: '', // Silent failure - just show placeholder
    recoverable: true,
  },
} as const;

export const AGENT_ERRORS = {
  EXECUTION_FAILED: {
    message: '**Update interrupted**\n\nWe ran into an issue while making changes to your site.',
    suggestions: ['Try the same request again', 'Try a simpler change first', 'Refresh and start fresh'],
    recoverable: true,
  },
  TASK_FAILED: {
    message:
      "**Task couldn't be completed**\n\nOne of the updates didn't work as expected. The rest of your site is fine.",
    suggestions: ['Check the preview and try again', 'Try a different approach', 'Undo recent changes'],
    recoverable: true,
  },
} as const;

export const FILE_ERRORS = {
  SYNC_FAILED: {
    message: "**Sync issue**\n\nWe couldn't save your latest changes to the server. Your local work is safe.",
    suggestions: ['Try saving again', 'Check your internet connection', 'Download a backup'],
    recoverable: true,
  },
  UPLOAD_FAILED: {
    message: "**Upload failed**\n\nWe couldn't process that file. Please check the format and try again.",
    suggestions: ['Try a different file', 'Make sure the file is under 5MB', 'Use a supported format (PNG, JPG, SVG)'],
    recoverable: true,
  },
} as const;

export const NETWORK_ERRORS = {
  CONNECTION_LOST: {
    message: "**Connection lost**\n\nIt looks like you've lost your internet connection.",
    suggestions: ['Check your WiFi or network', "Refresh when you're back online"],
    recoverable: true,
  },
  TIMEOUT: {
    message: '**Request timed out**\n\nThe server is taking longer than expected to respond.',
    suggestions: ['Try again', 'Wait a moment and retry', 'Simplify your request'],
    recoverable: true,
  },
  SERVER_ERROR: {
    message: '**Server issue**\n\nOur servers are experiencing some difficulties right now.',
    suggestions: ['Try again in a few minutes', 'Contact support if this persists'],
    recoverable: true,
  },
} as const;

// ─── Error Formatting ─────────────────────────────────────────────────────────

/**
 * Format an error message for display to the user.
 * Adds markdown formatting and suggestion buttons.
 */
export function formatErrorForUser(error: ErrorMessage): string {
  let formatted = error.message;

  if (error.suggestions && error.suggestions.length > 0) {
    formatted += '\n\n**What you can do:**\n';
    formatted += error.suggestions.map((s) => `- ${s}`).join('\n');
  }

  return formatted;
}

/**
 * Get a user-friendly error message from a technical error.
 * Maps common error patterns to friendly messages.
 */
export function getUserFriendlyError(error: unknown): ErrorMessage {
  const errorString = error instanceof Error ? error.message : String(error);
  const errorLower = errorString.toLowerCase();

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('enotfound')) {
    return NETWORK_ERRORS.CONNECTION_LOST;
  }

  if (errorLower.includes('timeout') || errorLower.includes('timedout')) {
    return NETWORK_ERRORS.TIMEOUT;
  }

  if (errorLower.includes('500') || errorLower.includes('502') || errorLower.includes('503')) {
    return NETWORK_ERRORS.SERVER_ERROR;
  }

  // Template errors
  if (errorLower.includes('template') && (errorLower.includes('not found') || errorLower.includes('missing'))) {
    return BUILD_ERRORS.MISSING_TEMPLATE;
  }

  // Clone/build errors
  if (errorLower.includes('clone') || errorLower.includes('copy')) {
    return BUILD_ERRORS.CLONE_FAILED;
  }

  // Orchestration errors
  if (errorLower.includes('orchestrat') || errorLower.includes('customiz')) {
    return BUILD_ERRORS.ORCHESTRATION_FAILED;
  }

  // Preview errors
  if (errorLower.includes('preview') || errorLower.includes('sandbox') || errorLower.includes('daytona')) {
    return BUILD_ERRORS.PREVIEW_FAILED;
  }

  // Default error
  return {
    message:
      "**Something unexpected happened**\n\nWe ran into an issue we didn't expect. Don't worry, your work should be safe.",
    suggestions: ['Try again', 'Refresh the page', 'Contact support if this keeps happening'],
    recoverable: true,
  };
}

// ─── Suggested Reply Generators ───────────────────────────────────────────────

import type { SuggestedReply } from './types';
import { SUGGESTED_REPLIES } from './constants';

/**
 * Generate suggested replies for an error scenario.
 * Uses translation keys from constants for i18n support.
 */
export function getErrorSuggestions(errorType: 'build' | 'name' | 'template' | 'agent' | 'generic'): SuggestedReply[] {
  switch (errorType) {
    case 'build':
      return SUGGESTED_REPLIES.errorBuild();
    case 'name':
      return SUGGESTED_REPLIES.errorName();
    case 'template':
      return SUGGESTED_REPLIES.errorTemplate();
    case 'agent':
      return SUGGESTED_REPLIES.errorAgent();
    case 'generic':
    default:
      return SUGGESTED_REPLIES.errorGeneric();
  }
}

