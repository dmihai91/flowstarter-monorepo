'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Bot, Mail } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const OPERATOR_EMAIL = 'hello@flowstarter.net';
const OPERATOR_MAILTO = `mailto:${OPERATOR_EMAIL}?subject=${encodeURIComponent(
  'Support request from the Flowstarter site'
)}`;

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
  showBookCallCta?: boolean;
};

/**
 * Local intent classifier — instant replies for the most common questions.
 * Returns null when no local match (caller falls back to the LLM API).
 */
function classifyLocal(input: string): string | null {
  const lower = input.toLowerCase().trim();

  if (/(price|pricing|cost|how much|€|euro|\$|fee)/.test(lower))
    return 'supportBot.replyPrice';
  if (/(time|how long|days|weeks|deliver|launch|turnaround)/.test(lower))
    return 'supportBot.replyTimeline';
  if (/\b(editor|edit|update|change|modify)\b/.test(lower))
    return 'supportBot.replyEditor';
  if (/(own|lock-in|hosting|server|leave|cancel|migrate)/.test(lower))
    return 'supportBot.replyOwnership';
  if (/(capacity|slot|how many|month|clients|spots|availability)/.test(lower))
    return 'supportBot.replyCapacity';
  if (/(domain|email|address|dns)/.test(lower)) return 'supportBot.replyDomain';
  if (/(discovery|first call|45.minute|consult)/.test(lower))
    return 'supportBot.replyDiscovery';
  if (/(ecommerce|e-commerce|store|storefront|shop|sell)/.test(lower))
    return 'supportBot.replyEcommerce';
  if (/(includ|what.*get|what.*pack|inside)/.test(lower))
    return 'supportBot.replyIncluded';
  if (/(support|help|after launch|maintenance)/.test(lower))
    return 'supportBot.replySupport';
  return null;
}

export function SupportBot() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Seed greeting once we have t available.
  useEffect(() => {
    setMessages([{ role: 'assistant', text: t('supportBot.greeting') }]);
  }, [t]);

  // Scroll to latest message when new ones arrive.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const appendAssistant = (text: string, showBookCallCta = false) => {
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text, showBookCallCta },
    ]);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');

    // Local classifier first — instant reply for common questions.
    const localKey = classifyLocal(trimmed);
    if (localKey) {
      window.setTimeout(() => appendAssistant(t(localKey)), 320);
      return;
    }

    // Fall back to the LLM-backed support endpoint.
    setIsTyping(true);
    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages
            .slice(-6)
            .map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      if (!res.ok) throw new Error('chat-failed');
      const data = (await res.json()) as { reply: string; handoff?: boolean };
      appendAssistant(data.reply, Boolean(data.handoff));
    } catch {
      appendAssistant(t('supportBot.replyError'), true);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEscalate = () => {
    setOpen(false);
    if (typeof window !== 'undefined') {
      window.location.href = OPERATOR_MAILTO;
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('supportBot.openLabel')}
          className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--purple)] text-white shadow-lg shadow-[var(--purple)]/30 transition-all duration-300 hover:scale-110 hover:shadow-xl"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={t('supportBot.title')}
          className="fixed bottom-6 right-5 z-40 flex w-[calc(100vw-2.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] shadow-2xl"
          style={{ maxHeight: 'min(82vh, 36rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--fs-rule)] px-4 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--purple)]/10">
                <Bot className="h-5 w-5 text-[var(--purple)]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[var(--fs-ink)]">
                  {t('supportBot.title')}
                </p>
                <p className="truncate text-[13px] text-[var(--fs-ink-faint)]">
                  {t('supportBot.subtitle')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('supportBot.closeLabel')}
              className="rounded-md p-1.5 text-[var(--fs-ink-faint)] hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-auto bg-[var(--purple)] text-white'
                      : 'bg-[var(--fs-glass-bg)] text-[var(--fs-ink-dim)] border border-[var(--fs-rule)]/60'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'assistant' && msg.showBookCallCta && (
                  <button
                    type="button"
                    onClick={handleEscalate}
                    className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--purple)]/30 bg-[var(--purple)]/10 px-3.5 py-1.5 text-[13px] font-medium text-[var(--purple)] hover:bg-[var(--purple)]/15"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {t('supportBot.contactOperator')}
                  </button>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="max-w-[88%] rounded-2xl border border-[var(--fs-rule)]/60 bg-[var(--fs-glass-bg)] px-4 py-2.5 text-[14px] text-[var(--fs-ink-faint)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--fs-ink-faint)]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--fs-ink-faint)] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--fs-ink-faint)] [animation-delay:300ms]" />
                  <span className="ml-1">{t('supportBot.typing')}</span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-[var(--fs-rule)] px-3.5 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                disabled={isTyping}
                placeholder={t('supportBot.placeholder')}
                className="h-11 w-full rounded-lg border border-[var(--fs-rule)] bg-white dark:bg-white/[0.03] px-4 text-[14px] text-[var(--fs-ink)] outline-none focus:ring-2 focus:ring-[var(--purple)]/20 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isTyping}
                aria-label={t('supportBot.send')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--purple)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleEscalate}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--fs-rule)] bg-transparent px-3 py-2 text-[13px] font-medium text-[var(--fs-ink-dim)] hover:bg-[var(--fs-glass-bg)] hover:text-[var(--fs-ink)]"
            >
              <Mail className="h-3.5 w-3.5" />
              {t('supportBot.contactOperator')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
