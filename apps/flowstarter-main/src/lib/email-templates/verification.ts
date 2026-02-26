/**
 * Email Verification Template
 */

import { baseEmailTemplate } from './base';

interface VerificationEmailProps {
  verificationUrl?: string;
  verificationCode?: string;
}

export function verificationEmail({
  verificationUrl,
  verificationCode,
}: VerificationEmailProps): { subject: string; html: string } {
  const subject = `Verify your email for Flowstarter`;

  const actionContent = verificationCode
    ? `
      <p>Enter this code to verify your email:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; padding: 16px 32px; background: #f3f4f6; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">
          ${verificationCode}
        </span>
      </div>
    `
    : `
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email</a>
      </div>
    `;

  const html = baseEmailTemplate(`
    <h1>Verify your email</h1>
    <p>
      Thanks for signing up! Please verify your email address to complete your registration.
    </p>
    ${actionContent}
    <p class="muted" style="margin-top: 24px;">
      If you didn't create a Flowstarter account, you can safely ignore this email.
    </p>
  `);

  return { subject, html };
}
