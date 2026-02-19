import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { computed } from 'nanostores';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import type { ActionRunner } from '~/lib/runtime/action-runner';
import type { FileHistory } from '~/types/actions';

import type {
  OnChangeCallback as OnEditorChange,
  OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';
import { EditorPanel } from './EditorPanel';
import { Preview } from './Preview';
import { ProgressIndicator } from './ProgressIndicator';
import useViewport from '~/lib/hooks';

import { usePreviewStore } from '~/lib/stores/previews';
import type { ElementInfo } from './Inspector';

interface ChatMetadata {
  gitUrl?: string;
  [key: string]: string | undefined;
}

interface HeaderProps {
  showWorkbench: boolean;
  currentView: WorkbenchViewType;
}

interface WorkspaceProps {
  chatStarted?: boolean;
  isStreaming?: boolean;
  actionRunner?: ActionRunner;
  metadata?: ChatMetadata;
  updateChatMestaData?: (metadata: ChatMetadata) => void;
  setSelectedElement?: (element: ElementInfo | null) => void;
  renderHeader?: (headerProps: HeaderProps) => React.ReactNode;
}

const viewTransition = { ease: cubicEasingFn };

const workbenchVariants = {
  closed: {
    width: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    width: 'var(--workbench-width)',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

export const Workbench = memo(
  ({
    chatStarted,
    isStreaming,
    actionRunner,
    metadata,
    updateChatMestaData,
    renderHeader: _renderHeader,
  }: WorkspaceProps) => {
    renderLogger.trace('Workbench');

    const [fileHistory, setFileHistory] = useState<Record<string, FileHistory>>({});

    // Terminal state

    // const modifiedFiles = Array.from(useStore(workbenchStore.unsavedFiles).keys());

    const hasPreview = useStore(computed(workbenchStore.previews, (previews) => previews.length > 0));
    const showWorkbench = useStore(workbenchStore.showWorkbench);
    const selectedFile = useStore(workbenchStore.selectedFile);
    const currentDocument = useStore(workbenchStore.currentDocument);
    const unsavedFiles = useStore(workbenchStore.unsavedFiles);
    const files = useStore(workbenchStore.files);
    const selectedView = useStore(workbenchStore.currentView);

    const isSmallViewport = useViewport(1024);

    const setSelectedView = (view: WorkbenchViewType) => {
      workbenchStore.currentView.set(view);
    };

    useEffect(() => {
      if (hasPreview) {
        setSelectedView('preview');
      }
    }, [hasPreview]);

    useEffect(() => {
      workbenchStore.setDocuments(files);
    }, [files]);

    const onEditorChange = useCallback<OnEditorChange>((update) => {
      workbenchStore.setCurrentDocumentContent(update.content);
    }, []);

    const onEditorScroll = useCallback<OnEditorScroll>((position) => {
      workbenchStore.setCurrentDocumentScrollPosition(position);
    }, []);

    const onFileSelect = useCallback((filePath: string | undefined) => {
      workbenchStore.setSelectedFile(filePath);
    }, []);

    const onFileSave = useCallback(() => {
      workbenchStore
        .saveCurrentDocument()
        .then(() => {
          // Explicitly refresh all previews after a file save
          const previewStore = usePreviewStore();
          previewStore.refreshAllPreviews();
        })
        .catch(() => {
          toast.error('Failed to update file content');
        });
    }, []);

    const onFileReset = useCallback(() => {
      workbenchStore.resetCurrentDocument();
    }, []);

    // Show workbench even during onboarding (before chatStarted)
    const shouldShowWorkbench = chatStarted ? showWorkbench : true;

    return (
      <motion.div
        initial="closed"
        animate={shouldShowWorkbench ? 'open' : 'closed'}
        variants={workbenchVariants}
        className="z-workbench"
      >
        <div
          className={classNames('duration-200 flowstarter-ease-cubic-bezier', {
            // Mobile Styles (Fixed Overlay)
            'fixed top-[var(--header-height)] bottom-0 right-0 w-full z-50': isSmallViewport,
            'translate-x-0': isSmallViewport && shouldShowWorkbench,
            'translate-x-full': isSmallViewport && !shouldShowWorkbench,

            // Desktop Styles (Flow Layout)
            'relative h-full w-full bg-flowstarter-elements-background-depth-1': !isSmallViewport,
          })}
        >
          <div className="absolute inset-0">
            <div className="h-full flex flex-col bg-flowstarter-elements-background-depth-1 overflow-hidden shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.3)]">
              <div className="relative flex-1 overflow-hidden">
                <View initial={{ x: '0%' }} animate={{ x: selectedView === 'code' ? '0%' : '-100%' }}>
                  <EditorPanel
                    editorDocument={currentDocument}
                    isStreaming={isStreaming}
                    selectedFile={selectedFile}
                    files={files}
                    unsavedFiles={unsavedFiles}
                    fileHistory={fileHistory}
                    onFileSelect={onFileSelect}
                    onEditorScroll={onEditorScroll}
                    onEditorChange={onEditorChange}
                    onFileSave={onFileSave}
                    onFileReset={onFileReset}
                  />
                </View>

                <View initial={{ x: '100%' }} animate={{ x: selectedView === 'preview' ? '0%' : '100%' }}>
                  <Preview />
                </View>
                <View initial={{ x: '100%' }} animate={{ x: selectedView === 'progress' ? '0%' : '100%' }}>
                  <ProgressIndicator />
                </View>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
);

// View component for rendering content with motion transitions
interface ViewProps extends HTMLMotionProps<'div'> {
  children: React.ReactElement;
}

const View = memo(({ children, ...props }: ViewProps) => {
  return (
    <motion.div className="absolute inset-0" transition={viewTransition} {...props}>
      {children}
    </motion.div>
  );
});
