// Transactional email. Uses Resend when RESEND_API_KEY is set; otherwise logs
// to the console so flows remain testable. TODO(placeholder): pick the final
// provider + sender domain before production.
import 'server-only';
import { EMAIL } from './config';

export async function sendEmail(args: {
  to: string;
  subject: string;
  text: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}): Promise<void> {
  if (!EMAIL.resendApiKey) {
    console.info(
      `[selfserve email — NOT SENT, RESEND_API_KEY unset]\nTo: ${args.to}\nSubject: ${args.subject}\n\n${args.text}\n` +
        (args.attachments?.length ? `(attachments: ${args.attachments.map((a) => a.filename).join(', ')})` : ''),
    );
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${EMAIL.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL.from,
      to: [args.to],
      subject: args.subject,
      text: args.text,
      attachments: args.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString('base64'),
      })),
    }),
  });
  if (!res.ok) {
    console.error('[selfserve email] send failed', res.status, await res.text().catch(() => ''));
    return;
  }
  const { id } = (await res.json().catch(() => ({}))) as { id?: string };
  console.info(`[selfserve email] sent to ${args.to} (resend id: ${id ?? 'n/a'})`);
}

export function apologyEmail(brandName: string | undefined, refunded: boolean): { subject: string; text: string } {
  return {
    subject: 'We couldn’t finish your build — your payment has been refunded',
    text: [
      'Hi,',
      '',
      `We're sorry — our agents ran into a problem we couldn't recover from while building${brandName ? ` ${brandName}` : ' your site'}.`,
      refunded
        ? 'We have automatically refunded your build fee in full. It should appear on your statement within a few business days.'
        : 'We are processing a full refund of your build fee — if you do not see it within a few business days, reply to this email.',
      '',
      'If you’d like, just reply here and a human on our team will pick the build up personally.',
      '',
      '— The Flowstarter team',
    ].join('\n'),
  };
}
