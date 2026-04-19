'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { useRejectRequest } from '@/lib/client-requests/useClientRequests';

interface Props {
  requestId: string;
  requestTitle: string;
  onClose: () => void;
}

export function RejectRequestDialog({
  requestId,
  requestTitle,
  onClose,
}: Props) {
  const [reason, setReason] = useState('');
  const { mutate: reject, isPending } = useRejectRequest();

  const canSubmit = reason.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--fs-radius-2xl)] border p-6 backdrop-blur-2xl backdrop-saturate-150" style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[var(--fs-ink)]">
              Reject Request
            </h3>
            <p className="text-sm text-[var(--fs-ink-faint)] mt-0.5 truncate max-w-[280px]">
              {requestTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">
          Reason{' '}
          <span className="text-gray-400 dark:text-white/30 font-normal">
            (min 10 chars)
          </span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Explain why this request is being rejected so the client understands..."
          className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/40 resize-none"
        />
        <p className="text-xs text-gray-400 dark:text-white/30 mt-1">
          {reason.trim().length}/10 min
        </p>

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit || isPending}
            onClick={() =>
              reject(
                { id: requestId, reason: reason.trim() },
                { onSuccess: onClose }
              )
            }
            className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Rejecting…' : 'Reject Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
