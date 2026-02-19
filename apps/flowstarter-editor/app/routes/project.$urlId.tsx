import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useParams, useNavigate } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { useCallback, lazy, Suspense } from 'react';
import { useQuery } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';

// Lazy load SimpleProjectEditor since Monaco can't be loaded server-side
const SimpleProjectEditor = lazy(() =>
  import('~/components/editor/SimpleProjectEditor').then((m) => ({ default: m.SimpleProjectEditor })),
);

export const meta: MetaFunction<typeof loader> = ({ params }) => {
  return [
    { title: `Editing ${params.urlId} - Flowstarter` },
    { name: 'description', content: 'Edit your website with AI-powered assistance' },
  ];
};

export const loader = ({ params }: LoaderFunctionArgs) => {
  return json({ urlId: params.urlId });
};

// Main editor component
function ProjectEditorContent() {
  const { urlId } = useParams<{ urlId: string }>();
  const navigate = useNavigate();

  // Fetch project data from Convex
  const project = useQuery(api.projects.getByUrlId, urlId ? { urlId } : 'skip');

  // Handle publish
  const handlePublish = useCallback(async () => {
    // TODO: Implement Netlify deployment
    console.log('Publishing project...');
  }, []);

  // Loading state
  if (project === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="i-svg-spinners:90-ring-with-bg text-4xl text-primary" />
          <p className="text-secondary">Loading project...</p>
        </div>
      </div>
    );
  }

  // Project not found
  if (project === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f1a] p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <div className="i-ph:warning-circle-duotone text-3xl text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Project not found</h2>
          <p className="text-secondary mb-6">The project you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create New Project
          </button>
        </div>
      </div>
    );
  }

  // Use Monaco + Daytona editor
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f1a]">
          <div className="flex flex-col items-center gap-4">
            <div className="i-svg-spinners:90-ring-with-bg text-4xl text-primary" />
            <p className="text-secondary">Loading editor...</p>
          </div>
        </div>
      }
    >
      <SimpleProjectEditor projectId={project._id} projectName={project.name} onPublish={handlePublish} />
    </Suspense>
  );
}

// Fallback component for SSR
function ProjectEditorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
          <div className="i-ph:rocket-launch-duotone text-3xl text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Flowstarter</h1>
        <div className="i-svg-spinners:90-ring-with-bg text-2xl text-primary" />
      </div>
    </div>
  );
}

export default function ProjectEditor() {
  return <ClientOnly fallback={<ProjectEditorFallback />}>{() => <ProjectEditorContent />}</ClientOnly>;
}
