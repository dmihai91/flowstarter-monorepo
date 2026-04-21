'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bot, Headphones, Mail } from 'lucide-react';
import { UnifiedButton } from '@/components/ui/unified-button';

type ChatMessage = { role: 'assistant' | 'user'; text: string };

function getSupportSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';
  const key = 'flowstarter-support-session-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, generated);
  return generated;
}

export function LandingSupportSection() {
  const [mode, setMode] = useState<'ai' | 'operator'>('ai');
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: "Hi, I'm Flowstarter support AI. Ask anything about pricing, scope, or setup.",
    },
  ]);
  const [sessionId] = useState(() => getSupportSessionId());
  const [seenHandledIds, setSeenHandledIds] = useState<string[]>([]);
  const handledSet = useMemo(() => new Set(seenHandledIds), [seenHandledIds]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const pollHandled = async () => {
      try {
        const res = await fetch(
          `/api/support-operator-requests/session/${encodeURIComponent(
            sessionId
          )}`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          handled?: { id: string; response: string }[];
        };
        if (cancelled || !data.handled?.length) return;

        const fresh = data.handled.filter((item) => !handledSet.has(item.id));
        if (fresh.length === 0) return;

        setSeenHandledIds((prev) => [...prev, ...fresh.map((item) => item.id)]);
        setMessages((prev) => [
          ...prev,
          ...fresh.map((item) => ({
            role: 'assistant' as const,
            text: `Operator update: ${item.response}`,
          })),
        ]);
      } catch {
        // no-op; polling is best-effort
      }
    };

    void pollHandled();
    const interval = window.setInterval(() => {
      void pollHandled();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [open, sessionId, handledSet]);

  const submit = async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');

    try {
      setIsSending(true);
      if (mode === 'operator') {
        const response = await fetch('/api/support-operator-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            message: text,
            history: messages.slice(-8).map((m) => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              text: m.text,
            })),
          }),
        });
        const data = (await response.json()) as { id?: string };
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.id
              ? 'Operator request queued. You will receive the operator reply here in this chat.'
              : 'Operator request received. We will follow up soon.',
          },
        ]);
        return;
      }

      const response = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-8).map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            text: m.text,
          })),
        }),
      });
      const data = (await response.json()) as { reply?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            data.reply ||
            'I can help with pricing, timeline, and integrations. How can I help?',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Support is temporarily unavailable. Please email hello@flowstarter.app.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-28 right-3 z-40 sm:bottom-20 sm:right-6">
      {!open && (
        <UnifiedButton
          type="button"
          onClick={() => setOpen(true)}
          className="h-11 w-11 rounded-full p-0 shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
          aria-label="Open support chat"
        >
          <Headphones className="h-4 w-4" />
        </UnifiedButton>
      )}

      {open && (
        <div className="w-[min(92vw,360px)] rounded-xl border border-[var(--fs-rule)] bg-white/88 p-4 shadow-2xl backdrop-blur-xl dark:bg-[var(--fs-bg-base)]/85">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[var(--fs-ink)]">
              Support chat
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs text-[var(--fs-ink-faint)] hover:bg-black/5 dark:hover:bg-white/10"
            >
              Close
            </button>
          </div>

          <div className="mb-3 inline-flex rounded-lg border border-[var(--fs-rule)] bg-white/70 p-0.5 dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                mode === 'ai'
                  ? 'bg-[var(--purple)] text-white'
                  : 'text-[var(--fs-ink-faint)]'
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              AI
            </button>
            <button
              type="button"
              onClick={() => setMode('operator')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                mode === 'operator'
                  ? 'bg-[var(--purple)] text-white'
                  : 'text-[var(--fs-ink-faint)]'
              }`}
            >
              <Headphones className="h-3.5 w-3.5" />
              Operator
            </button>
          </div>

          <div className="mb-3 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-[var(--fs-rule)] bg-white/75 p-2.5 dark:bg-black/10">
            {messages.slice(-6).map((msg, i) => (
              <div
                key={i}
                className={`max-w-[92%] rounded-lg px-2.5 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'ml-auto bg-[var(--purple)] text-white'
                    : 'bg-[var(--fs-bg-elevated)] text-[var(--fs-ink-dim)]'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit();
              }}
              placeholder={
                mode === 'ai'
                  ? 'Ask the AI support assistant...'
                  : 'Leave a message for an operator...'
              }
              className="h-9 w-full rounded-lg border border-[var(--fs-rule)] bg-white px-3 text-xs text-[var(--fs-ink)] outline-none focus:ring-2 focus:ring-[var(--purple)]/20 dark:bg-white/[0.03]"
            />
            <UnifiedButton
              type="button"
              onClick={() => void submit()}
              className="h-9 px-3 py-2 text-xs"
              disabled={isSending}
            >
              {isSending ? '...' : 'Send'}
            </UnifiedButton>
          </div>

          <a
            href="mailto:hello@flowstarter.app"
            className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[var(--purple)] hover:underline"
          >
            <Mail className="h-4 w-4" />
            hello@flowstarter.app
          </a>
        </div>
      )}
    </div>
  );
}
