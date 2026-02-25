/**
 * Email Service
 * 
 * Uses Resend for transactional emails.
 * Set RESEND_API_KEY in environment variables.
 * 
 * @see https://resend.com/docs
 */

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

const DEFAULT_FROM = 'Flowstarter <hello@flowstarter.app>';
const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendEmail({
  to,
  subject,
  html,
  from = DEFAULT_FROM,
  replyTo = 'hello@flowstarter.app',
}: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('[Email] RESEND_API_KEY is not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: replyTo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Email] Failed to send:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    console.info(`[Email] Sent to ${to}: ${subject}`);
    return { success: true, id: data.id };

  } catch (error) {
    console.error('[Email] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send team invitation email
 */
export async function sendTeamInvitation(
  email: string,
  inviterName: string,
  inviterEmail: string,
  invitationUrl: string
): Promise<SendEmailResult> {
  const { invitationEmail } = await import('./email-templates/invitation');
  const { subject, html } = invitationEmail({
    inviterName,
    inviterEmail,
    invitationUrl,
  });

  return sendEmail({ to: email, subject, html });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  userName?: string
): Promise<SendEmailResult> {
  const { welcomeEmail } = await import('./email-templates/welcome');
  const { subject, html } = welcomeEmail({
    userName,
    dashboardUrl: 'https://flowstarter.dev/dashboard',
  });

  return sendEmail({ to: email, subject, html });
}
