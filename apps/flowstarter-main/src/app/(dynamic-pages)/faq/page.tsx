'use client';

import { PublicPageLayout } from '@/components/PublicPageLayout';
import { UnifiedButton } from '@/components/ui/unified-button';
import Link from 'next/link';

const FAQ_ITEMS = [
  {
    q: 'How fast can my site go live?',
    a: 'Most projects go live in about 5-7 days after your discovery call.',
  },
  {
    q: 'Can I edit content myself?',
    a: 'Yes. You get a smart editor to update text, sections, and content without code.',
  },
  {
    q: 'Do you support payments and booking?',
    a: 'Yes. We can wire common integrations like Stripe and calendar booking flows.',
  },
  {
    q: 'What if I need changes after launch?',
    a: 'You can either edit directly with the smart editor or book support for bigger changes.',
  },
];

export default function FAQPage() {
  return (
    <PublicPageLayout>
      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6">
        <section className="mx-auto w-full max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fs-ink-faint)]">
            Frequently Asked Questions
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--fs-ink)] sm:text-5xl">
            Answers before you book.
          </h1>

          <div className="mt-10 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <article
                key={item.q}
                className="rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-5"
              >
                <h2 className="text-lg font-semibold text-[var(--fs-ink)]">
                  {item.q}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fs-ink-dim)]">
                  {item.a}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <UnifiedButton asChild>
              <Link href="/#pricing">See plans and pricing</Link>
            </UnifiedButton>
            <UnifiedButton tone="secondary" asChild>
              <Link href="/contact">Still have questions?</Link>
            </UnifiedButton>
          </div>
        </section>
      </main>
    </PublicPageLayout>
  );
}
