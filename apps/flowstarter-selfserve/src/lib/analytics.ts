'use client';

// PostHog client-side funnel instrumentation. No-ops when the key is unset
// so local/mock development never breaks.
import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || initialized) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    capture_pageview: true,
    persistence: 'localStorage+cookie',
  });
  initialized = true;
}

/** The funnel events we measure the business against. */
export type FunnelEvent =
  | 'visit'
  | 'business_submitted'
  | 'demo_generated'
  | 'demo_prompt_used'
  | 'checkout_50_started'
  | 'paid_50'
  | 'build_completed'
  | 'preview_viewed'
  | 'paid_149_subscription'
  | 'paid_149_code_only'
  | 'abandoned_after_build'
  | 'brand_kit_downloaded';

export function track(event: FunnelEvent, props?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, props);
}

export function identify(id: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(id, props);
}
