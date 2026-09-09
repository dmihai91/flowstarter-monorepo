/**
 * The one email a guest-checkout client gets between paying and signing in.
 *
 * It is the only place the temporary password ever appears, so it has to be
 * unambiguous: the address they sign in with, the password we chose, where to
 * go, and the fact that the password is about to be replaced. Everything else
 * is noise in the message that decides whether a paying client can get into the
 * product at all.
 *
 * Two variants, because there are two truths. Someone who has never had an
 * account needs credentials. Someone who already has one must NOT be told we
 * made them a password, because we did not touch it.
 */
import { baseEmailTemplate } from './base';

interface GuestDepositWelcomeProps {
  /** The address Stripe charged, which is also the sign-in identifier. */
  email: string;
  /** Omitted for a client who already had an account. */
  tempPassword?: string;
  signInUrl: string;
  businessName?: string | null;
}

/** Keeps a business name out of the HTML as anything but text. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CREDENTIAL_BOX =
  'margin:20px 0;padding:16px 18px;border:1px solid #e5e7eb;' +
  'border-radius:12px;background:#fafafa;';
const CREDENTIAL_VALUE =
  'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;' +
  'font-weight:600;color:#1a1a2e;word-break:break-all;';
const CREDENTIAL_LABEL =
  'margin:0 0 2px;font-size:12px;color:#6b7280;text-transform:uppercase;' +
  'letter-spacing:0.06em;';

export function guestDepositWelcomeEmail({
  email,
  tempPassword,
  signInUrl,
  businessName,
}: GuestDepositWelcomeProps): { subject: string; html: string } {
  const project = businessName?.trim()
    ? `${escapeHtml(businessName.trim())}`
    : 'your site';

  if (!tempPassword) {
    return {
      subject: 'Your deposit is in and your build has started',
      html: baseEmailTemplate(`
    <h1>Your build has started</h1>
    <p>
      Your deposit went through. We have started building ${project}, and the
      project is already in your dashboard.
    </p>
    <p>
      You already have a Flowstarter account at this address, so nothing changes
      for you. Sign in the way you normally do.
    </p>
    <div style="${CREDENTIAL_BOX}">
      <p style="${CREDENTIAL_LABEL}">Sign in with</p>
      <p style="${CREDENTIAL_VALUE}margin:0;">${escapeHtml(email)}</p>
    </div>
    <div style="text-align: center;">
      <a href="${signInUrl}" class="button">Sign in</a>
    </div>
    <p class="muted" style="margin-top: 24px;">
      We did not change your password. Use the one you already set.
    </p>
    <p class="muted">
      If you did not pay this deposit, reply to this email and we will sort it
      out.
    </p>
  `),
    };
  }

  return {
    subject: 'Your Flowstarter account and your build',
    html: baseEmailTemplate(`
    <h1>Your build has started</h1>
    <p>
      Your deposit went through. We have started building ${project}, and we
      made you an account so you can follow it.
    </p>
    <div style="${CREDENTIAL_BOX}">
      <p style="${CREDENTIAL_LABEL}">Sign in with</p>
      <p style="${CREDENTIAL_VALUE}margin:0 0 14px;">${escapeHtml(email)}</p>
      <p style="${CREDENTIAL_LABEL}">Temporary password</p>
      <p style="${CREDENTIAL_VALUE}margin:0;">${escapeHtml(tempPassword)}</p>
    </div>
    <div style="text-align: center;">
      <a href="${signInUrl}" class="button">Sign in</a>
    </div>
    <p style="margin-top: 24px;">
      The first time you sign in we will ask you to choose your own password.
      The temporary one above stops working as soon as you do.
    </p>
    <p class="muted">
      If you did not pay this deposit, reply to this email and we will sort it
      out.
    </p>
  `),
  };
}
