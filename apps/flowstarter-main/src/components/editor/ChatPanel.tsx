'use client';

import type { GenerationStep } from '@/hooks/useStreamingWebsiteGeneration';
import { GripVertical } from 'lucide-react';
import { ChatInput } from './ChatInput';
import { ChatMessageList } from './ChatMessageList';
import type { ChatMessage } from './CodingAgentEditor';

interface ChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onRetry?: () => void;
  onSendMessage: (message: string, imageData?: string | null) => Promise<void>;
  attachedImage: string | null;
  isUploadingImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageAttach: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveImage: () => void;
  width: number;
  isResizing: boolean;
  onResizeStart: (e: React.MouseEvent) => void;
  placeholder?: string;
  steps?: GenerationStep[]; // Generation progress steps
}

export function ChatPanel({
  messages,
  isGenerating,
  onRetry,
  onSendMessage,
  attachedImage,
  isUploadingImage,
  fileInputRef,
  onImageAttach,
  onRemoveImage,
  width,
  isResizing,
  onResizeStart,
  placeholder,
  steps = [],
}: ChatPanelProps) {
  return (
    <>
      {/* Chat panel */}
      <div
        className="flex flex-col items-start justify-between relative h-full backdrop-blur-md dark:bg-[rgba(58,58,74,0.30)] bg-[rgba(255,255,255,0.40)] border-r dark:border-white/10 border-gray-300/50"
        style={{
          width: `${width}px`,
          minWidth: '300px',
          maxWidth: '1200px',
          padding: '32px 24px',
          gap: '24px',
          boxShadow: 'inset -1px 0 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <ChatMessageList
          messages={messages}
          isGenerating={isGenerating}
          onRetry={onRetry}
          steps={steps}
        />

        <ChatInput
          onSend={onSendMessage}
          isDisabled={isGenerating}
          attachedImage={attachedImage}
          isUploadingImage={isUploadingImage}
          fileInputRef={fileInputRef}
          onImageAttach={onImageAttach}
          onRemoveImage={onRemoveImage}
          placeholder={placeholder}
        />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="absolute top-0 w-1 h-full cursor-col-resize group hover:bg-[var(--purple)]/40 active:bg-[var(--purple)] transition-colors z-20"
        style={{
          left: `${width}px`,
          backgroundColor: isResizing ? 'var(--purple)' : undefined,
        }}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2">
          <div className="bg-white dark:bg-gray-700 group-hover:bg-[var(--purple)] rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg border border-gray-200 dark:border-gray-600 group-hover:border-[var(--purple)] group-hover:shadow-[var(--purple)]/50">
            <GripVertical className="h-4 w-4 text-gray-500 dark:text-gray-300 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </>
  );
}
