'use client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  filesChanged?: string[];
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-[var(--flow-accent-purple)] text-white rounded-br-md'
            : 'bg-[var(--flow-bg-elevated)] text-[var(--flow-text-primary)] rounded-bl-md'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        {message.filesChanged && message.filesChanged.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-xs text-white/60 mb-1">Files changed:</p>
            {message.filesChanged.map((file) => (
              <span
                key={file}
                className="inline-block text-xs bg-white/10 rounded px-1.5 py-0.5 mr-1 mb-1 font-mono"
              >
                {file}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
