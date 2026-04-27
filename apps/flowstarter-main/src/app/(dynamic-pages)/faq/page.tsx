'use client';

import { PublicPageLayout } from '@/components/PublicPageLayout';
import { Button } from '@/components/ui/unified-button';
import { useI18n } from '@/lib/i18n';
import { LANDING_COPY } from '@/app/(dynamic-pages)/(main-pages)/landing-copy';
import Link from 'next/link';

export default function FAQPage() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const items = LANDING_COPY.faq.items;

  return (
    <PublicPageLayout>
      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6">
        <section className="mx-auto w-full max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fs-ink-faint)]">
            {t('faqPage.eyebrow')}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--fs-ink)] sm:text-5xl">
            {t('faqPage.headline')}
          </h1>

          <div className="mt-10 space-y-3">
            {items.map((item) => (
              <article
                key={item.question}
                className="rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-5"
              >
                <h2 className="text-lg font-semibold text-[var(--fs-ink)]">
                  {item.question}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fs-ink-dim)]">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/#pricing">{t('faqPage.cta.pricing')}</Link>
            </Button>
            <Button tone="secondary" asChild>
              <Link href="/contact">{t('faqPage.cta.contact')}</Link>
            </Button>
          </div>
        </section>
      </main>
    </PublicPageLayout>
  );
}
