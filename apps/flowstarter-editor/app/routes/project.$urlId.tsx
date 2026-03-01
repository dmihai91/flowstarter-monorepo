import { LoadingScreen } from '@flowstarter/flow-design-system';
import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useParams, useNavigate } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { useCallback, lazy, Suspense } from 'react';
import { en } from '~/lib/i18n/locales/en';
import { useTranslation } from '~/lib/i18n/useTranslation';
import { useQuery } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';

// Lazy load SimpleProjectEditor since Monaco can't be loaded server-side
const SimpleProjectEditor = lazy(() =>
  import('~/components/editor/SimpleProjectEditor').then((m) => ({ default: m.SimpleProjectEditor })),
);

export const meta: MetaFunction<typeof loader> = ({ params }) => {
  return [
    { title: en.pages.editing.replace('{{name}}', params.urlId || '') },
    { name: 'description', content: en.app.description },
  ];
};

export const loader = ({ params }: LoaderFunctionArgs) => {
  return json({ urlId: params.urlId });
};

// Main editor component
function ProjectEditorContent() {
  const { urlId } = useParams<{ urlId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          <p className="text-secondary">{t.app.loadingProject}</p>
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
          <h2 className="text-xl font-semibold text-white mb-2">{t.pages.projectNotFound}</h2>
          <p className="text-secondary mb-6">{t.pages.projectNotFoundDescription}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t.pages.createNewProject}
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
            <p className="text-secondary">{t.app.loadingEditor}</p>
          </div>
        </div>
      }
    >
      <SimpleProjectEditor projectId={project._id} projectName={project.name || en.pages.createNewProject} onPublish={handlePublish} />
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
        <h1 className="text-2xl font-bold text-white">{en.editor.title}</h1>
        <div className="i-svg-spinners:90-ring-with-bg text-2xl text-primary" />
      </div>
    </div>
  );
}

export default function ProjectEditor() {
  return <ClientOnly fallback={<ProjectEditorFallback />}>{() => <ProjectEditorContent />}</ClientOnly>;
}
