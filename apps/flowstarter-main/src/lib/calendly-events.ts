/**
 * Calendly Scheduled Events API
 * Fetches upcoming meetings for display on the client dashboard.
 * API key is read from Supabase Vault (encrypted at rest).
 *
 * Calendly API v2:
 * - GET /users/me → user URI
 * - GET /scheduled_events?user={uri}&status=active&min_start_time=now&max_start_time=+30d
 */
import 'server-only';

const CALENDLY_API = 'https://api.calendly.com';

export interface CalendlyEvent {
  uri: string;
  name: string;
  status: 'active' | 'canceled';
  startTime: string;
  endTime: string;
  eventType: string;
  location?: { type: string; location?: string; join_url?: string };
  invitees: Array<{ name: string; email: string }>;
  cancelUrl?: string;
  rescheduleUrl?: string;
}

interface CalendlyInvitee {
  name: string;
  email: string;
}

interface CalendlyAPIEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location?: { type: string; location?: string; join_url?: string };
  cancellation?: { canceled_by: string };
  cancel_url?: string;
  reschedule_url?: string;
}

async function getCalendlyUserUri(apiKey: string): Promise<string> {
  const res = await fetch(`${CALENDLY_API}/users/me`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Calendly ${res.status}`);
  const data = (await res.json()) as { resource: { uri: string } };
  return data.resource.uri;
}

/**
 * Fetch upcoming scheduled events from Calendly.
 * Returns events sorted by start time, max 10.
 */
export async function fetchUpcomingEvents(
  apiKey: string,
  daysAhead: number = 30,
): Promise<CalendlyEvent[]> {
  const userUri = await getCalendlyUserUri(apiKey);

  const now = new Date().toISOString();
  const maxDate = new Date(Date.now() + daysAhead * 86400000).toISOString();

  const params = new URLSearchParams({
    user: userUri,
    status: 'active',
    min_start_time: now,
    max_start_time: maxDate,
    count: '10',
    sort: 'start_time:asc',
  });

  const res = await fetch(`${CALENDLY_API}/scheduled_events?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Calendly events ${res.status}`);

  const data = (await res.json()) as { collection: CalendlyAPIEvent[] };

  // Fetch invitees for each event (parallel, max 10)
  const events = await Promise.all(
    data.collection.map(async (event) => {
      let invitees: CalendlyInvitee[] = [];
      try {
        const eventUuid = event.uri.split('/').pop();
        const invRes = await fetch(
          `${CALENDLY_API}/scheduled_events/${eventUuid}/invitees`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        );
        if (invRes.ok) {
          const invData = (await invRes.json()) as {
            collection: Array<{ name: string; email: string }>;
          };
          invitees = invData.collection.map((i) => ({ name: i.name, email: i.email }));
        }
      } catch { /* invitees optional */ }

      return {
        uri: event.uri,
        name: event.name,
        status: event.status as 'active' | 'canceled',
        startTime: event.start_time,
        endTime: event.end_time,
        eventType: event.event_type,
        location: event.location,
        invitees,
        cancelUrl: event.cancel_url,
        rescheduleUrl: event.reschedule_url,
      };
    }),
  );

  return events;
}
