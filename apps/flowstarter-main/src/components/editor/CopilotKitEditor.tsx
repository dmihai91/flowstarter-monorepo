'use client';

/**
 * CopilotKit-powered Coding Agent Editor
 *
 * Uses AG-UI protocol via CopilotKit for a polished agent interaction experience.
 * This replaces the custom streaming UI with CopilotKit's built-in components.
 */

import { CopilotKit, useCopilotContext } from '@copilotkit/react-core';
import { CopilotChat, CopilotSidebar } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { AnimatePresence, motion } from 'framer-motion';
import { Code2, Eye, FileCode, Loader2, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Import preview panel for showing generated website
import { PreviewPanel } from './PreviewPanel';

export interface CopilotKitEditorProps {
  // Project context
  projectName: string;
  projectDescription?: string;
  templateId?: string;
  projectId?: string;

  // Design config
  designConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontHeading?: string;
    fontBody?: string;
  };

  // Callbacks
  onComplete?: (result: GenerationResult) => void;
  onError?: (error: string) => void;
}

export interface GenerationResult {
  siteId: string;
  files: Array<{ path: string; content: string }>;
  previewUrl?: string;
}

// Custom state for tracking generation
interface GenerationState {
  isGenerating: boolean;
  currentStep: number;
  totalSteps: number;
  stepName: string;
  files: Array<{ path: string; size: number }>;
  previewHtml?: string;
  previewUrl?: string;
  error?: string;
}

/**
 * Inner component that has access to CopilotKit hooks
 */
function CopilotEditorInner({
  projectName,
  projectDescription,
  templateId: _templateId,
  projectId: _projectId,
  designConfig: _designConfig,
  onComplete: _onComplete,
  onError: _onError,
}: CopilotKitEditorProps) {
  const [state] = useState<GenerationState>({
    isGenerating: false,
    currentStep: 0,
    totalSteps: 5,
    stepName: '',
    files: [],
  });

  const [showPreview, setShowPreview] = useState(true);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(50);

  // Access CopilotKit context
  const copilotContext = useCopilotContext();

  // Update state based on AG-UI events received via CopilotKit
  useEffect(() => {
    // CopilotKit provides state updates via the context
    // We can access messages and other state from copilotContext
    if (copilotContext) {
      // State updates will come through the AG-UI protocol events
    }
  }, [copilotContext]);

  // Handle preview toggle
  const togglePreview = useCallback(() => {
    setShowPreview((prev) => !prev);
  }, []);

  // Panel resize handling
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('editor-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setPanelWidth(Math.min(Math.max(newWidth, 30), 70));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Step progress display
  const steps = [
    { id: 1, name: 'Planning Architecture', icon: Code2 },
    { id: 2, name: 'Generating Code', icon: FileCode },
    { id: 3, name: 'Building Project', icon: RefreshCw },
    { id: 4, name: 'Reviewing Code', icon: Eye },
    { id: 5, name: 'Generating Preview', icon: Eye },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">{projectName}</span>
          </div>

          {/* Step indicator */}
          {state.isGenerating && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                Step {state.currentStep}/{state.totalSteps}: {state.stepName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePreview}
            className="flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div id="editor-container" className="flex flex-1 overflow-hidden">
        {/* Chat Panel with CopilotChat */}
        <div
          className="flex flex-col border-r bg-card/30"
          style={{ width: showPreview ? `${panelWidth}%` : '100%' }}
        >
          <CopilotChat
            className="flex-1"
            labels={{
              title: 'Website Generator',
              initial: `I'll help you build "${projectName}". ${
                projectDescription
                  ? `Based on your description: "${projectDescription}"`
                  : 'What kind of website would you like to create?'
              }`,
              placeholder: 'Describe changes or ask questions...',
            }}
            icons={{
              sendIcon: (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              ),
            }}
          />

          {/* Progress Steps (shown during generation) */}
          {state.isGenerating && (
            <div className="p-4 border-t bg-card/50">
              <div className="space-y-2">
                {steps.map((step) => {
                  const isActive = state.currentStep === step.id;
                  const isComplete = state.currentStep > step.id;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg transition-all',
                        isActive &&
                          'bg-primary/10 text-primary border border-primary/20',
                        isComplete && 'text-green-600 dark:text-green-400',
                        !isActive && !isComplete && 'text-muted-foreground'
                      )}
                    >
                      {isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isComplete ? (
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                      <span className="text-sm">{step.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* File count */}
              {state.files.length > 0 && (
                <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                  📁 {state.files.length} files generated
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resize Handle */}
        {showPreview && (
          <div
            className={cn(
              'w-1 cursor-col-resize hover:bg-primary/20 transition-colors',
              isResizing && 'bg-primary/40'
            )}
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Preview Panel */}
        {showPreview && (
          <div
            className="flex flex-col bg-background"
            style={{ width: `${100 - panelWidth}%` }}
          >
            <PreviewPanel
              previewHtml={state.previewHtml}
              previewUrl={state.previewUrl}
              projectName={projectName}
              isGenerating={state.isGenerating}
              onFullscreen={() => setIsPreviewFullscreen(true)}
            />
          </div>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {isPreviewFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Preview: {projectName}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPreviewFullscreen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="h-[calc(100vh-60px)]">
              <PreviewPanel
                previewHtml={state.previewHtml}
                previewUrl={state.previewUrl}
                projectName={projectName}
                isGenerating={state.isGenerating}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Main CopilotKit Editor component
 * Wraps the inner component with CopilotKit provider
 */
export function CopilotKitEditor(props: CopilotKitEditorProps) {
  // Build context to pass to the agent
  const agentContext = {
    projectName: props.projectName,
    projectDescription: props.projectDescription,
    projectId: props.projectId,
    templateId: props.templateId,
    designConfig: props.designConfig,
    projectDetails: {
      name: props.projectName,
      description: props.projectDescription || '',
      designConfig: props.designConfig,
    },
  };

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      // Pass project context to the agent
      properties={{
        context: agentContext,
      }}
    >
      <CopilotEditorInner {...props} />
    </CopilotKit>
  );
}

// Also export a sidebar version for different layouts
export function CopilotKitSidebar(props: CopilotKitEditorProps) {
  const agentContext = {
    projectName: props.projectName,
    projectDescription: props.projectDescription,
    projectId: props.projectId,
    templateId: props.templateId,
    designConfig: props.designConfig,
    projectDetails: {
      name: props.projectName,
      description: props.projectDescription || '',
      designConfig: props.designConfig,
    },
  };

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      properties={{
        context: agentContext,
      }}
    >
      <CopilotSidebar
        labels={{
          title: `Building: ${props.projectName}`,
          initial: 'Ready to generate your website. What would you like?',
        }}
      />
    </CopilotKit>
  );
}

export default CopilotKitEditor;
