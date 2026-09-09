import type { Metadata } from 'next';
import { StaticShell, Prose, CONTACT_EMAIL } from '@/components/static-shell';

export const metadata: Metadata = {
  title: 'About — Flowstarter',
  description: 'A small team and four agents putting small businesses online.',
};

export default function AboutPage() {
  return (
    <StaticShell>
      <Prose eyebrow="About" title="We put small businesses online.">
        <p>
          Flowstarter started the slow way: building websites by hand for local businesses, one at a
          time. A coaching practice, a fishing tackle shop on the Danube. The sites turned out well,
          but every one took weeks of back and forth, and most small businesses never get past that
          wall. They stay offline because getting online costs too much time and too many phone
          calls.
        </p>
        <p>
          So we built a crew of AI agents that does the heavy lifting. You describe your business in
          one sentence, the agents draft your positioning, brand and homepage in minutes, and you
          watch it happen. We stay in the loop for the parts that still need a human.
        </p>

        <h2>The people</h2>
        <div className="about-team">
          <div className="team-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="team-photo" src="/team/darius.png" alt="Darius Popescu" width={56} height={56} loading="lazy" />
            <div>
              <b>Darius Popescu</b>
              <span className="muted">Founder. Builds the platform, answers the emails, takes the blame.</span>
            </div>
          </div>
          <div className="team-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="team-photo" src="/team/dorin.jpeg" alt="Dorin" width={56} height={56} loading="lazy" />
            <div>
              <b>Dorin</b>
              <span className="muted">Co-founder. His design system is the one our agents build on.</span>
            </div>
          </div>
        </div>

        <h2>The crew</h2>
        <p>
          Four agents work on every site. <strong>Vera</strong> researches your market and locks the
          positioning. <strong>Iris</strong> sets the brand direction. <strong>Quinn</strong> writes
          the copy. <strong>Dash</strong> assembles the site and wires up contact and orders. They
          work around the clock and they don&rsquo;t bill by the hour.
        </p>

        <h2>How it works</h2>
        <p>
          The first draft is free, before you create an account. If you like it, the build starts
          for a flat fee, you pay the rest only when you see the finished site, and a monthly plan
          covers hosting, your domain and ongoing edits. The details are on the{' '}
          <a href="/#pricing">pricing section</a> and in the <a href="/terms">terms</a>.
        </p>

        <h2>Talk to us</h2>
        <p>
          Questions, ideas, or a business you want online?{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> reaches a person, not a ticket
          queue.
        </p>
      </Prose>
    </StaticShell>
  );
}
