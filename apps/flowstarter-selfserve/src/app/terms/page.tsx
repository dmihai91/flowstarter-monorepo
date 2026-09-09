import type { Metadata } from 'next';
import { StaticShell, Prose, CONTACT_EMAIL } from '@/components/static-shell';
import { pricingCopy, DEMO } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Terms of service — Flowstarter',
  description: 'The terms for using Flowstarter: free demo, build fee, delivery and hosting.',
};

export default function TermsPage() {
  const pricing = pricingCopy();
  return (
    <StaticShell>
      <Prose eyebrow="Legal" title="Terms of service" updated="11 June 2026">
        <p>
          These terms cover your use of Flowstarter. They&rsquo;re written to be read, not to hide
          things: the prices and conditions below are the same ones shown in the product before you
          pay anything.
        </p>

        <h2>1. What Flowstarter is</h2>
        <p>
          Flowstarter drafts and builds websites for small businesses using a combination of AI
          agents and human oversight. You describe your business, the agents produce a draft, and
          if you decide to go ahead we build and deliver the full site.
        </p>

        <h2>2. The free demo</h2>
        <p>
          The first draft is free and doesn&rsquo;t require an account. A free account unlocks up
          to {DEMO.maxRefinements} prompts with the agent. Fair-use rate limits apply, drafts are
          samples rather than finished products, and we may remove unclaimed drafts after a period
          of inactivity.
        </p>

        <h2>3. Starting a build: {pricing.build}</h2>
        <p>
          The build starts when you pay the {pricing.build} build fee. This fee is{' '}
          <strong>non-refundable</strong>: it pays for work that begins immediately. By paying it
          you expressly request that we begin before the end of the 14-day withdrawal period and
          acknowledge that you lose the right of withdrawal once the service has been fully
          performed, as allowed under EU consumer law. You confirm this at checkout before paying.
        </p>

        <h2>4. Delivery: {pricing.final}</h2>
        <p>
          When the build is done you see the finished site, with the agents&rsquo; work visible.
          The {pricing.final} delivery payment is due only if you accept it. If you walk away
          instead, you keep the brand kit (logo direction, palette, copy and strategy as a PDF), we
          keep the build fee, and the site code is not delivered. Your finished site stays
          available for 30 days in case you change your mind.
        </p>

        <h2>5. After delivery: {pricing.monthly}/month or code export</h2>
        <p>
          The monthly plan covers hosting, your domain, updates and AI edits. You can cancel any
          time and the cancellation takes effect at the end of the paid period. If you&rsquo;d
          rather host it yourself, you can take the full site code instead.
        </p>

        <h2>6. Ownership and your content</h2>
        <p>
          What you tell us about your business stays yours. Once the delivery payment is made, the
          site, its code and its content belong to you. You&rsquo;re responsible for having the
          rights to any material you give us to use, and for the accuracy of claims the site makes
          about your business.
        </p>

        <h2>7. Acceptable use</h2>
        <p>
          Don&rsquo;t use Flowstarter to build sites that are illegal, deceptive, or harmful, and
          don&rsquo;t attempt to abuse the free tier or interfere with the service. We can refuse
          or stop a build that breaks this rule; if we do so before any work is delivered,
          we&rsquo;ll refund what you paid for it.
        </p>

        <h2>8. AI output</h2>
        <p>
          Drafts and generated copy can contain mistakes. Review everything before you publish it,
          especially prices, claims and contact details. We don&rsquo;t guarantee business results
          from any site we build.
        </p>

        <h2>9. Availability</h2>
        <p>
          We take a limited number of builds per month so quality stays high, and the service may
          occasionally be unavailable. We&rsquo;re not liable for losses caused by downtime beyond
          what mandatory law provides.
        </p>

        <h2>10. Liability</h2>
        <p>
          To the extent the law allows, our total liability is capped at the amounts you paid us in
          the 12 months before the claim. Nothing in these terms limits rights that consumer law
          gives you and that can&rsquo;t be waived.
        </p>

        <h2>11. Changes and contact</h2>
        <p>
          We may update these terms; material changes will be noted here with a new date, and
          continued use after that means you accept them. These terms are governed by Romanian law,
          without affecting mandatory consumer protections in your country of residence. Questions:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </Prose>
    </StaticShell>
  );
}
