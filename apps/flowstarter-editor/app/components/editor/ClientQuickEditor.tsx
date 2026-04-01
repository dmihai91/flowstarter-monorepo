import { LoadingScreen } from '@flowstarter/flow-design-system';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../../convex/_generated/api';
// eslint-disable-next-line no-restricted-imports
import type { Id } from '../../../convex/_generated/dataModel';
import {
  getClientEditableFiles,
  parseClientEditableContent,
  upsertFrontmatterValue,
  upsertNestedFrontmatterValue,
  type ClientEditableContentState,
} from '~/lib/content/clientEditableContent';

interface ClientQuickEditorProps {
  projectId: Id<'projects'>;
  projectName: string;
  publishedUrl?: string | null;
}

const FIELD_CLASS =
  'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm outline-none transition focus:border-stone-400';
const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-[0.16em] text-stone-500';

function buildUpdatedHeroContent(content: string, draft: ClientEditableContentState): string {
  let next = upsertFrontmatterValue(content, 'headline', draft.heroHeadline);
  next = upsertFrontmatterValue(next, 'subheadline', draft.heroSubheadline);

  return next;
}

function buildUpdatedSiteContent(content: string, draft: ClientEditableContentState): string {
  let next = upsertFrontmatterValue(content, 'name', draft.siteName);
  next = upsertFrontmatterValue(next, 'tagline', draft.siteTagline);

  if (draft.siteDescription || /(?:^|\n)description:/m.test(next)) {
    next = upsertFrontmatterValue(next, 'description', draft.siteDescription);
  }

  if (/(?:^|\n)contact:\n/m.test(next)) {
    next = upsertNestedFrontmatterValue(next, 'contact', 'email', draft.contactEmail);
    next = upsertNestedFrontmatterValue(next, 'contact', 'phone', draft.contactPhone);
    next = upsertNestedFrontmatterValue(next, 'contact', 'address', draft.contactLocation);

    return next;
  }

  next = upsertFrontmatterValue(next, 'email', draft.contactEmail);
  next = upsertFrontmatterValue(next, 'phone', draft.contactPhone);
  next = upsertFrontmatterValue(next, 'location', draft.contactLocation);

  return next;
}

export function ClientQuickEditor({ projectId, projectName, publishedUrl }: ClientQuickEditorProps) {
  const files = useQuery(api.files.getProjectFiles, { projectId });
  const updateFileContent = useMutation(api.files.updateContent);
  const [draft, setDraft] = useState<ClientEditableContentState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const parsedContent = useMemo(() => {
    if (!files) {
      return null;
    }

    return parseClientEditableContent(files);
  }, [files]);

  const editableFiles = useMemo(() => getClientEditableFiles(files ?? []), [files]);

  useEffect(() => {
    if (parsedContent) {
      setDraft(parsedContent);
    }
  }, [parsedContent]);

  if (!files || !draft) {
    return <LoadingScreen message="Loading your quick editor..." />;
  }

  const heroFile = editableFiles.heroFilePath ? files.find((file) => file.path === editableFiles.heroFilePath) : null;
  const siteFile = editableFiles.siteFilePath ? files.find((file) => file.path === editableFiles.siteFilePath) : null;

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(parsedContent);

  const updateField = (key: keyof ClientEditableContentState, value: string) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!hasChanges || !heroFile || !siteFile) {
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await updateFileContent({
        projectId,
        path: heroFile.path,
        content: buildUpdatedHeroContent(heroFile.content, draft),
      });
      await updateFileContent({
        projectId,
        path: siteFile.path,
        content: buildUpdatedSiteContent(siteFile.content, draft),
      });
      setStatusMessage('Changes saved. Your Flowstarter team can review or republish them.');
    } catch (error) {
      console.error('[ClientQuickEditor] Failed to save client changes:', error);
      setStatusMessage('Saving failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:grid lg:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Client Editor</p>
            <h1 className="mt-2 text-2xl font-semibold text-stone-900">{projectName}</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Make the safe, fast changes that matter most: headline, supporting copy, and contact details.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className={LABEL_CLASS}>Site Name</label>
              <input
                aria-label="Site Name"
                className={FIELD_CLASS}
                value={draft.siteName}
                onChange={(event) => updateField('siteName', event.target.value)}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Hero Headline</label>
              <textarea
                aria-label="Hero Headline"
                className={`${FIELD_CLASS} min-h-[96px] resize-y`}
                value={draft.heroHeadline}
                onChange={(event) => updateField('heroHeadline', event.target.value)}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Hero Subheadline</label>
              <textarea
                aria-label="Hero Subheadline"
                className={`${FIELD_CLASS} min-h-[120px] resize-y`}
                value={draft.heroSubheadline}
                onChange={(event) => updateField('heroSubheadline', event.target.value)}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Tagline</label>
              <input
                aria-label="Tagline"
                className={FIELD_CLASS}
                value={draft.siteTagline}
                onChange={(event) => updateField('siteTagline', event.target.value)}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Site Description</label>
              <textarea
                aria-label="Site Description"
                className={`${FIELD_CLASS} min-h-[120px] resize-y`}
                value={draft.siteDescription}
                onChange={(event) => updateField('siteDescription', event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Email</label>
                <input
                  aria-label="Email"
                  className={FIELD_CLASS}
                  value={draft.contactEmail}
                  onChange={(event) => updateField('contactEmail', event.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Phone</label>
                <input
                  aria-label="Phone"
                  className={FIELD_CLASS}
                  value={draft.contactPhone}
                  onChange={(event) => updateField('contactPhone', event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Address / Location</label>
              <input
                aria-label="Address / Location"
                className={FIELD_CLASS}
                value={draft.contactLocation}
                onChange={(event) => updateField('contactLocation', event.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              disabled={!hasChanges || isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
            {statusMessage ? (
              <p className="text-sm text-stone-600">{statusMessage}</p>
            ) : (
              <p className="text-sm text-stone-500">Changes stay scoped to your site content files.</p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Live View</p>
              <p className="mt-1 text-sm text-stone-600">
                {publishedUrl
                  ? 'Preview the currently published version of your site.'
                  : 'A live preview will appear here after the site is published.'}
              </p>
            </div>
            {publishedUrl ? (
              <a
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-900"
                href={publishedUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open Site
              </a>
            ) : null}
          </div>

          {publishedUrl ? (
            <iframe
              className="h-[calc(100vh-11rem)] min-h-[680px] w-full border-0 bg-white"
              src={publishedUrl}
              title="Published site preview"
            />
          ) : (
            <div className="flex h-[calc(100vh-11rem)] min-h-[680px] items-center justify-center bg-stone-50 p-8 text-center text-sm text-stone-500">
              Your Flowstarter team has not published this site yet. Once it is live, this panel will show the published
              page.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
