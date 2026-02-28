import { useI18nContext } from './provider';

/**
 * Hook for accessing translations and locale.
 *
 * Usage:
 * ```
 * const { t, locale } = useTranslation();
 * return <h1>{t.editor.title}</h1>;
 * ```
 */
export function useTranslation() {
  const { t, locale } = useI18nContext();
  return { t, locale };
}

/**
 * Interpolate variables into a translation string.
 * Replaces {{key}} with the corresponding value.
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`));
}
