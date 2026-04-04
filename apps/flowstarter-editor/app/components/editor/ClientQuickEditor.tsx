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
  publishedAt?: number | null;
  templateName?: string | null;
  paletteName?: string | null;
  paletteColors?: string[];
  fontName?: string | null;
  accessLevel?: 'view' | 'customize' | 'full';
}

const CLIENT_SESSION_TOKEN_KEY = 'flowstarter_client_session_token';
const FIELD_CLASS =
  'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500';
const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-[0.16em] text-stone-500';
const SECTION_CLASS = 'rounded-[24px] border border-stone-200 bg-stone-50/70 p-4';

function getClientSessionToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(CLIENT_SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function formatPublishedAt(timestamp?: number | null): string | null {
  if (!timestamp) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return null;
  }
}

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

export function ClientQuickEditor({
  projectId,
  projectName,
  publishedUrl,
  publishedAt,
  templateName,
  paletteName,
  paletteColors = [],
  fontName,
  accessLevel = 'customize',
}: ClientQuickEditorProps) {
  const files = useQuery(api.files.getProjectFiles, { projectId });
  const updateFileContent = useMutation(api.files.updateContent);
  const [draft, setDraft] = useState<ClientEditableContentState | null>(null);
  const [savedDraft, setSavedDraft] = useState<ClientEditableContentState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [livePublishedUrl, setLivePublishedUrl] = useState<string | null>(publishedUrl ?? null);
  const [previewVersion, setPreviewVersion] = useState<number>(publishedAt ?? 0);

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
      setSavedDraft(parsedContent);
    }
  }, [parsedContent]);

  useEffect(() => {
    setLivePublishedUrl(publishedUrl ?? null);
  }, [publishedUrl]);

  useEffect(() => {
    if (publishedAt) {
      setPreviewVersion(publishedAt);
    }
  }, [publishedAt]);

  if (!files || !draft) {
    return <LoadingScreen message="Loading your quick editor..." />;
  }

  const heroFile = editableFiles.heroFilePath ? files.find((file) => file.path === editableFiles.heroFilePath) : null;
  const siteFile = editableFiles.siteFilePath ? files.find((file) => file.path === editableFiles.siteFilePath) : null;
  const hasHeroSection = Boolean(heroFile);
  const hasSiteSection = Boolean(siteFile);
  const hasEditableContent = hasHeroSection || hasSiteSection;
  const canEdit = accessLevel === 'customize' || accessLevel === 'full';
  const canPublish = accessLevel === 'customize' || accessLevel === 'full';
  const isFormDisabled = !canEdit || isSaving || isPublishing;
  const lockedPaletteColors = paletteColors.slice(0, 5);
  const publishedLabel = formatPublishedAt(publishedAt);
  const previewUrl = livePublishedUrl
    ? `${livePublishedUrl}${livePublishedUrl.includes('?') ? '&' : '?'}preview=${previewVersion || 'live'}`
    : null;

  const hasChanges =
    draft && savedDraft
      ? JSON.stringify(draft) !== JSON.stringify(savedDraft)
      : JSON.stringify(draft) !== JSON.stringify(parsedContent);

  const updateField = (key: keyof ClientEditableContentState, value: string) => {
    setStatusMessage(null);
    setPublishMessage(null);
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!hasChanges || !canEdit) {
      return;
    }

    const updates = [];

    if (heroFile) {
      updates.push(
        updateFileContent({
          projectId,
          path: heroFile.path,
          content: buildUpdatedHeroContent(heroFile.content, draft),
        }),
      );
    }

    if (siteFile) {
      updates.push(
        updateFileContent({
          projectId,
          path: siteFile.path,
          content: buildUpdatedSiteContent(siteFile.content, draft),
        }),
      );
    }

    if (updates.length === 0) {
      setStatusMessage('This template is not configured for self-serve editing yet.');
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    setPublishMessage(null);

    try {
      await Promise.all(updates);
      setSavedDraft(draft);
      setStatusMessage(
        canPublish
          ? 'Changes saved. Publish when you are ready to update the live site.'
          : 'Changes saved. Your Flowstarter team can review and publish them.',
      );
    } catch (error) {
      console.error('[ClientQuickEditor] Failed to save client changes:', error);
      setStatusMessage('Saving failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!canPublish) {
      return;
    }

    if (hasChanges) {
      setPublishMessage('Save your edits before publishing.');
      return;
    }

    const sessionToken = getClientSessionToken();

    if (!sessionToken) {
      setPublishMessage('Your session expired. Open the latest Flowstarter access link and try again.');
      return;
    }

    setIsPublishing(true);
    setPublishMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ projectId }),
      });

      const result = (await response.json()) as { error?: string; publishedUrl?: string };

      if (!response.ok) {
        setPublishMessage(result.error || 'Publishing failed. Please try again.');
        return;
      }

      setLivePublishedUrl(result.publishedUrl ?? livePublishedUrl);
      setPreviewVersion(Date.now());
      setPublishMessage('Site published. The live preview has been refreshed.');
    } catch (error) {
      console.error('[ClientQuickEditor] Failed to publish client changes:', error);
      setPublishMessage('Publishing failed. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:grid lg:grid-cols-[460px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Client Editor</p>
              <h1 className="mt-2 text-2xl font-semibold text-stone-900">{projectName}</h1>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Make fast content updates without touching code. Templates, layout structure, and engineering changes
                stay with the Flowstarter team.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                Safe edits only
              </span>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                {canEdit ? 'Customizer access' : 'View-only access'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className={SECTION_CLASS}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Locked Site Setup</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-stone-500">Template</p>
                  <p className="mt-1 text-sm text-stone-900">{templateName || 'Managed by Flowstarter'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Fonts</p>
                  <p className="mt-1 text-sm text-stone-900">{fontName || 'Managed by Flowstarter'}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-stone-500">Palette</p>
                <div className="mt-1 flex items-center gap-3">
                  <p className="text-sm text-stone-900">{paletteName || 'Managed by Flowstarter'}</p>
                  {lockedPaletteColors.length ? (
                    <div className="flex items-center gap-2">
                      {lockedPaletteColors.map((color) => (
                        <span
                          key={color}
                          aria-hidden="true"
                          className="h-4 w-4 rounded-full border border-stone-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={SECTION_CLASS}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">What You Can Change</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Update core copy, contact details, and other approved content fields. Deeper layout, widget, or code
                changes stay outside this editor for beta.
              </p>
            </div>

            {!hasEditableContent ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-900">
                  This template is not configured for self-serve editing yet.
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Your site can still be reviewed here, but Flowstarter needs to make the next changes on your behalf
                  because the safe editable content files are missing from this template.
                </p>
              </div>
            ) : null}

            {hasSiteSection ? (
              <div className="space-y-5">
                <div>
                  <label className={LABEL_CLASS}>Site Name</label>
                  <input
                    aria-label="Site Name"
                    className={FIELD_CLASS}
                    disabled={isFormDisabled}
                    value={draft.siteName}
                    onChange={(event) => updateField('siteName', event.target.value)}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Tagline</label>
                  <input
                    aria-label="Tagline"
                    className={FIELD_CLASS}
                    disabled={isFormDisabled}
                    value={draft.siteTagline}
                    onChange={(event) => updateField('siteTagline', event.target.value)}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Site Description</label>
                  <textarea
                    aria-label="Site Description"
                    className={`${FIELD_CLASS} min-h-[120px] resize-y`}
                    disabled={isFormDisabled}
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
                      disabled={isFormDisabled}
                      value={draft.contactEmail}
                      onChange={(event) => updateField('contactEmail', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Phone</label>
                    <input
                      aria-label="Phone"
                      className={FIELD_CLASS}
                      disabled={isFormDisabled}
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
                    disabled={isFormDisabled}
                    value={draft.contactLocation}
                    onChange={(event) => updateField('contactLocation', event.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {hasHeroSection ? (
              <div className="space-y-5">
                <div>
                  <label className={LABEL_CLASS}>Hero Headline</label>
                  <textarea
                    aria-label="Hero Headline"
                    className={`${FIELD_CLASS} min-h-[96px] resize-y`}
                    disabled={isFormDisabled}
                    value={draft.heroHeadline}
                    onChange={(event) => updateField('heroHeadline', event.target.value)}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Hero Subheadline</label>
                  <textarea
                    aria-label="Hero Subheadline"
                    className={`${FIELD_CLASS} min-h-[120px] resize-y`}
                    disabled={isFormDisabled}
                    value={draft.heroSubheadline}
                    onChange={(event) => updateField('heroSubheadline', event.target.value)}
                  />
                </div>
              </div>
            ) : null}

            <div className={SECTION_CLASS}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Need A Bigger Change?</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                New sections, deeper layout changes, template swaps, integrations, and custom code still go through the
                Flowstarter team. This beta editor stays intentionally scoped so your live site stays stable.
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                If you need more advanced features, contact Flowstarter and we will handle the next round of changes for
                you.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                disabled={!hasChanges || isFormDisabled || !hasEditableContent}
                onClick={handleSave}
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-900 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
                disabled={isSaving || isPublishing || !canPublish || !hasEditableContent}
                onClick={handlePublish}
              >
                {isPublishing ? 'Publishing…' : 'Publish Site'}
              </button>
            </div>

            {statusMessage ? <p className="text-sm text-stone-600">{statusMessage}</p> : null}
            {publishMessage ? <p className="text-sm text-stone-600">{publishMessage}</p> : null}
            {!statusMessage && !publishMessage ? (
              <p className="text-sm text-stone-500">
                Client edits stay scoped to approved content fields. Template and code changes remain locked.
              </p>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Live View</p>
              <p className="mt-1 text-sm text-stone-600">
                {livePublishedUrl
                  ? 'Preview the currently published version of your site.'
                  : 'Publish once to load the live site here. Until then, Flowstarter can continue refining it for you.'}
              </p>
              {publishedLabel ? <p className="mt-1 text-xs text-stone-500">Last published {publishedLabel}</p> : null}
            </div>
            {livePublishedUrl ? (
              <a
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-900"
                href={livePublishedUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open Site
              </a>
            ) : null}
          </div>

          {previewUrl ? (
            <iframe
              className="h-[calc(100vh-11rem)] min-h-[680px] w-full border-0 bg-white"
              src={previewUrl}
              title="Published site preview"
            />
          ) : (
            <div className="flex h-[calc(100vh-11rem)] min-h-[680px] items-center justify-center bg-stone-50 p-8 text-center text-sm text-stone-500">
              Your Flowstarter team has not published this site yet. Once the site is published, this panel will show
              the live version that clients see.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
