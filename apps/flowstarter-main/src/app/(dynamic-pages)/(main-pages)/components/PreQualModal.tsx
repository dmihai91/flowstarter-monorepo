'use client';

import { useState, useEffect } from 'react';
import { EXTERNAL_URLS } from '@/lib/constants';

const OPTIONS = [
  {
    id: 'starter',
    name: 'Starter',
    desc: 'I need a solid site fast',
    price: '499€',
  },
  {
    id: 'relaunch',
    name: 'Relaunch',
    desc: 'I have a site that needs a fresh start',
    price: '699€–999€',
  },
  {
    id: 'growth',
    name: 'Growth',
    desc: 'I want the full setup + editor access',
    price: '999€–1499€',
  },
  {
    id: 'pro',
    name: 'Pro',
    desc: 'I need something custom',
    price: '1999€+',
  },
  {
    id: 'unsure',
    name: 'Not sure yet',
    desc: 'Help me decide on the call',
    price: null,
  },
] as const;

type OptionId = (typeof OPTIONS)[number]['id'];

interface PreQualModalProps {
  open: boolean;
  onClose: () => void;
  source?: string;
}

export function PreQualModal({ open, onClose, source = 'cta' }: PreQualModalProps) {
  const [selected, setSelected] = useState<OptionId | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const calendlyUrl = selected
    ? `${EXTERNAL_URLS.calendly.discovery}?utm_content=${selected}-plan&utm_source=${source}&utm_medium=prequal-modal`
    : EXTERNAL_URLS.calendly.discovery;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prequal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white dark:bg-[#0f1117] shadow-2xl shadow-black/30 p-6 sm:p-8">

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--purple-primary)] mb-2">
              Free strategy call
            </p>
            <h2 id="prequal-title" className="text-xl font-bold text-gray-900 dark:text-white">
              Which best describes your situation?
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              We'll tailor the call based on your answer.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5 mb-6">
            {OPTIONS.map((opt) => {
              const isSelected = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelected(opt.id)}
                  className={[
                    'w-full flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-150',
                    isSelected
                      ? 'border-[var(--purple-primary)] bg-[var(--purple-primary)]/8 ring-1 ring-[var(--purple-primary)]'
                      : 'border-gray-200 dark:border-white/10 hover:border-[var(--purple-primary)]/50 dark:hover:border-white/20 bg-transparent',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    {/* Radio dot */}
                    <span className={[
                      'flex-shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors',
                      isSelected
                        ? 'border-[var(--purple-primary)]'
                        : 'border-gray-300 dark:border-white/30',
                    ].join(' ')}>
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-[var(--purple-primary)]" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                        {opt.name}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                        {opt.desc}
                      </span>
                    </span>
                  </span>
                  {opt.price && (
                    <span className="flex-shrink-0 text-xs font-medium text-gray-400 dark:text-white/40">
                      {opt.price}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <a
            href={selected ? calendlyUrl : undefined}
            target={selected ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={!selected ? (e) => e.preventDefault() : undefined}
            aria-disabled={!selected}
            className={[
              'flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200',
              selected
                ? 'bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] text-white shadow-lg shadow-[var(--purple-primary)]/25 hover:opacity-90'
                : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed',
            ].join(' ')}
          >
            Book my strategy call
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>

          <p className="mt-3 text-center text-xs text-gray-400 dark:text-white/30">
            Free, no commitment. 30-minute call.
          </p>
        </div>
      </div>
    </>
  );
}
