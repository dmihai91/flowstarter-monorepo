interface TypingIndicatorProps {
  isTyping: boolean;
  message?: string;
}

export function TypingIndicator({ isTyping, message = 'Flowstarter is thinking...' }: TypingIndicatorProps) {
  if (!isTyping) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 ml-10 py-2">
      <div className="flex gap-1">
        <span
          className="w-2 h-2 bg-[var(--flowstarter-accent-purple)] rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-[var(--flowstarter-accent-purple)] rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 bg-[var(--flowstarter-accent-purple)] rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-sm text-[var(--bolt-elements-textSecondary)] italic">{message}</span>
    </div>
  );
}
