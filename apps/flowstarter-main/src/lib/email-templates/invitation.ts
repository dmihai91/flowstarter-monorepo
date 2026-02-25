/**
 * Team Invitation Email Template
 */

import { baseEmailTemplate } from './base';

interface InvitationEmailProps {
  inviterName: string;
  inviterEmail: string;
  invitationUrl: string;
  expiresInDays?: number;
}

export function invitationEmail({
  inviterName,
  inviterEmail,
  invitationUrl,
  expiresInDays = 30,
}: InvitationEmailProps): { subject: string; html: string } {
  const subject = `You're invited to join Flowstarter`;

  const html = baseEmailTemplate(`
    <h1>You're invited! 🎉</h1>
    <p>
      <strong>${inviterName}</strong> (${inviterEmail}) has invited you to join the Flowstarter team.
    </p>
    <p>
      Click the button below to create your account and get started.
    </p>
    <div style="text-align: center;">
      <a href="${invitationUrl}" class="button">Accept Invitation</a>
    </div>
    <p class="muted" style="margin-top: 24px;">
      This invitation will expire in ${expiresInDays} days.
    </p>
  `);

  return { subject, html };
}
