/**
 * ProjectEditorContent — Main editor content for a project route.
 *
 * Uses useProjectEditorState for all state management.
 * Renders ConversationProvider > EditorLayout > EditorChatPanel.
 */

import { memo } from 'react';
import { LoadingScreen } from '@flowstarter/flow-design-system';
import type { Id } from '../../../convex/_generated/dataModel';
import { EditorLayout, ConversationProvider } from '~/components/editor';
import { EditorChatPanel } from '~/components/editor/EditorChatPanel';
import { useProjectEditorState } from '~/components/editor/hooks/useProjectEditorState';
import { en } from '~/lib/i18n/locales/en';
import { ProjectNotFoundRedirect } from './ProjectNotFoundRedirect';

interface ProjectEditorContentProps {
  projectId: Id<'conversations'>;
}

export const ProjectEditorContent = memo(function ProjectEditorContent({ projectId }: ProjectEditorContentProps) {
  const {
    conversation,
    convexProjectId,
    initialState,
    isLoading,
    isNotFound,
    onboardingStep,
    orchestrationStatus,
    setOnboardingStep,
    setOrchestrationStatus,
    setLocalProjectUrlId,
    handleStateChange,
  } = useProjectEditorState(projectId);

  if (isLoading) {
    return <LoadingScreen message="Loading project..." />;
  }

  if (isNotFound) {
    return <ProjectNotFoundRedirect />;
  }

  return (
    <ConversationProvider initialConversationId={projectId}>
      <EditorLayout
        projectName={conversation?.projectName || en.pages.createNewProject}
        projectId={convexProjectId}
        onboardingStep={onboardingStep}
        orchestrationStatus={orchestrationStatus}
      >
        <EditorChatPanel
          key={projectId}
          conversationId={projectId}
          initialState={initialState!}
          onProjectReady={(urlId) => setLocalProjectUrlId(urlId)}
          onStepChange={setOnboardingStep}
          onStateChange={handleStateChange}
          onOrchestrationStatusChange={setOrchestrationStatus}
        />
      </EditorLayout>
    </ConversationProvider>
  );
});
