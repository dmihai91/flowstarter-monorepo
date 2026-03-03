/**
 * Welcome Email Template (after signup)
 */

import { baseEmailTemplate } from './base';

interface WelcomeEmailProps {
  userName?: string;
  dashboardUrl: string;
}

export function welcomeEmail({ userName, dashboardUrl }: WelcomeEmailProps): {
  subject: string;
  html: string;
} {
  const subject = `Welcome to Flowstarter! 🎉`;

  const greeting = userName ? `Hi ${userName},` : 'Hi there,';

  const html = baseEmailTemplate(`
    <h1>Welcome to Flowstarter!</h1>
    <p>${greeting}</p>
    <p>
      Your account is ready. You can now access your dashboard and start building beautiful websites.
    </p>
    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
    </div>
    <p style="margin-top: 32px;">
      <strong>What's next?</strong>
    </p>
    <ul style="color: #6b7280; padding-left: 20px;">
      <li>Explore your dashboard</li>
      <li>Start building your website</li>
      <li>Use AI to customize your content</li>
    </ul>
    <p class="muted" style="margin-top: 24px;">
      Questions? Just reply to this email - we're happy to help!
    </p>
  `);

  return { subject, html };
}
