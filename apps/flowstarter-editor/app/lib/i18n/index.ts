/**
 * i18n Module Index
 *
 * Central export point for all internationalization utilities.
 */

// API Messages (server-side)
export { API_MESSAGE_KEYS, API_MESSAGE_LABELS, getApiMessage, type ApiMessageKey } from './api-messages';

// Editor UI Labels (client-side)
export { EDITOR_LABEL_KEYS, EDITOR_LABELS, getEditorLabel, t, type EditorLabelKey } from './editor-labels';

// i18n Provider & Hook
export { I18nProvider } from './provider';
export { useTranslation, interpolate } from './useTranslation';
export type { Translations } from './locales/en';

