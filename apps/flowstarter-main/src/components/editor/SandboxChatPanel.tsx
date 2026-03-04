'use client';
import { useTranslations } from '@/lib/i18n';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button, Input, Spinner } from '@flowstarter/flow-design-system';
import { MessageBubble, type Message } from './MessageBubble';

interface SandboxChatPanelProps {
  projectId: string;
  workspaceId?: string;
  templateName?: string;
  onFilesChanged?: () => void;
}

export function SandboxChatPanel({ projectId, workspaceId, templateName, onFilesChanged }: SandboxChatPanelProps) {
  const { t } = useTranslations();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messageCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, streamingContent, scrollToBottom]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    // Add user message to local state
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const res = await fetch('/api/editor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          workspaceId,
          message: trimmed,
          templateName,
          isFirstMessage: messageCountRef.current === 0,
        }),
      });

      messageCountRef.current++;

      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let fullContent = '';
      let filesChanged: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);

            if (event.type === 'text') {
              fullContent += event.content;
              setStreamingContent(fullContent);
            } else if (event.type === 'files_changed') {
              filesChanged = event.files || [];
              onFilesChanged?.();
            } else if (event.type === 'error') {
              fullContent += `\n\nError: ${event.message}`;
              setStreamingContent(fullContent);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Add assistant message to local state
      if (fullContent) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          timestamp: new Date(),
          filesChanged: filesChanged.length > 0 ? filesChanged : undefined,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-[var(--flow-text-secondary)] text-sm">
              Describe what you want to build.
            </p>
            <p className="text-[var(--flow-text-muted)] text-xs mt-1">
              Claude will write the code and you&apos;ll see the preview live.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {/* Streaming assistant response */}
        {isStreaming && streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date(),
            }}
          />
        )}
        {isStreaming && !streamingContent && (
          <div className="flex items-center gap-2 text-[var(--flow-text-muted)] text-sm pl-2">
            <Spinner />
            <span>Claude is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--flow-border-default)] p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            variant="filled"
            placeholder={t('app.chatPlaceholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            className="flex-1"
          />
          <Button
            variant="gradient"
            size="md"
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            loading={isStreaming}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
