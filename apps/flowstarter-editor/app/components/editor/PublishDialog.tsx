/**
 * Publish Dialog
 *
 * Multi-step progress dialog for publishing to Cloudflare Pages.
 */

import { ExternalLink, X, RefreshCw, Check, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';

type PublishStep = 'idle' | 'building' | 'uploading' | 'deploying' | 'done' | 'error';

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const STEP_LABELS: Record<PublishStep, string> = {
  idle: 'Ready to publish',
  building: 'Building site...',
  uploading: 'Uploading bundle...',
  deploying: 'Deploying to Cloudflare...',
  done: 'Your site is live!',
  error: 'Publishing failed',
};

export function PublishDialog({ isOpen, onClose, projectId }: PublishDialogProps) {
  const [step, setStep] = useState<PublishStep>('idle');
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startPublish = useCallback(async () => {
    setStep('building');
    setError(null);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error('Publishing failed');
      }

      // Simulate step progression (actual API would send SSE events)
      setStep('uploading');
      await new Promise((r) => setTimeout(r, 1000));

      setStep('deploying');

      const data = await response.json();
      setPublishedUrl(data.publishedUrl || null);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publishing failed');
      setStep('error');
    }
  }, [projectId]);

  const handleClose = () => {
    setStep('idle');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            Publish
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Progress steps */}
          <div className="space-y-3">
            <StepIndicator step="building" currentStep={step} label="Build site" />
            <StepIndicator step="uploading" currentStep={step} label="Upload bundle" />
            <StepIndicator step="deploying" currentStep={step} label="Deploy" />
          </div>

          {/* Status text */}
          <p className="text-sm text-center text-gray-600 dark:text-zinc-400">
            {STEP_LABELS[step]}
          </p>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Published URL */}
          {publishedUrl && step === 'done' && (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
            >
              <ExternalLink size={14} />
              {publishedUrl}
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
          {step === 'idle' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startPublish}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
              >
                Publish Now
              </button>
            </>
          )}

          {step === 'error' && (
            <button
              onClick={startPublish}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}

          {step === 'done' && (
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({
  step,
  currentStep,
  label,
}: {
  step: PublishStep;
  currentStep: PublishStep;
  label: string;
}) {
  const steps: PublishStep[] = ['building', 'uploading', 'deploying'];
  const stepIdx = steps.indexOf(step);
  const currentIdx = steps.indexOf(currentStep);

  const isDone = currentStep === 'done' || currentIdx > stepIdx;
  const isActive = currentStep === step;
  const isPending = currentIdx < stepIdx && currentStep !== 'done';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          isDone
            ? 'bg-emerald-500 text-white'
            : isActive
              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500'
        }`}
      >
        {isDone ? (
          <Check size={14} />
        ) : isActive ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <span className="text-xs">{stepIdx + 1}</span>
        )}
      </div>
      <span
        className={`text-sm ${
          isDone || isActive
            ? 'text-gray-900 dark:text-zinc-100 font-medium'
            : 'text-gray-400 dark:text-zinc-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
