import type { Metadata } from 'next';
import { StaticShell, Prose, CONTACT_EMAIL } from '@/components/static-shell';

export const metadata: Metadata = {
  title: 'Privacy policy — Flowstarter',
  description: 'What Flowstarter collects, why, and what your rights are.',
};

export default function PrivacyPage() {
  return (
    <StaticShell>
      <Prose eyebrow="Legal" title="Privacy policy" updated="11 June 2026">
        <p>
          This page explains what data Flowstarter (&ldquo;we&rdquo;) collects when you use the
          service, why we collect it, and what you can do about it. The short version: we collect
          what we need to draft and build your website, we don&rsquo;t sell your data, and you can
          ask us to delete it at any time.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account data.</strong> Your name, email address and sign-in method, managed by
            our authentication provider, Clerk.
          </li>
          <li>
            <strong>What you tell us about your business.</strong> The description you type, your
            prompts to the agents, and the drafts and sites generated from them.
          </li>
          <li>
            <strong>Payment data.</strong> Payments are processed by Stripe and subscriptions by
            Clerk Billing. We never see or store your card number; we keep records of what was paid
            and when.
          </li>
          <li>
            <strong>Emails.</strong> If you ask us to email you a draft, we store that email address
            and the draft so the link keeps working.
          </li>
          <li>
            <strong>Usage data.</strong> Product analytics (via PostHog) about how the funnel is
            used, and IP addresses for rate limiting and abuse prevention.
          </li>
        </ul>

        <h2>How we use it</h2>
        <p>
          To generate your draft and build your site, to process payments, to send you the emails
          you asked for, to keep the free tier from being abused, and to understand which parts of
          the product work. That&rsquo;s the list. We don&rsquo;t sell personal data and we
          don&rsquo;t run third-party advertising.
        </p>

        <h2>AI processing</h2>
        <p>
          Your business description and prompts are sent to AI models (via OpenRouter) to generate
          your draft. We send only what&rsquo;s needed to do the work, and we don&rsquo;t use your
          data to train models of our own.
        </p>

        <h2>Where it lives and who touches it</h2>
        <p>
          We use a small set of processors to run the service: Clerk (accounts and subscriptions),
          Stripe (payments), Supabase and Convex (data storage), Resend (transactional email),
          PostHog (analytics) and OpenRouter (AI generation). Sites we host for you run on Hetzner
          infrastructure in the EU. Each processor receives only the data it needs for its job.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Account and project data is kept while your account is active. Free drafts and saved
          draft links may be removed after a period of inactivity. Payment records are kept as long
          as the law requires. If you delete your account, we delete the personal data we hold
          about you, except what we must keep for legal or accounting reasons.
        </p>

        <h2>Your rights</h2>
        <p>
          Under the GDPR you can ask us for a copy of your data, ask us to correct it, delete it,
          or hand it over in a portable format, and you can object to or restrict certain
          processing. Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we&rsquo;ll
          act on it. You also have the right to complain to your local data protection authority.
        </p>

        <h2>Cookies</h2>
        <p>
          We use cookies for signing you in (set by Clerk), remembering your theme preference, and
          analytics. No cross-site advertising cookies.
        </p>

        <h2>Changes</h2>
        <p>
          If this policy changes in a way that matters, we&rsquo;ll note it here and update the
          date at the top. Questions about any of this:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </Prose>
    </StaticShell>
  );
}
