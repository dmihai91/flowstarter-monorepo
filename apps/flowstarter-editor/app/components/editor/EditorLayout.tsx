import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { useNavigate } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { useResizablePanel, useThemeStyles, getColors } from './hooks';
import {
  EditorHeader,
  EmptyState,
  ResizeHandle,
  LoadingSpinner,
  ConversationSidebar,
  type ViewMode,
} from './components';
import { useConversationContext } from './ConversationContext';
import { useDaytonaPreview, createAutoFixHandler } from '~/lib/hooks/useDaytonaPreview';
import { DaytonaPreview } from '~/components/workbench/DaytonaPreview';
import type { OnboardingStep } from './editor-chat/types';
import { TerminalPanel } from './TerminalPanel';
import type { AgentActivityEvent } from './AgentActivityPanel';
import type { OrchestratorStatusDTO } from '~/lib/hooks/types/orchestrator.dto';
import type { Id } from '../../../convex/_generated/dataModel';

// Lazy load the Monaco-based code editor (no WebContainer dependency)
const ConvexCodeEditor = lazy(() =>
  import('./ConvexCodeEditor').then((module) => ({
    default: module.ConvexCodeEditor,
  })),
);

interface EditorLayoutProps {
  projectName?: string;
  projectId?: Id<'projects'> | null;
  children?: React.ReactNode;
  isPublishEnabled?: boolean;
  hasProject?: boolean;
  onboardingStep?: OnboardingStep;
  onPublish?: () => void;
  orchestrationStatus?: OrchestratorStatusDTO | null;
  agentEvents?: AgentActivityEvent[];
  isAgentActive?: boolean;
}

const PANEL_CONFIG = {
  initialWidth: 440,
  minWidth: 320,
  maxWidth: 600,
} as const;

export function EditorLayout({
  projectName = 'New Project',
  projectId,
  children,
  isPublishEnabled = false,
  hasProject = false,
  onboardingStep,
  onPublish,
  orchestrationStatus,
  agentEvents = [],
  isAgentActive = false,
}: EditorLayoutProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(240);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 640;
      const tablet = window.innerWidth >= 640 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (mobile) setViewMode(prev => prev === 'preview' ? 'chat' : prev);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Track if preview has been triggered (deferred until user switches to preview tab)
  const [previewTriggered, setPreviewTriggered] = useState(false);

  /*
   * Determine if we should auto-start preview
   * Auto-start is ONLY enabled after build is COMPLETE ('ready')
   * This ensures files are fully saved to Convex before preview starts
   */
  const shouldAutoStartPreview = onboardingStep === 'ready';

  /*
   * Initialize Daytona preview hook
   * autoStart: Only enabled when build is complete - hook waits for files to be available in Convex
   */
  const {
    state: daytonaState,
    startPreview,
    refreshPreview,
    retryPreview,
    autoFixAttempts,
  } = useDaytonaPreview({
    projectId: projectId || null,
    autoStart: shouldAutoStartPreview,
    onBuildError: createAutoFixHandler(),
    maxAutoFixAttempts: 3,
  });


  // Ensure preview starts when step becomes 'ready' and viewMode is already 'preview'
  // (autoStart in the hook handles this, but this is a safety net)
  useEffect(() => {
    if (onboardingStep === 'ready' && viewMode === 'preview' && !previewTriggered && projectId && daytonaState.status === 'idle') {
      setPreviewTriggered(true);
      startPreview();
    }
  }, [onboardingStep, viewMode, previewTriggered, projectId, daytonaState.status, startPreview]);

  // Handle view mode changes - trigger preview on first switch to preview tab
  // Auto-open terminal when agent starts running
  const prevAgentActive = useRef(false);
  useEffect(() => {
    if (isAgentActive && !prevAgentActive.current) {
      setTerminalOpen(true);
    }
    prevAgentActive.current = isAgentActive;
  }, [isAgentActive]);

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);

      // Start preview when user first switches to preview tab (deferred loading)
      if (mode === 'preview' && !previewTriggered && projectId) {
        setPreviewTriggered(true);
        startPreview();
      }
    },
    [previewTriggered, projectId, startPreview],
  );

  // Conversation context for sidebar and conversation management
  const {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    conversations,
    activeConversation,
    isLoadingConversations,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    projectName: contextProjectName,
    updateProjectName,
    updateConversationProjectName,
  } = useConversationContext();

  // Use context project name or prop fallback
  const displayProjectName = contextProjectName || projectName;

  const {
    width: chatWidth,
    isResizing,
    isHandleHovered,
    containerRef,
    handleMouseDown,
    setIsHandleHovered,
  } = useResizablePanel(PANEL_CONFIG);

  const navigate = useNavigate();

  const handleNewConversation = async () => {
    const newConversationId = await createConversation();
    closeSidebar();

    // Navigate to the new conversation URL
    if (newConversationId) {
      navigate(`/project/${newConversationId}`);
    }
  };

  const handleSelectConversation = async (id: Parameters<typeof selectConversation>[0]) => {
    closeSidebar();

    // Navigate to the conversation URL
    navigate(`/project/${id}`);
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh', maxHeight: '-webkit-fill-available',
        width: '100vw',
        overflow: 'hidden',
        background: 'transparent',
        color: colors.textPrimary,
      }}
    >
      {/* Flow design system animated background */}
      <FlowBackground variant="editor" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

      {/* Project History Sidebar */}
      <ConversationSidebar
        isOpen={isSidebarOpen}
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        isLoading={isLoadingConversations}
        onClose={closeSidebar}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={renameConversation}
        onProjectNameChange={updateConversationProjectName}
        onDeleteConversation={deleteConversation}
      />

      <EditorHeader
        projectName={displayProjectName}
        projectId={projectId}
        viewMode={viewMode}
        isPublishEnabled={isPublishEnabled}
        onViewModeChange={handleViewModeChange}
        onProjectNameChange={updateProjectName}
        onPublish={onPublish}
        onMenuClick={toggleSidebar}
        terminalErrorCount={agentEvents.filter((e: AgentActivityEvent) => e.type === 'error' || (e.type === 'sandbox_exit' && (e as any).code !== 0)).length}
        hasTerminalActivity={(agentEvents ?? []).length > 0}
        terminalOpen={terminalOpen}
        onTerminalToggle={() => setTerminalOpen(o => !o)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT: Chat Panel (Resizable on desktop, full-width on mobile) */}
        <div
          style={{
            width: isMobile ? '100%' : isTablet ? '360px' : `${chatWidth}px`,
            minWidth: isMobile ? '100%' : isTablet ? '320px' : `${PANEL_CONFIG.minWidth}px`,
            maxWidth: isMobile ? '100%' : isTablet ? '400px' : `${PANEL_CONFIG.maxWidth}px`,
            display: isMobile && viewMode === 'preview' ? 'none' : 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'transparent',
            position: 'relative',
            zIndex: 5,
            borderRight: isMobile ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          {children}
        </div>

        {!isMobile && <ResizeHandle
          isResizing={isResizing}
          isHovered={isHandleHovered}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsHandleHovered(true)}
          onMouseLeave={() => setIsHandleHovered(false)}
        />}

        {/* RIGHT: Editor/Preview Panel (hidden on mobile when in chat mode) */}
        <div style={{ flex: 1, background: isDark ? colors.bgTertiary : 'rgba(248,248,250,0.6)', overflow: 'hidden', display: isMobile && viewMode !== 'preview' ? 'none' : 'flex', flexDirection: 'column' }}>
          {projectId &&
          onboardingStep &&
          ![
            'welcome',
            'describe',
            'name',
            'business-uvp',
            'business-audience',
            'business-goals',
            'business-tone',
            'business-selling',
            'business-pricing',
            'business-summary',
            'template',
            'personalization',
            'integrations',
          ].includes(onboardingStep) ? (
            <ClientOnly>
              {() => (
                <Suspense fallback={<LoadingSpinner message="Loading editor..." />}>
                  {viewMode === 'preview' ? (
                    // Preview mode: show Daytona preview or loading state
                    <DaytonaPreview state={daytonaState} onRefresh={refreshPreview} onRetry={retryPreview} />
                  ) : (
                    // Editor mode: code editor + integrated terminal panel at bottom
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                        <ConvexCodeEditor projectId={projectId} onSaveComplete={refreshPreview} />
                      </div>
                      {/* Integrated terminal — toggled via terminal button in header */}
                      {terminalOpen && (
                        <div
                          style={{
                            height: terminalHeight,
                            minHeight: 120,
                            maxHeight: '60%',
                            borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                            flexShrink: 0,
                            overflow: 'hidden',
                            resize: 'vertical',
                          }}
                        >
                          <TerminalPanel events={agentEvents ?? []} isActive={isAgentActive} />
                        </div>
                      )}
                    </div>
                  )}
                </Suspense>
              )}
            </ClientOnly>
          ) : (
            <EmptyState type={viewMode === 'editor' ? 'editor' : 'preview'} step={onboardingStep} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
