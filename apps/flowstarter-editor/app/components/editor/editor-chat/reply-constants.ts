/**
 * Reply constants for the editor chat concierge flow.
 * Translation keys, labels, and pre-built reply sets.
 */

import type { SuggestedReply } from './types';
import { en } from '~/lib/i18n/locales/en';

export const REPLY_KEYS = {
  WELCOME_LETS_GO: 'welcome.lets_go',
  DESCRIBE_COACH: 'describe.coach',
  DESCRIBE_THERAPIST: 'describe.therapist',
  DESCRIBE_PHOTOGRAPHER: 'describe.photographer',
  DESCRIBE_TRAINER: 'describe.trainer',
  UVP_SKIP: 'uvp.skip',
  UVP_EXAMPLE_METHOD: 'uvp.example_method',
  UVP_EXAMPLE_EXPERIENCE: 'uvp.example_experience',
  UVP_EXAMPLE_RESULTS: 'uvp.example_results',
  NAME_USE_THIS: 'name.use_this',
  NAME_MAKE_PUNCHY: 'name.make_punchy',
  NAME_MORE_CREATIVE: 'name.more_creative',
  NAME_MORE_PROFESSIONAL: 'name.more_professional',
  NAME_SHORTER: 'name.shorter',
  NAME_TRY_ANOTHER: 'name.try_another',
  NAME_I_HAVE_OWN: 'name.i_have_own',
  NAME_TYPE_OWN: 'name.type_own',
  NAME_SUGGEST: 'name.suggest',
  NAME_TRY_AGAIN: 'name.try_again',
  BUSINESS_LOOKS_GOOD: 'business.looks_good',
  BUSINESS_LOOKS_GOOD_NOW: 'business.looks_good_now',
  BUSINESS_ADJUST: 'business.adjust',
  BUSINESS_SKIP: 'business.skip',
  BUILD_CUSTOMIZE: 'build.customize',
  BUILD_DIFFERENT_COLORS: 'build.different_colors',
  BUILD_ADD_SECTIONS: 'build.add_sections',
  ERROR_TRY_AGAIN: 'error.try_again',
  ERROR_TYPE_OWN_NAME: 'error.type_own_name',
  ERROR_PICK_DIFFERENT_TEMPLATE: 'error.pick_different_template',
  ERROR_START_OVER: 'error.start_over',
  ERROR_REFRESH_TEMPLATES: 'error.refresh_templates',
  ERROR_BROWSE_ALL: 'error.browse_all',
  ERROR_TRY_SIMPLER: 'error.try_simpler',
  ERROR_UNDO_CHANGES: 'error.undo_changes',
  ERROR_REFRESH_PAGE: 'error.refresh_page',
} as const;

export type ReplyKey = (typeof REPLY_KEYS)[keyof typeof REPLY_KEYS];

export const REPLY_LABELS: Record<ReplyKey, string> = {
  [REPLY_KEYS.WELCOME_LETS_GO]: en.quickIdeas['life-coach'],
  [REPLY_KEYS.DESCRIBE_COACH]: en.quickIdeas['business-coach'],
  [REPLY_KEYS.DESCRIBE_THERAPIST]: en.quickIdeas['therapist'],
  [REPLY_KEYS.DESCRIBE_PHOTOGRAPHER]: en.quickIdeas['photographer'],
  [REPLY_KEYS.DESCRIBE_TRAINER]: en.quickIdeas['personal-trainer'],
  [REPLY_KEYS.UVP_SKIP]: "Skip for now",
  [REPLY_KEYS.UVP_EXAMPLE_METHOD]: "I have a unique method",
  [REPLY_KEYS.UVP_EXAMPLE_EXPERIENCE]: "Years of experience",
  [REPLY_KEYS.UVP_EXAMPLE_RESULTS]: "Proven results",
  [REPLY_KEYS.NAME_USE_THIS]: 'Use this name',
  [REPLY_KEYS.NAME_MAKE_PUNCHY]: 'Make it punchy',
  [REPLY_KEYS.NAME_MORE_CREATIVE]: 'More creative',
  [REPLY_KEYS.NAME_MORE_PROFESSIONAL]: 'More professional',
  [REPLY_KEYS.NAME_SHORTER]: 'Shorter',
  [REPLY_KEYS.NAME_TRY_ANOTHER]: 'Try another',
  [REPLY_KEYS.NAME_I_HAVE_OWN]: 'I have my own',
  [REPLY_KEYS.NAME_TYPE_OWN]: 'Type my own',
  [REPLY_KEYS.NAME_SUGGEST]: 'Suggest a name',
  [REPLY_KEYS.NAME_TRY_AGAIN]: 'Try again',
  [REPLY_KEYS.BUSINESS_LOOKS_GOOD]: 'Looks good!',
  [REPLY_KEYS.BUSINESS_LOOKS_GOOD_NOW]: 'Actually, looks good now',
  [REPLY_KEYS.BUSINESS_ADJUST]: 'Let me adjust something',
  [REPLY_KEYS.BUSINESS_SKIP]: 'Skip this',
  [REPLY_KEYS.BUILD_CUSTOMIZE]: 'Make some changes',
  [REPLY_KEYS.BUILD_DIFFERENT_COLORS]: 'Try different colors',
  [REPLY_KEYS.BUILD_ADD_SECTIONS]: 'Add more sections',
  [REPLY_KEYS.ERROR_TRY_AGAIN]: 'Try again',
  [REPLY_KEYS.ERROR_TYPE_OWN_NAME]: 'Type my own name',
  [REPLY_KEYS.ERROR_PICK_DIFFERENT_TEMPLATE]: 'Pick different template',
  [REPLY_KEYS.ERROR_START_OVER]: 'Start over',
  [REPLY_KEYS.ERROR_REFRESH_TEMPLATES]: 'Refresh templates',
  [REPLY_KEYS.ERROR_BROWSE_ALL]: 'Browse all templates',
  [REPLY_KEYS.ERROR_TRY_SIMPLER]: 'Try something simpler',
  [REPLY_KEYS.ERROR_UNDO_CHANGES]: 'Undo recent changes',
  [REPLY_KEYS.ERROR_REFRESH_PAGE]: 'Refresh page',
};

export function getReplyLabel(key: ReplyKey): string {
  return REPLY_LABELS[key] || key;
}

export function createReply(id: string, key: ReplyKey): SuggestedReply {
  return { id, text: getReplyLabel(key) };
}

export const SUGGESTED_REPLIES = {
  welcomeStart: (): SuggestedReply[] => [
    createReply('example-coach', REPLY_KEYS.WELCOME_LETS_GO),
    createReply('example-business', REPLY_KEYS.DESCRIBE_COACH),
    createReply('example-therapist', REPLY_KEYS.DESCRIBE_THERAPIST),
    createReply('example-photographer', REPLY_KEYS.DESCRIBE_PHOTOGRAPHER),
    createReply('example-trainer', REPLY_KEYS.DESCRIBE_TRAINER),
  ],
  describeExamples: (): SuggestedReply[] => [
    createReply('example-coach', REPLY_KEYS.WELCOME_LETS_GO),
    createReply('example-business', REPLY_KEYS.DESCRIBE_COACH),
    createReply('example-therapist', REPLY_KEYS.DESCRIBE_THERAPIST),
    createReply('example-photographer', REPLY_KEYS.DESCRIBE_PHOTOGRAPHER),
    createReply('example-trainer', REPLY_KEYS.DESCRIBE_TRAINER),
  ],
  uvpPrompts: (): SuggestedReply[] => [
    createReply('uvp-method', REPLY_KEYS.UVP_EXAMPLE_METHOD),
    createReply('uvp-experience', REPLY_KEYS.UVP_EXAMPLE_EXPERIENCE),
    createReply('uvp-results', REPLY_KEYS.UVP_EXAMPLE_RESULTS),
    createReply('uvp-skip', REPLY_KEYS.UVP_SKIP),
  ],
  nameRefinement: (): SuggestedReply[] => [
    createReply('accept-name', REPLY_KEYS.NAME_USE_THIS),
    createReply('more-punchy', REPLY_KEYS.NAME_MAKE_PUNCHY),
    createReply('more-creative', REPLY_KEYS.NAME_MORE_CREATIVE),
    createReply('more-professional', REPLY_KEYS.NAME_MORE_PROFESSIONAL),
    createReply('shorter', REPLY_KEYS.NAME_SHORTER),
    createReply('try-another', REPLY_KEYS.NAME_TRY_ANOTHER),
    createReply('own-name', REPLY_KEYS.NAME_I_HAVE_OWN),
  ],
  nameRefinementWithName: (suggestedName: string): SuggestedReply[] => [
    { id: 'accept-name', text: `Yes, use "${suggestedName}"` },
    createReply('more-punchy', REPLY_KEYS.NAME_MAKE_PUNCHY),
    createReply('more-creative', REPLY_KEYS.NAME_MORE_CREATIVE),
    createReply('more-professional', REPLY_KEYS.NAME_MORE_PROFESSIONAL),
    createReply('shorter', REPLY_KEYS.NAME_SHORTER),
    createReply('try-another', REPLY_KEYS.NAME_TRY_ANOTHER),
    createReply('own-name', REPLY_KEYS.NAME_TYPE_OWN),
  ],
  nameRefinementError: (): SuggestedReply[] => [
    createReply('try-another', REPLY_KEYS.NAME_TRY_AGAIN),
    createReply('own-name', REPLY_KEYS.NAME_I_HAVE_OWN),
  ],
  nameChoice: (): SuggestedReply[] => [
    createReply('generate-name', REPLY_KEYS.NAME_SUGGEST),
    createReply('own-name', REPLY_KEYS.NAME_I_HAVE_OWN),
  ],
  nameExtractionError: (): SuggestedReply[] => [
    createReply('retry', REPLY_KEYS.NAME_TRY_AGAIN),
    createReply('own-name', REPLY_KEYS.NAME_TYPE_OWN),
  ],
  businessSummary: (): SuggestedReply[] => [
    createReply('confirm-summary', REPLY_KEYS.BUSINESS_LOOKS_GOOD),
    createReply('edit-summary', REPLY_KEYS.BUSINESS_ADJUST),
  ],
  businessSummaryAfterEdit: (): SuggestedReply[] => [
    createReply('confirm-summary', REPLY_KEYS.BUSINESS_LOOKS_GOOD_NOW),
  ],
  skipOption: (): SuggestedReply[] => [createReply('skip-pricing', REPLY_KEYS.BUSINESS_SKIP)],
  buildReady: (): SuggestedReply[] => [
    createReply('customize', REPLY_KEYS.BUILD_CUSTOMIZE),
    createReply('different-style', REPLY_KEYS.BUILD_DIFFERENT_COLORS),
    createReply('add-features', REPLY_KEYS.BUILD_ADD_SECTIONS),
  ],
  errorBuild: (): SuggestedReply[] => [
    createReply('retry-build', REPLY_KEYS.ERROR_TRY_AGAIN),
    createReply('change-template', REPLY_KEYS.ERROR_PICK_DIFFERENT_TEMPLATE),
    createReply('start-fresh', REPLY_KEYS.ERROR_START_OVER),
  ],
  errorName: (): SuggestedReply[] => [
    createReply('retry-name', REPLY_KEYS.ERROR_TRY_AGAIN),
    createReply('own-name', REPLY_KEYS.ERROR_TYPE_OWN_NAME),
  ],
  errorTemplate: (): SuggestedReply[] => [
    createReply('retry-templates', REPLY_KEYS.ERROR_REFRESH_TEMPLATES),
    createReply('browse-all', REPLY_KEYS.ERROR_BROWSE_ALL),
  ],
  errorAgent: (): SuggestedReply[] => [
    createReply('retry-request', REPLY_KEYS.ERROR_TRY_AGAIN),
    createReply('simpler-change', REPLY_KEYS.ERROR_TRY_SIMPLER),
    createReply('undo-changes', REPLY_KEYS.ERROR_UNDO_CHANGES),
  ],
  errorGeneric: (): SuggestedReply[] => [
    createReply('retry', REPLY_KEYS.ERROR_TRY_AGAIN),
    createReply('refresh', REPLY_KEYS.ERROR_REFRESH_PAGE),
  ],
};
