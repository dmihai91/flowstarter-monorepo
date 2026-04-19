'use client';

import { useState, useEffect, useCallback } from 'react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { PreQualModal } from '../components/PreQualModalLazy';

const PAIN_POINTS = [
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
    title: 'Visitors leave without contacting you',
    body: 'Your site gets traffic but nobody books, buys, or reaches out. The structure is not built to convert.',
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
        />
      </svg>
    ),
    title: 'It looks outdated or unfinished',
    body: "Your site doesn't reflect the quality of your work. First impressions happen in seconds — and you're losing them.",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743"
        />
      </svg>
    ),
    title: "You can't update it yourself",
    body: 'Every small change means emailing a developer or fighting a clunky builder. So nothing gets updated.',
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z"
        />
      </svg>
    ),
    title: "No idea what is or isn't working",
    body: 'No analytics, no tracking. You have no way of knowing where visitors come from or why they leave.',
  },
];

const WHAT_YOU_GET = [
  'Full audit of your current site — what is costing you leads',
  'Content migration — your existing copy, images, and pages carried over',
  'SEO redirect mapping — keep your Google rankings',
  'New structure built to convert visitors into customers',
  'Booking, contact form, and analytics all connected',
  'Smart editor — update anything yourself after launch, no code',
  'Your own business dashboard',
  'First month free. 50% setup refund if not happy in 30 days.',
];

export default function RelaunchPage() {
  const [url, setUrl] = useState('');
  const [problems, setProblems] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!url.trim()) return;
      // Store in sessionStorage so it can be passed to Calendly as UTM
      sessionStorage.setItem('relaunch_url', url.trim());
      sessionStorage.setItem('relaunch_problems', problems.trim());
      setSubmitted(true);
      setModalOpen(true);
    },
    [url, problems]
  );

  return (
    <>
      <div className="min-h-screen bg-[var(--landing-bg)] dark:bg-[var(--landing-dark-surface)] text-[var(--fs-ink)] font-display relative transition-colors duration-300">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            scrolled
              ? 'bg-white/72 dark:bg-[var(--fs-bg-base)]/72 backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-white/50 dark:border-white/10 shadow-[0_8px_40px_rgba(15,23,42,0.08)]'
              : 'bg-transparent border-b border-transparent'
          }`}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/" className="flex items-center gap-2 group">
                <Logo size="md" />
              </Link>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  href="/#pricing"
                  className="text-sm text-[var(--fs-ink-faint)] hover:text-gray-900 dark:hover:text-white transition-colors hidden sm:block"
                >
                  See all plans
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="pt-28 sm:pt-36 pb-12 sm:pb-16 relative">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Flowstarter Relaunch
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight mb-5 [text-wrap:balance]">
              Your site exists.{' '}
              <span className="text-gray-400 dark:text-white/40">
                But it&apos;s not getting you customers.
              </span>
            </h1>
            <p className="text-lg text-[var(--fs-ink-faint)] max-w-xl mx-auto leading-relaxed [text-wrap:balance]">
              We audit what&apos;s not working, migrate your content, and
              rebuild your site around converting visitors — quickly, not
              months. You keep your Google rankings.
            </p>
          </div>
        </section>

        {/* ── Pain points ────────────────────────────────────────── */}
        <section className="pb-12 sm:pb-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-white/35 mb-8">
              Sound familiar?
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {PAIN_POINTS.map((p) => (
                <div
                  key={p.title}
                  className="refined-card rounded-2xl p-6 flex gap-4"
                >
                  <div className="shrink-0 mt-0.5 text-gray-400 dark:text-white/40">
                    {p.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--fs-ink)] mb-1.5">
                      {p.title}
                    </h3>
                    <p className="text-sm text-[var(--fs-ink-faint)] leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What you get ───────────────────────────────────────── */}
        <section className="py-12 sm:py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--landing-bg-tint)] to-transparent dark:via-[var(--landing-dark-surface-tint)] pointer-events-none" />
          <div className="max-w-3xl mx-auto px-6 relative">
            <div className="text-center mb-8">
              <span className="editorial-kicker mb-4">
                <span className="editorial-dot" />
                What&apos;s included
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--fs-ink)] [text-wrap:balance]">
                Everything rebuilt to convert — starting at €699
              </h2>
              <p className="mt-3 text-base text-[var(--fs-ink-faint)]">
                Price depends on complexity. We&apos;ll assess it together on
                the call.
              </p>
            </div>
            <ul className="space-y-3 max-w-lg mx-auto">
              {WHAT_YOU_GET.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-[var(--fs-ink-dim)]"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shrink-0">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Intake form ────────────────────────────────────────── */}
        <section className="py-12 sm:py-16" id="form">
          <div className="max-w-lg mx-auto px-6">
            <div className="refined-panel rounded-[28px] p-7 sm:p-9">
              <div className="text-center mb-7">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--fs-ink)] mb-2">
                  {submitted
                    ? "Great — let's talk."
                    : 'Tell us about your site'}
                </h2>
                <p className="text-sm text-[var(--fs-ink-faint)]">
                  {submitted
                    ? "Book a free discovery call and we'll review your site together."
                    : "Share your URL and we'll come prepared to your discovery call."}
                </p>
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="site-url"
                      className="block text-sm font-medium text-[var(--fs-ink-dim)] mb-1.5"
                    >
                      Your current website URL
                    </label>
                    <input
                      id="site-url"
                      type="url"
                      required
                      placeholder="https://yoursite.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full rounded-xl border border-[var(--fs-rule)] bg-white dark:bg-white/[0.04] px-4 py-3 text-sm text-[var(--fs-ink)] placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[var(--purple-primary)]/40 focus:border-[var(--purple-primary)]/40 transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="site-problems"
                      className="block text-sm font-medium text-[var(--fs-ink-dim)] mb-1.5"
                    >
                      What&apos;s not working?{' '}
                      <span className="text-[var(--fs-ink-faint)] font-normal">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id="site-problems"
                      rows={3}
                      placeholder="E.g. visitors don't contact me, the design looks dated, I can't update anything myself..."
                      value={problems}
                      onChange={(e) => setProblems(e.target.value)}
                      className="w-full rounded-xl border border-[var(--fs-rule)] bg-white dark:bg-white/[0.04] px-4 py-3 text-sm text-[var(--fs-ink)] placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[var(--purple-primary)]/40 focus:border-[var(--purple-primary)]/40 transition-all resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="brand-gradient"
                    size="lg"
                    className="w-full rounded-2xl "
                  >
                    Book my free audit call
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Button>

                  <p className="text-center text-xs text-[var(--fs-ink-faint)]">
                    Free, no commitment. 45-minute call. We come prepared.
                  </p>
                </form>
              ) : (
                <div className="text-center">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                    <svg
                      className="h-7 w-7 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-[var(--fs-ink-faint)] mb-5">
                    We&apos;ll review{' '}
                    <span className="font-medium text-[var(--fs-ink-dim)]">
                      {url}
                    </span>{' '}
                    before the call.
                  </p>
                  <Button
                    variant="brand-gradient"
                    size="lg"
                    className="w-full rounded-2xl "
                    onClick={() => setModalOpen(true)}
                  >
                    Pick a time for your call
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Guarantee ──────────────────────────────────────────── */}
        <section className="pb-16">
          <div className="max-w-md mx-auto px-6 text-center">
            <p className="text-sm text-gray-400 dark:text-white/35 leading-relaxed">
              50% upfront to start. Rest only when you love the result. First
              month free. Not happy within 30 days? We refund 50% of the setup
              fee. No questions asked.
            </p>
          </div>
        </section>

        <Footer />
      </div>

      <PreQualModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        source="relaunch-page"
        initialPlan="relaunch"
      />
    </>
  );
}