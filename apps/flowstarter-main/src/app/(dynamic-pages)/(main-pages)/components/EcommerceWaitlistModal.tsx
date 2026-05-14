'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/unified-button';
import { useI18n } from '@/lib/i18n';
import { useEcommerceWaitlist } from './ecommerce-waitlist-store';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function EcommerceWaitlistModal() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const isOpen = useEcommerceWaitlist((s) => s.isOpen);
  const close = useEcommerceWaitlist((s) => s.close);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Reset state when the modal closes.
  useEffect(() => {
    if (!isOpen) {
      const t = window.setTimeout(() => {
        setEmail('');
        setStatus('idle');
        setErrorMessage('');
      }, 200);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // ESC to close.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  if (!isOpen) return null;

  // Mirror the server-side z.email() check so the submit button is
  // disabled until the field actually contains a valid address. Same
  // shape as the validator in `apps/.../api/ecommerce-waitlist/route.ts`.
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const submitDisabled = status === 'submitting' || !isValidEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setErrorMessage('');
    try {
      const res = await fetch('/api/ecommerce-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing-pricing-ecommerce' }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || t('landing.waitlist.error'));
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : t('landing.waitlist.error')
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ecommerce-waitlist-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          aria-label={t('landing.waitlist.close')}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--fs-ink-faint)] hover:bg-black/5 dark:hover:bg-white/10"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {status === 'success' ? (
          <div className="text-center py-4">
            <h2
              id="ecommerce-waitlist-title"
              className="text-xl font-semibold text-[var(--fs-ink)]"
            >
              {t('landing.waitlist.successTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--fs-ink-dim)]">
              {t('landing.waitlist.successBody')}
            </p>
            <Button type="button" onClick={close} className="mt-6 w-full">
              {t('landing.waitlist.successCta')}
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fs-ink-faint)]">
              {t('landing.waitlist.eyebrow')}
            </p>
            <h2
              id="ecommerce-waitlist-title"
              className="mt-2 text-2xl font-semibold tracking-tight text-[var(--fs-ink)]"
            >
              {t('landing.waitlist.title')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--fs-ink-dim)]">
              {t('landing.waitlist.body')}
            </p>

            <form onSubmit={handleSubmit} className="mt-5">
              <label className="block">
                <span className="block text-xs font-medium text-[var(--fs-ink-dim)] mb-1.5">
                  {t('landing.waitlist.emailLabel')}
                </span>
                <input
                  type="email"
                  required
                  autoFocus
                  disabled={status === 'submitting'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('landing.waitlist.emailPlaceholder')}
                  className="w-full rounded-xl border border-[var(--fs-rule)] bg-white dark:bg-white/5 px-4 py-3 text-[var(--fs-ink)] placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20 focus:border-[var(--purple)] transition-all"
                />
              </label>

              {status === 'error' && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errorMessage}
                </p>
              )}

              {/* Wider gap between input and CTA — the previous
                  `space-y-3` felt cramped now that the button is
                  disabled-by-default and reads as a separate action. */}
              <Button
                type="submit"
                disabled={submitDisabled}
                className="mt-7 w-full"
              >
                {status === 'submitting'
                  ? t('landing.waitlist.submitting')
                  : t('landing.waitlist.submit')}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
