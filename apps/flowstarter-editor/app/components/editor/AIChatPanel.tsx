/**
 * AI Chat Panel (left side)
 *
 * Matching the landing page design: green pills for user messages,
 * plain text with sparkle for assistant, suggestion chips, green send button.
 * Personalized team greeting when chat is empty.
 */

import { ArrowRight } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LogoIcon, GlassPanel } from '@flowstarter/flow-design-system';
type ChatMessage = { role: 'user' | 'assistant'; content: string; id?: string; timestamp?: number };

interface AIChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  suggestions: string[];
  onSendMessage: (message: string) => void;
  onSuggestionClick: (suggestion: string) => void;
  userName?: string;
  isTeam?: boolean;
}

const PLACEHOLDER_SUGGESTIONS = [
  'Try: Add a contact form...',
  'Try: Change the colors...',
  'Try: Add pricing tables...',
  'Try: Update the hero section...',
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

export function AIChatPanel({
  messages,
  isGenerating,
  suggestions,
  onSendMessage,
  onSuggestionClick,
  userName,
  isTeam,
}: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const greeting = useMemo(() => getTimeGreeting(), []);

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_SUGGESTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isGenerating) return;
      onSendMessage(input.trim());
      setInput('');
    },
    [input, isGenerating, onSendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <LogoIcon size="sm" />
          <span className="text-xs font-medium tracking-widest uppercase text-gray-400 dark:text-zinc-500">
            Flowstarter Editor
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <GlassPanel shadow="subtle" padding="lg" className="w-full max-w-sm text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                {greeting}{userName ? `, ${userName}` : ''}
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 flex items-center justify-center gap-1.5 mb-4">
                <span className="text-emerald-500">&#10024;</span>
                Welcome to Flowstarter Editor
              </p>
              <p className="text-sm text-gray-600 dark:text-zinc-300">
                {isTeam
                  ? "Describe your client's business and I'll build their site."
                  : 'Start building your website by typing a message below or clicking a suggestion.'}
              </p>
            </GlassPanel>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id}>
            {message.role === 'user' ? (
              <UserMessage content={message.content} />
            ) : (
              <AssistantMessage
                content={message.content}
                isStreaming={message.isStreaming}
              />
            )}
          </div>
        ))}

        {isGenerating && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2 text-gray-500 dark:text-zinc-400 text-sm">
            <span className="text-emerald-500 mt-0.5 animate-pulse">&#10022;</span>
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-5 pb-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER_SUGGESTIONS[placeholderIndex]}
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Suggestion chips */}
        {suggestions.length > 0 && !isGenerating && (
          <div className="flex flex-wrap gap-2 mt-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 text-sm text-gray-600 dark:text-zinc-300 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950 dark:hover:border-emerald-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="bg-emerald-600 text-white rounded-xl px-5 py-3 text-sm font-medium">
      {content}
    </div>
  );
}

function AssistantMessage({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  return (
    <div className="flex gap-2 text-gray-700 dark:text-zinc-300 text-sm">
      <span className={`text-emerald-500 mt-0.5 shrink-0 ${isStreaming ? 'animate-pulse' : ''}`}>
        &#10022;
      </span>
      <span className="whitespace-pre-wrap">
        {content}
        {isStreaming && <span className="animate-pulse">|</span>}
      </span>
    </div>
  );
}
