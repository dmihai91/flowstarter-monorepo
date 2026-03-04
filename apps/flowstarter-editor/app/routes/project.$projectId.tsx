import { LoadingScreen } from '@flowstarter/flow-design-system';
import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useParams } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import type { Id } from '../../convex/_generated/dataModel';
import { ProjectEditorContent } from '~/components/editor/ProjectEditorContent';
import { ProjectNotFoundRedirect } from '~/components/editor/ProjectNotFoundRedirect';
import { en } from '~/lib/i18n/locales/en';

export const meta: MetaFunction = () => [
  { title: en.pages.project },
  { name: 'description', content: en.app.description },
];

export const loader = ({ params }: LoaderFunctionArgs) => {
  return json({ projectId: params.projectId });
};

/** Validate if a string looks like a valid Convex ID. */
function isValidConvexId(id: string): boolean {
  if (!id || typeof id !== 'string' || id.length < 10) {
    return false;
  }

  return /^[a-z][a-z0-9]+$/i.test(id);
}

function LoadingFallback() {
  return <LoadingScreen message="Loading project..." />;
}

function ProjectEditorWrapper() {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId || !isValidConvexId(projectId)) {
    return <ProjectNotFoundRedirect />;
  }

  return <ProjectEditorContent key={projectId} projectId={projectId as Id<'conversations'>} />;
}

export default function ProjectPage() {
  return <ClientOnly fallback={<LoadingFallback />}>{() => <ProjectEditorWrapper />}</ClientOnly>;
}
