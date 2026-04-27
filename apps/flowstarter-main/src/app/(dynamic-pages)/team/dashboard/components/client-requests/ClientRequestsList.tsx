'use client';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/unified-button';
import { ListShell, FilterTabs, SortSelect, SearchInput } from '../ListShell';
import { useClientRequests } from '@/lib/client-requests/useClientRequests';
import { useClientRequestsRealtime } from '@/lib/client-requests/useClientRequestsRealtime';
import { RequestCard } from './RequestCard';

const STATUS_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'operator', label: 'Operator' },
  { value: 'all', label: 'All' },
  { value: 'resolved', label: 'Resolved' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'priority', label: 'Priority' },
];

interface OperatorRequest {
  id: string;
  email: string;
  message: string;
  created_at: string | null;
  responded_at: string | null;
  notes: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'unknown';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.floor(diff / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ClientRequestsList() {
  const [status, setStatus] = useState('pending');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [operatorLoading, setOperatorLoading] = useState(false);
  const [operatorRequests, setOperatorRequests] = useState<OperatorRequest[]>(
    []
  );
  const [handlingId, setHandlingId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});

  useClientRequestsRealtime();

  const isOperatorView = status === 'operator';
  const { data, isLoading } = useClientRequests({
    status: isOperatorView ? 'all' : status,
    sort,
    search,
  });
  const requests = data?.requests ?? [];
  const filteredOperatorRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return operatorRequests;
    return operatorRequests.filter((item) =>
      item.message.toLowerCase().includes(query)
    );
  }, [operatorRequests, search]);

  useEffect(() => {
    if (!isOperatorView) return;
    let cancelled = false;
    const loadOperatorRequests = async () => {
      try {
        setOperatorLoading(true);
        const res = await fetch('/api/support-operator-requests', {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const payload = (await res.json()) as { requests?: OperatorRequest[] };
        if (!cancelled) {
          setOperatorRequests(payload.requests ?? []);
        }
      } finally {
        if (!cancelled) setOperatorLoading(false);
      }
    };
    void loadOperatorRequests();
    return () => {
      cancelled = true;
    };
  }, [isOperatorView]);

  const handleOperatorRequest = async (id: string) => {
    const response = (responses[id] ?? '').trim();
    if (!response) return;
    setHandlingId(id);
    try {
      const res = await fetch(`/api/support-operator-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      if (!res.ok) return;
      setOperatorRequests((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                responded_at: new Date().toISOString(),
                notes: response,
              }
            : item
        )
      );
    } finally {
      setHandlingId(null);
    }
  };

  const emptyTitle = isOperatorView
    ? 'No operator requests yet'
    : status === 'resolved'
    ? "You're all caught up"
    : 'No client requests yet';

  const emptyDescription = isOperatorView
    ? 'Operator handoffs from landing chat appear here.'
    : status === 'resolved'
    ? 'No resolved requests in this view.'
    : 'When clients hit the limits of their editor, requests will appear here.';

  return (
    <ListShell
      id="client-requests-list"
      title="Client Requests"
      count={
        !isLoading && !operatorLoading
          ? (isOperatorView
              ? filteredOperatorRequests.length
              : requests.length) || undefined
          : undefined
      }
      loading={isOperatorView ? operatorLoading : isLoading}
      empty={
        isOperatorView
          ? !operatorLoading && filteredOperatorRequests.length === 0
          : !isLoading && requests.length === 0
      }
      emptyIcon={<Inbox className="w-8 h-8" />}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      filters={
        <>
          {/* Tabs — full width on mobile, scrollable */}
          <div className="w-full">
            <FilterTabs
              tabs={STATUS_TABS}
              value={status}
              onChange={setStatus}
            />
          </div>
          {/* Sort + search on same row below */}
          <div className="flex items-center gap-2 w-full">
            <SortSelect
              options={SORT_OPTIONS}
              value={sort}
              onChange={setSort}
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search requests…"
            />
          </div>
        </>
      }
    >
      {isOperatorView ? (
        <div className="space-y-3">
          {filteredOperatorRequests.map((item) => {
            const disabled = Boolean(item.responded_at);
            const sessionLabel = item.email
              .replace('support+', '')
              .replace('@flowstarter.net', '');
            return (
              <div
                key={item.id}
                className="rounded-[var(--fs-radius-2xl)] border p-4 backdrop-blur-xl"
                style={{
                  background: 'var(--fs-glass-bg)',
                  borderColor: 'var(--fs-glass-edge)',
                  boxShadow: 'var(--fs-card-shadow)',
                }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-[var(--fs-ink)]">
                    Session {sessionLabel.slice(0, 14)}...
                  </p>
                  <span className="text-[11px] text-[var(--fs-ink-faint)]">
                    {timeAgo(item.created_at)}
                  </span>
                </div>
                <p className="mb-2 line-clamp-4 text-sm text-[var(--fs-ink-dim)]">
                  {item.message}
                </p>
                <textarea
                  value={responses[item.id] ?? item.notes ?? ''}
                  onChange={(e) =>
                    setResponses((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
                  disabled={disabled}
                  placeholder="Write operator response that will be pushed to chat"
                  className="mb-2 min-h-20 w-full rounded-lg border border-[var(--fs-rule)] bg-white p-2 text-xs text-[var(--fs-ink)] outline-none focus:ring-2 focus:ring-[var(--purple)]/20 disabled:opacity-60 dark:bg-white/[0.02]"
                />
                <div className="flex items-center justify-between">
                  {disabled ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Handled and sent to chat
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--fs-ink-faint)]">
                      This reply is delivered to the user chat.
                    </span>
                  )}
                  <Button
                    type="button"
                    className="h-8 px-3 py-1 text-xs"
                    disabled={
                      disabled ||
                      handlingId === item.id ||
                      !(responses[item.id] ?? '').trim()
                    }
                    onClick={() => void handleOperatorRequest(item.id)}
                  >
                    {handlingId === item.id ? 'Sending…' : 'Mark handled'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </ListShell>
  );
}
