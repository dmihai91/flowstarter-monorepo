/**
 * Integration injection pipeline.
 * Runs after site generation, before saving to Convex.
 * Zero LLM cost — pure string manipulation.
 */
import { injectCalendly, fetchCalendlyEventTypes, type CalendlyConfig } from './calendly';
import { injectAnalytics, type AnalyticsConfig } from './analytics';

export { fetchCalendlyEventTypes };
export type { CalendlyConfig, AnalyticsConfig };

export interface IntegrationsConfig {
  calendly?: CalendlyConfig;
  analytics?: AnalyticsConfig;
}

/**
 * Apply all configured integrations to generated files.
 * Call this after site generation, before persisting to Convex.
 */
export async function injectIntegrations(
  files: Array<{ path: string; content: string }>,
  config: IntegrationsConfig,
): Promise<Array<{ path: string; content: string }>> {
  let result = files;

  // Calendly: fetch event types if API key provided, then inject
  if (config.calendly?.url) {
    const calendlyConfig = { ...config.calendly };
    if (calendlyConfig.apiKey && !calendlyConfig.eventTypes) {
      try {
        calendlyConfig.eventTypes = await fetchCalendlyEventTypes(calendlyConfig.apiKey);
        console.log(`[Integrations] Fetched ${calendlyConfig.eventTypes.length} Calendly event types`);
      } catch (e) {
        console.warn('[Integrations] Calendly API failed, using simple embed:', e);
      }
    }
    result = injectCalendly(result, calendlyConfig);
    console.log('[Integrations] Calendly injected');
  }

  // Analytics
  if (config.analytics?.id) {
    result = injectAnalytics(result, config.analytics);
    console.log(`[Integrations] ${config.analytics.provider} analytics injected`);
  }

  return result;
}
