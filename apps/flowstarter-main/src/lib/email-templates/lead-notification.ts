/**
 * Lead Notification Email
 *
 * Sent to the project's client (or team) when a lead lands on a hosted
 * client site via the contact form. Plain, no-fluff layout — the goal is
 * "this person wants to talk to you, here's how to reach them, fast".
 */

import { baseEmailTemplate } from './base';

interface LeadNotificationProps {
  /** Display name for the recipient (the client or team member). */
  recipientName?: string | null;
  /** Project name (the site that received the lead). */
  projectName?: string | null;
  /** Lead fields */
  leadName?: string | null;
  leadEmail?: string | null;
  leadPhone?: string | null;
  leadMessage?: string | null;
  /** Source channel — e.g. "contact_form", "newsletter". */
  source?: string | null;
  /** Optional URL to view leads in the team admin (or — Phase 2 — client dashboard). */
  inboxUrl?: string | null;
  /** Local timestamp string for the lead arrival. */
  receivedAt?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function row(label: string, value: string | null | undefined): string {
  if (!value) return '';
  return `<tr>
    <td style="padding: 8px 12px; color: #6b7280; width: 100px; vertical-align: top;">${label}</td>
    <td style="padding: 8px 12px; color: #111827;">${escapeHtml(value)}</td>
  </tr>`;
}

export function leadNotificationEmail(props: LeadNotificationProps): {
  subject: string;
  html: string;
} {
  const projectName = props.projectName?.trim() || 'your website';
  const greeting = props.recipientName
    ? `Hi ${escapeHtml(props.recipientName)},`
    : 'Hi there,';
  const subject = `New lead on ${projectName}${
    props.leadName ? ` — ${props.leadName}` : ''
  }`;

  const message = props.leadMessage?.trim();
  const messageBlock = message
    ? `<div style="margin-top: 16px; padding: 12px 16px; background: #f9fafb; border-left: 3px solid #4f46e5; color: #111827; white-space: pre-wrap;">${escapeHtml(
        message
      )}</div>`
    : '';

  const tableRows = [
    row('Name', props.leadName),
    row('Email', props.leadEmail),
    row('Phone', props.leadPhone),
    row('Source', props.source),
    row('Received', props.receivedAt ?? new Date().toLocaleString()),
  ]
    .filter(Boolean)
    .join('');

  const ctaBlock = props.inboxUrl
    ? `<div style="text-align: center; margin-top: 24px;">
         <a href="${props.inboxUrl}" class="button">Open inbox</a>
       </div>`
    : '';

  const html = baseEmailTemplate(`
    <h1>New lead on ${escapeHtml(projectName)}</h1>
    <p>${greeting}</p>
    <p>Someone just reached out via your website's contact form. Details:</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
      ${tableRows}
    </table>
    ${messageBlock}
    ${ctaBlock}
    <p class="muted" style="margin-top: 24px;">
      Reply directly to this email to respond to the lead, or copy their email above.
    </p>
  `);

  return { subject, html };
}
