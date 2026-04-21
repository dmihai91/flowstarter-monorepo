'use client';

import { PublicPageLayout } from '@/components/PublicPageLayout';
import { UnifiedButton } from '@/components/ui/unified-button';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <PublicPageLayout>
      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6">
        <section className="mx-auto w-full max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fs-ink-faint)]">
            About Flowstarter
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--fs-ink)] sm:text-5xl">
            We build websites that book real clients.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--fs-ink-dim)] sm:text-lg">
            Flowstarter combines a premium done-for-you setup with a smart
            editor you can actually use. You launch fast, then keep full control
            of your website without relying on a developer for every small
            update.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-5">
              <p className="text-2xl font-semibold text-[var(--fs-ink)]">
                7 days
              </p>
              <p className="mt-2 text-sm text-[var(--fs-ink-dim)]">
                Typical turnaround from kickoff to launch.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-5">
              <p className="text-2xl font-semibold text-[var(--fs-ink)]">
                1 call
              </p>
              <p className="mt-2 text-sm text-[var(--fs-ink-dim)]">
                One focused discovery call, then we build.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-5">
              <p className="text-2xl font-semibold text-[var(--fs-ink)]">
                No lock-in
              </p>
              <p className="mt-2 text-sm text-[var(--fs-ink-dim)]">
                You own your website and can edit anytime.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <UnifiedButton asChild>
              <Link href="/#pricing">See plans and pricing</Link>
            </UnifiedButton>
            <UnifiedButton tone="secondary" asChild>
              <Link href="/contact">Contact us</Link>
            </UnifiedButton>
          </div>
        </section>
      </main>
    </PublicPageLayout>
  );
}
