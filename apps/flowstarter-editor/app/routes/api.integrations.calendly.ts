/**
 * GET /api/integrations/calendly?apiKey=xxx
 * Fetches Calendly event types for the given API key.
 * Used by IntegrationsPanel to show available booking types.
 */
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { fetchCalendlyEventTypes } from '~/lib/services/integrations';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const apiKey = url.searchParams.get('apiKey');

  if (!apiKey) {
    return json({ error: 'apiKey required' }, { status: 400 });
  }

  try {
    const eventTypes = await fetchCalendlyEventTypes(apiKey);
    return json({
      success: true,
      eventTypes: eventTypes.map((et) => ({
        name: et.name,
        duration: et.duration,
        slug: et.slug,
        schedulingUrl: et.scheduling_url,
      })),
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch event types',
    }, { status: 400 });
  }
}
