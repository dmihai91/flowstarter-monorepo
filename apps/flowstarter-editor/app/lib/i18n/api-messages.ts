/**
 * Shared i18n Message Keys for API Responses
 *
 * This module provides translation keys and default English labels for
 * server-side API responses. It can be imported by both frontend and backend code.
 */

// ─── API Message Keys ────────────────────────────────────────────────────────

/**
 * Message key constants for API responses.
 * Use these instead of hardcoded strings to enable future translation.
 */
export const API_MESSAGE_KEYS = {
  // Name extraction responses
  NAME_CONFIRM: 'api.name.confirm',
  NAME_UNCLEAR: 'api.name.unclear',
  NAME_PROVIDE: 'api.name.provide',
} as const;

export type ApiMessageKey = (typeof API_MESSAGE_KEYS)[keyof typeof API_MESSAGE_KEYS];

/**
 * Default English labels for all API message keys.
 * Supports template variables like {{name}}.
 */
export const API_MESSAGE_LABELS: Record<ApiMessageKey, string> = {
  [API_MESSAGE_KEYS.NAME_CONFIRM]: "I'll use **{{name}}** as your project name. Sound good?",
  [API_MESSAGE_KEYS.NAME_UNCLEAR]: "I didn't catch that. What would you like to name your project?",
  [API_MESSAGE_KEYS.NAME_PROVIDE]: 'Please provide a name for your project.',
};

/**
 * Get translated message for an API message key.
 * Supports template variables like {{name}} using an optional context object.
 *
 * @param key - The API message key constant
 * @param context - Optional object with template variable values
 * @returns The translated message with variables substituted
 */
export function getApiMessage(key: ApiMessageKey, context?: Record<string, string>): string {
  let message = API_MESSAGE_LABELS[key] || key;

  if (context) {
    for (const [varName, value] of Object.entries(context)) {
      message = message.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
    }
  }

  return message;
}

