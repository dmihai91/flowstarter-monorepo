/**
 * Project Edit Route
 *
 * Full-screen editor for a specific project.
 * If project has no workspace → show SetupWizard.
 * If project has existing workspace → show editor layout.
 */

import { useParams, useNavigate } from '@remix-run/react';
import { useQuery, useMutation } from 'convex/react';
import { useState, useCallback } from 'react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { SetupWizard, type SetupData } from '~/components/setup/SetupWizard';
import { SandboxEditorLayout } from '~/components/editor/SandboxEditorLayout';
import { PublishDialog } from '~/components/editor/PublishDialog';

export default function ProjectEditRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const project = useQuery(api.projects.get, {
    id: projectId as Id<'projects'>,
  });

  const updateProject = useMutation(api.projects.update);

  const hasWorkspace = !!project?.daytonaWorkspaceId;

  const handleSetupComplete = useCallback(
    async (data: SetupData) => {
      if (!projectId) return;

      setIsSettingUp(true);

      try {
        // Start workspace setup via API
        const response = await fetch('/api/claude-code/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            action: 'setup',
            templateSlug: data.templateSlug,
            businessData: {
              name: data.businessName,
              description: data.businessDescription,
              industry: data.industry,
            },
            designPreferences: {
              palette: data.palette,
              fonts: {
                heading: data.headingFont,
                body: data.bodyFont,
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create workspace');
        }

        // Update project with setup data
        await updateProject({
          id: projectId as Id<'projects'>,
          templateId: data.templateSlug,
          templateName: data.templateName,
        });
      } catch (error) {
        console.error('Setup failed:', error);
      } finally {
        setIsSettingUp(false);
      }
    },
    [projectId, updateProject],
  );

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show setup wizard if no workspace yet
  if (!hasWorkspace) {
    return (
      <SetupWizard
        projectId={projectId!}
        initialBusinessData={{
          name: project.businessDetails?.name,
          description: project.businessDetails?.description,
          industry: project.businessDetails?.industry,
        }}
        onComplete={handleSetupComplete}
        isLoading={isSettingUp}
      />
    );
  }

  // Show editor
  return (
    <>
      <SandboxEditorLayout
        projectId={projectId!}
        domainName={project.domainName}
        onBack={handleBack}
        onPublish={() => setIsPublishOpen(true)}
      />

      <PublishDialog
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        projectId={projectId!}
      />
    </>
  );
}
