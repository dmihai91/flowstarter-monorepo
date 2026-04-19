'use client';
import { useState } from 'react';
import { MoreHorizontal, ExternalLink } from 'lucide-react';
import type {
  ClientRequest,
  RequestPriority,
} from '@/lib/client-requests/types';
import {
  useAcceptRequest,
  useUpdateRequestPriority,
} from '@/lib/client-requests/useClientRequests';
import { RejectRequestDialog } from './RejectRequestDialog';
import { EditorContextDrawer } from './EditorContextDrawer';

const PRIORITY_DOT: Record<RequestPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  normal: 'bg-blue-400',
  low: 'bg-gray-300 dark:bg-white/20',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  request: ClientRequest;
}

export function RequestCard({ request }: Props) {
  const [showReject, setShowReject] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { mutate: accept, isPending: isAccepting } = useAcceptRequest();
  const { mutate: updatePriority } = useUpdateRequestPriority();

  const handleAccept = () => {
    accept(request.id, {
      onSuccess: (data) => {
        const sessionId = data.request?.workspace_session_id;
        const workspaceUrl = sessionId
          ? `/team/dashboard/editor?session=${sessionId}`
          : `/team/dashboard/projects/${request.project_id}`;
        window.open(workspaceUrl, '_blank');
      },
    });
  };

  const projectName = request.projects?.name ?? request.project_id;
  const clientName = request.projects?.client_name ?? 'Client';

  return (
    <>
      <div className="rounded-[var(--fs-radius-2xl)] border p-4 backdrop-blur-xl transition-all hover:-translate-y-0.5" style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}>
        <div className="flex items-start gap-3">
          {/* Priority dot */}
          <span
            className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
              PRIORITY_DOT[request.priority]
            }`}
            aria-label={`${request.priority} priority`}
          />

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {request.title}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/30 shrink-0 whitespace-nowrap">
                {timeAgo(request.created_at)}
              </span>
            </div>

            {/* Client / project */}
            <p className="text-xs text-gray-500 dark:text-white/40 mb-2">
              {clientName} · {projectName}
            </p>

            {/* Description preview */}
            <p className="text-sm text-gray-600 dark:text-white/60 line-clamp-2 mb-3">
              {request.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleAccept}
                disabled={isAccepting || request.status !== 'pending'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--purple)] text-white text-xs font-semibold hover:bg-[var(--purple)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {isAccepting ? 'Opening…' : 'Accept → Open in Editor'}
              </button>

              <button
                onClick={() => setShowReject(true)}
                disabled={
                  request.status === 'rejected' || request.status === 'resolved'
                }
                className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Reject
              </button>

              <div className="relative ml-auto">
                <button
                  onClick={() => setShowMenu((s) => !s)}
                  aria-label="More actions"
                  className="p-1.5 rounded-lg text-gray-400 dark:text-white/30 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 z-10 w-44 rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[rgba(18,12,42,0.95)] shadow-lg py-1">
                    {(['urgent', 'high', 'normal', 'low'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          updatePriority({ id: request.id, priority: p });
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.06] capitalize"
                      >
                        Mark {p}
                      </button>
                    ))}
                    {request.editor_context && (
                      <>
                        <div className="border-t border-gray-100 dark:border-white/[0.06] my-1" />
                        <button
                          onClick={() => {
                            setShowContext(true);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                        >
                          View editor context
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReject && (
        <RejectRequestDialog
          requestId={request.id}
          requestTitle={request.title}
          onClose={() => setShowReject(false)}
        />
      )}
      {showContext && request.editor_context && (
        <EditorContextDrawer
          context={request.editor_context}
          onClose={() => setShowContext(false)}
        />
      )}
    </>
  );
}
