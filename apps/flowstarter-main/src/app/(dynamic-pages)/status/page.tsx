'use client';

import { PublicPageLayout } from '@/components/PublicPageLayout';
import { UnifiedButton } from '@/components/ui/unified-button';
import Link from 'next/link';

const INCIDENTS = [
  { label: 'Website builder', state: 'Operational' },
  { label: 'Editor sync', state: 'Operational' },
  { label: 'Publishing & domains', state: 'Operational' },
  { label: 'Integrations', state: 'Operational' },
];

export default function StatusPage() {
  return (
    <PublicPageLayout>
      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6">
        <section className="mx-auto w-full max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fs-ink-faint)]">
            System Status
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--fs-ink)] sm:text-5xl">
            All systems operational.
          </h1>
          <p className="mt-4 text-base text-[var(--fs-ink-dim)]">
            No active incidents. We monitor uptime continuously and post updates
            here if anything degrades.
          </p>

          <div className="mt-10 rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)]">
            {INCIDENTS.map((item, idx) => (
              <div
                key={item.label}
                className={`flex items-center justify-between px-5 py-4 ${
                  idx < INCIDENTS.length - 1
                    ? 'border-b border-[var(--fs-rule)]/50'
                    : ''
                }`}
              >
                <span className="text-sm font-medium text-[var(--fs-ink)]">
                  {item.label}
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {item.state}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <UnifiedButton asChild>
              <Link href="/">Back to home</Link>
            </UnifiedButton>
            <UnifiedButton tone="secondary" asChild>
              <Link href="/help">Get support</Link>
            </UnifiedButton>
          </div>
        </section>
      </main>
    </PublicPageLayout>
  );
}
