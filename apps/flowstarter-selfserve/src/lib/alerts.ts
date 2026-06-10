// Internal alerts for build failures / stuck builds: webhook first (Slack or
// Discord-compatible payload), admin email second, console always.
import 'server-only';
import { ALERTS } from './config';
import { sendEmail } from './emails';

export async function alertAdmin(title: string, detail: Record<string, unknown>): Promise<void> {
  const body = `${title}\n${JSON.stringify(detail, null, 2)}`;
  console.error(`[selfserve ALERT] ${body}`);
  if (ALERTS.adminWebhookUrl) {
    await fetch(ALERTS.adminWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: body, content: body }),
    }).catch((e) => console.error('[selfserve ALERT] webhook failed', e));
  }
  if (ALERTS.adminEmail) {
    await sendEmail({ to: ALERTS.adminEmail, subject: `[Flowstarter selfserve] ${title}`, text: body });
  }
}
