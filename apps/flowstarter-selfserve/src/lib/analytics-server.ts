// Server-side PostHog capture for events that happen outside the browser
// (Stripe webhooks, build completion, refunds). No-ops when key is unset.
import 'server-only';
import { PostHog } from 'posthog-node';

let client: PostHog | null | undefined;

function getClient(): PostHog | null {
  if (client !== undefined) return client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  client = key
    ? new PostHog(key, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
        flushAt: 1,
        flushInterval: 0,
      })
    : null;
  return client;
}

export async function trackServer(
  distinctId: string,
  event:
    | 'paid_50'
    | 'paid_149_subscription'
    | 'paid_149_code_only'
    | 'build_completed'
    | 'build_failed_terminal'
    | 'build_refunded'
    | 'abandoned_after_build',
  properties?: Record<string, unknown>,
) {
  const ph = getClient();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
  await ph.flush().catch(() => {});
}
