'use client';

import { Check } from 'lucide-react';

export const STEPS = [
  { label: 'Client & Brief', desc: 'Client info, industry, and AI brief' },
  { label: 'Review Brief', desc: 'Edit business details and goals' },
  { label: 'Pick Template', desc: 'Choose a site design for the client' },
  { label: 'Pricing & Launch', desc: 'Set fees, plan, and create project' },
];

export function StepIndicator({
  current,
  reviewStep = 0,
  reviewStepCount = 0,
}: {
  current: number;
  reviewStep?: number;
  reviewStepCount?: number;
}) {
  const activeStep = STEPS[current];
  const isReviewPhase = current === 1 && reviewStepCount > 0;
  // During review, show sub-step X of Y as a suffix
  const descSuffix = isReviewPhase
    ? ` · ${reviewStep + 1} of ${reviewStepCount}`
    : '';
  const displayDesc = activeStep.desc + descSuffix;
  const REVIEW_STEPS = ['Business', 'Offer', 'Structure', 'Contact'];
  const reviewLabel = isReviewPhase
    ? REVIEW_STEPS[reviewStep] ?? activeStep.label
    : activeStep.label;
  return (
    <div
      className="w-full mb-6 rounded-[var(--fs-radius-2xl)] border px-4 sm:px-6 py-4 sm:py-5 backdrop-blur-2xl backdrop-saturate-150"
      style={{
        background: 'var(--fs-glass-bg)',
        borderColor: 'var(--fs-glass-edge)',
        boxShadow: 'var(--fs-card-shadow)',
      }}
    >
      {/* Mobile: compact progress */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--purple)] flex items-center justify-center text-xs font-bold text-white ring-4 ring-[var(--purple)]/20">
              {isReviewPhase ? reviewStep + 1 : current + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
                {isReviewPhase ? reviewLabel : activeStep.label}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {displayDesc}
              </p>
            </div>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
            {isReviewPhase
              ? `${reviewStep + 1}/${reviewStepCount}`
              : `${current + 1}/${STEPS.length}`}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--purple)] rounded-full transition-all duration-500"
            style={{
              width: isReviewPhase
                ? `${((reviewStep + 1) / reviewStepCount) * 100}%`
                : `${((current + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Desktop: full step row */}
      <div className="hidden sm:flex items-start justify-between">
        {STEPS.map((step, i) => {
          const isActive = i === current;
          const isDone = i < current;
          const isLast = i === STEPS.length - 1;
          return (
            <div key={i} className="flex flex-1 items-start">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    isDone
                      ? 'bg-[var(--purple)] text-white'
                      : isActive
                      ? 'bg-[var(--purple)] text-white ring-4 ring-[var(--purple)]/20'
                      : 'bg-gray-100 text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-400'
                  }`}
                >
                  {isDone ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={`text-sm font-semibold leading-5 ${
                      isActive || isDone
                        ? 'text-zinc-900 dark:text-white'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`mt-0.5 text-xs leading-4 ${
                      isActive || isDone
                        ? 'text-zinc-500 dark:text-zinc-400'
                        : 'text-zinc-400 dark:text-zinc-600'
                    }`}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
              {!isLast && (
                <div
                  className={`mt-5 h-px flex-1 mx-3 transition-all duration-300 ${
                    isDone
                      ? 'bg-[var(--purple)]'
                      : 'bg-gray-200 dark:bg-white/[0.06]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
