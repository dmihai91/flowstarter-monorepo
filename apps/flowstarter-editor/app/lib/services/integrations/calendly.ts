/**
 * Calendly Integration
 *
 * Two modes:
 * 1. Simple: Just a URL -> inject inline widget
 * 2. API-powered: Fetch event types -> service-specific booking buttons
 */

interface CalendlyEventType {
  uri: string;
  name: string;
  slug: string;
  duration: number;
  scheduling_url: string;
  description_plain?: string;
  active: boolean;
}

export interface CalendlyConfig {
  url: string;
  apiKey?: string;
  eventTypes?: CalendlyEventType[];
}

const CALENDLY_API = 'https://api.calendly.com';

async function getCalendlyUser(apiKey: string): Promise<string> {
  const res = await fetch(`${CALENDLY_API}/users/me`, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Calendly API error: ${res.status}`);
  const data = (await res.json()) as { resource: { uri: string } };
  return data.resource.uri;
}

export async function fetchCalendlyEventTypes(apiKey: string): Promise<CalendlyEventType[]> {
  const userUri = await getCalendlyUser(apiKey);
  const res = await fetch(
    `${CALENDLY_API}/event_types?user=${encodeURIComponent(userUri)}&active=true`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!res.ok) throw new Error(`Calendly API error: ${res.status}`);
  const data = (await res.json()) as { collection: CalendlyEventType[] };
  return data.collection.filter((e) => e.active);
}

function calendlyHeadScript(): string {
  return '\n    <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">\n    <script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>';
}

/** Sanitize URL for safe HTML attribute injection */
function sanitizeUrl(url: string): string {
  // Only allow https calendly.com URLs
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || (parsed.hostname !== 'calendly.com' && !parsed.hostname.endsWith('.calendly.com'))) {
      return '';
    }
    // Reject URLs with suspicious encoded characters (XSS attempts)
    if (/%22|%3C|%3E|%27|onload|onerror|onclick|javascript:/i.test(parsed.href)) {
      return '';
    }
    return parsed.href.replace(/"/g, '&quot;');
  } catch {
    return '';
  }
}

function inlineWidget(url: string): string {
  const safeUrl = sanitizeUrl(url);
  if (!safeUrl) return '<!-- Invalid Calendly URL -->';
  return `<div class="calendly-inline-widget" data-url="${safeUrl}" style="min-width:320px;height:700px;"></div>`;
}

function serviceBookingButtons(eventTypes: CalendlyEventType[]): string {
  const buttons = eventTypes.map((et) =>
    `    <button onclick="Calendly.initPopupWidget({url: '${sanitizeUrl(et.scheduling_url)}'}); return false;" class="btn-primary w-full justify-between">
      <span>${et.name}</span><span class="text-sm opacity-75">${et.duration} min</span>
    </button>`
  ).join('\n');

  return `<div class="flex flex-col gap-3">
  <h3 class="text-lg font-semibold mb-2">Book an Appointment</h3>
${buttons}
</div>`;
}

export function injectCalendly(
  files: Array<{ path: string; content: string }>,
  config: CalendlyConfig,
): Array<{ path: string; content: string }> {
  return files.map((file) => {
    // Layout.astro: add script to <head>
    if ((file.path.includes('Layout.astro') || file.path.includes('layout.astro')) && !file.content.includes('calendly')) {
      return { ...file, content: file.content.replace('</head>', `${calendlyHeadScript()}\n  </head>`) };
    }

    // contact.astro: replace form with widget or buttons
    if (file.path.includes('contact.astro') || file.path.includes('Contact.astro')) {
      const widget = config.eventTypes?.length
        ? serviceBookingButtons(config.eventTypes)
        : inlineWidget(config.url);

      let content = file.content;
      if (content.includes('</form>')) {
        content = content.replace(/<form[\s\S]*?<\/form>/, widget);
      } else {
        const lastSection = content.lastIndexOf('</section>');
        if (lastSection >= 0) content = content.slice(0, lastSection) + `\n  ${widget}\n` + content.slice(lastSection);
      }
      return { ...file, content };
    }

    return file;
  });
}
