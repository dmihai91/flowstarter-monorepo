'use client';

import { PublicPageLayout } from '@/components/PublicPageLayout';
import { Button } from '@/components/ui/unified-button';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

export default function AboutPage() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;

  return (
    <PublicPageLayout>
      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6">
        <section className="mx-auto w-full max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fs-ink-faint)]">
            {t('about.eyebrow')}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--fs-ink)] sm:text-5xl">
            {t('about.headline')}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--fs-ink-dim)] sm:text-lg">
            {t('about.body')}
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-5">
              <p className="text-2xl font-semibold text-[var(--fs-ink)]">
                {t('about.stat1.value')}
              </p>
              <p className="mt-2 text-sm text-[var(--fs-ink-dim)]">
                {t('about.stat1.label')}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-5">
              <p className="text-2xl font-semibold text-[var(--fs-ink)]">
                {t('about.stat2.value')}
              </p>
              <p className="mt-2 text-sm text-[var(--fs-ink-dim)]">
                {t('about.stat2.label')}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-5">
              <p className="text-2xl font-semibold text-[var(--fs-ink)]">
                {t('about.stat3.value')}
              </p>
              <p className="mt-2 text-sm text-[var(--fs-ink-dim)]">
                {t('about.stat3.label')}
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/#pricing">{t('about.cta.pricing')}</Link>
            </Button>
            <Button tone="secondary" asChild>
              <Link href="/contact">{t('about.cta.contact')}</Link>
            </Button>
          </div>
        </section>
      </main>
    </PublicPageLayout>
  );
}
