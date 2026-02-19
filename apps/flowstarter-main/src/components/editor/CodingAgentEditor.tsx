'use client';

import TemplatePreview from '@/components/template-preview/TemplatePreview';
import { Button } from '@/components/ui/button';
import { GradientBackground } from '@/components/ui/gradient-background';
import { useImageAttachment } from '@/hooks/useImageAttachment';
import { usePanelResize } from '@/hooks/usePanelResize';
import type {
  GenerationProgress,
  GenerationStep,
  QualityMetrics,
} from '@/hooks/useStreamingWebsiteGeneration';
import { useState } from 'react';
import { ChatPanel } from './ChatPanel';
import { PreviewPanel } from './PreviewPanel';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  imageUrl?: string;
};

export interface CodingAgentEditorProps {
  // Generation state
  isGenerating: boolean;
  progress?: GenerationProgress | null;
  steps?: GenerationStep[];
  currentStep?: number;
  generationError?: string | null;

  // Code and preview
  generatedCode: string;
  previewHtml?: string;
  previewUrl?: string | null; // URL to live preview (from Convex/Daytona)

  // Project context
  projectName: string;
  templateId?: string;

  // Callbacks
  onSendMessage: (message: string, imageData?: string | null) => Promise<void>;
  onRetry?: () => void;

  // Chat messages (controlled)
  chatMessages: ChatMessage[];

  // Quality metrics (optional)
  qualityMetrics?: QualityMetrics | null;

  // Generated files
  generatedFiles?: Array<{ path: string; content: string }>;
}

export function CodingAgentEditor({
  isGenerating,
  progress: _progress,
  steps = [],
  previewHtml,
  previewUrl,
  projectName,
  templateId,
  onSendMessage,
  onRetry,
  chatMessages,
}: CodingAgentEditorProps) {
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  // Use custom hooks for image attachment and panel resizing
  const {
    attachedImage,
    isUploadingImage,
    fileInputRef,
    handleImageAttach,
    handleRemoveImage,
    clearImage,
  } = useImageAttachment();

  const {
    width: panelWidth,
    isResizing,
    handleMouseDown,
  } = usePanelResize({
    storageKey: 'codingAgentEditor_messagesPanelWidth',
    defaultWidth: 600,
  });

  const handleSend = async (message: string, imageData?: string | null) => {
    clearImage();
    await onSendMessage(message, imageData);
  };

  return (
    <>
      <div
        className="fixed inset-0 flex flex-col overflow-hidden z-[100] backdrop-blur-xl dark:bg-[#1b1b25]/80 bg-white/80"
        style={{
          top: '64px', // Account for global navbar height
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {/* Background gradient - Figma-style blurred ellipses */}
        <GradientBackground variant="dashboard" includeBackground={false} />

        {/* Two-pane: Chat (left) + Preview (right) */}
        <div className="flex flex-1 overflow-hidden relative z-10">
          <ChatPanel
            messages={chatMessages}
            isGenerating={isGenerating}
            onRetry={onRetry}
            onSendMessage={handleSend}
            attachedImage={attachedImage}
            isUploadingImage={isUploadingImage}
            fileInputRef={fileInputRef}
            onImageAttach={handleImageAttach}
            onRemoveImage={handleRemoveImage}
            width={panelWidth}
            isResizing={isResizing}
            onResizeStart={handleMouseDown}
            steps={steps}
          />

          {/* Right: Preview */}
          <PreviewPanel
            previewHtml={previewHtml}
            previewUrl={previewUrl}
            projectName={projectName}
            isGenerating={isGenerating}
            onFullscreen={() => setIsPreviewFullscreen(true)}
          />
        </div>
      </div>

      {/* Fullscreen overlay */}
      {isPreviewFullscreen && (previewHtml || previewUrl) && templateId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="absolute top-6 right-6 z-10">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsPreviewFullscreen(false)}
              className="shadow-xl"
            >
              Close
            </Button>
          </div>
          <div className="w-[min(95vw,1400px)] h-[95vh] bg-white dark:bg-gray-950 rounded-2xl overflow-hidden border border-border/60 shadow-2xl ring-1 ring-purple-500/10">
            <TemplatePreview templateId={templateId} theme="light" />
          </div>
        </div>
      )}
    </>
  );
}
