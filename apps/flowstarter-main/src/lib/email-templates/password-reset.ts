/**
 * Password Reset Email Template
 */

import { baseEmailTemplate } from './base';

interface PasswordResetEmailProps {
  resetUrl: string;
  expiresInHours?: number;
}

export function passwordResetEmail({
  resetUrl,
  expiresInHours = 1,
}: PasswordResetEmailProps): { subject: string; html: string } {
  const subject = `Reset your Flowstarter password`;

  const html = baseEmailTemplate(`
    <h1>Reset your password</h1>
    <p>
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <p class="muted" style="margin-top: 24px;">
      This link will expire in ${expiresInHours} hour${expiresInHours > 1 ? 's' : ''}.
    </p>
    <p class="muted">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  `);

  return { subject, html };
}
