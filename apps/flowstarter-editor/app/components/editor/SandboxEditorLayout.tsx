/**
 * Sandbox Editor Layout
 *
 * Full-screen editor matching the landing page illustration.
 * Desktop: chat (left) + preview/code (right) with resizable panels.
 * Mobile: chat full-screen + floating preview button.
 */

import { Eye } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useUser } from '@clerk/remix';
import { EditorHeader } from './EditorHeader';
import { AIChatPanel } from './AIChatPanel';
import { LivePreview } from './LivePreview';
import { CodePanel } from './CodePanel';
import { PreviewModal } from './PreviewModal';
import { useEditorRole } from '~/lib/hooks/useEditorRole';
import { useSandboxChat } from '~/lib/hooks/useSandboxChat';
import { useSandboxPreview } from '~/lib/hooks/useSandboxPreview';
import { useSuggestionChips } from '~/lib/hooks/useSuggestionChips';

interface SandboxEditorLayoutProps {
  projectId: string;
  domainName?: string;
  onBack: () => void;
  onPublish: () => void;
}

export function SandboxEditorLayout({
  projectId,
  domainName,
  onBack,
  onPublish,
}: SandboxEditorLayoutProps) {
  const permissions = useEditorRole();
  const { user } = useUser();
  const userName = user?.firstName || undefined;
  const isTeam = permissions.role === 'team';
  const [activePanel, setActivePanel] = useState<'preview' | 'code'>('preview');
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  const preview = useSandboxPreview({ projectId });

  const chat = useSandboxChat({
    projectId,
    onFilesChanged: () => {
      preview.refreshPreview();
    },
  });

  const suggestions = useSuggestionChips({
    messages: chat.messages,
    isGenerating: chat.isGenerating,
  });

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      chat.sendMessage(suggestion);
    },
    [chat],
  );

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-zinc-950">
      {/* Top toolbar */}
      <EditorHeader
        permissions={permissions}
        activePanel={activePanel}
        onTogglePanel={setActivePanel}
        isChatVisible={isChatVisible}
        onToggleChat={() => setIsChatVisible((v) => !v)}
        onPublish={onPublish}
        onBack={onBack}
      />

      {/* Body */}
      <div className="flex-1 min-h-0">
        {/* Desktop/Tablet: side-by-side panels */}
        <div className="hidden md:block h-full">
          <PanelGroup direction="horizontal">
            {/* Chat panel (collapsible) */}
            {isChatVisible && (
              <>
                <Panel defaultSize={40} minSize={25} maxSize={55}>
                  <AIChatPanel
                    messages={chat.messages}
                    isGenerating={chat.isGenerating}
                    suggestions={suggestions}
                    onSendMessage={chat.sendMessage}
                    onSuggestionClick={handleSuggestionClick}
                    userName={userName}
                    isTeam={isTeam}
                  />
                </Panel>
                <PanelResizeHandle className="w-px bg-gray-200 dark:bg-zinc-800 hover:bg-emerald-400 transition-colors" />
              </>
            )}

            {/* Preview or Code panel */}
            <Panel defaultSize={isChatVisible ? 60 : 100}>
              {activePanel === 'preview' ? (
                <LivePreview
                  previewUrl={preview.previewUrl}
                  isLoading={preview.isLoading}
                  isLive={preview.isLive}
                  error={preview.error}
                  domainName={domainName}
                  iframeRef={preview.iframeRef}
                  onRefresh={preview.refreshPreview}
                  onRetry={preview.fetchPreviewUrl}
                />
              ) : (
                permissions.canViewCode && (
                  <CodePanel projectId={projectId} />
                )
              )}
            </Panel>
          </PanelGroup>
        </div>

        {/* Mobile: full-screen chat */}
        <div className="md:hidden h-full">
          <AIChatPanel
            messages={chat.messages}
            isGenerating={chat.isGenerating}
            suggestions={suggestions}
            onSendMessage={chat.sendMessage}
            onSuggestionClick={handleSuggestionClick}
            userName={userName}
            isTeam={isTeam}
          />
        </div>
      </div>

      {/* Mobile: floating preview button */}
      <button
        onClick={() => setIsMobilePreviewOpen(true)}
        className="fixed bottom-6 right-6 md:hidden px-5 py-3 rounded-full bg-emerald-600 text-white shadow-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors z-40"
      >
        <Eye size={18} />
        Preview
      </button>

      {/* Mobile: preview modal */}
      <PreviewModal
        isOpen={isMobilePreviewOpen}
        onClose={() => setIsMobilePreviewOpen(false)}
        previewUrl={preview.previewUrl}
        isLive={preview.isLive}
        domainName={domainName}
      />
    </div>
  );
}
