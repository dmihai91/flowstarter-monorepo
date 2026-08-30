'use client';

/**
 * The client's own editor: their site on the left, one change at a time on the
 * right.
 *
 * SELECTION. The frame is served from `/api/client/site/[id]/preview`, which
 * stamps every editable block with `data-flowstarter-id` and injects a small
 * bridge script. Clicking a block posts its id out; this component matches it
 * against the target list the server sent. The frame is sandboxed into an
 * opaque origin, so a message is trusted by `event.source` — the one thing an
 * opaque origin cannot forge — rather than by `event.origin`, which would be
 * the string "null" for every frame on the internet.
 *
 * NOTHING APPLIES ITSELF. `/edit` returns a proposal; the client reads the old
 * text beside the new one and either applies it or throws it away. A model
 * writing directly into someone's live site, with no step where a person says
 * yes, is not an editor.
 *
 * REFUSALS ARE SHOWN. Every control the policy denies stays visible with the
 * policy's reason next to it. See PolicyNotice.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PolicyNotice } from './PolicyNotice';
import { ImageSlotsPanel } from './ImageSlotsPanel';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import {
  EditorRequestError,
  diffWords,
  editorApiBase,
  requestEditor,
  type EditorState,
  type EditorTarget,
  type EditorVersion,
} from './editor-client';

// Repeated rather than imported: the other end of this bridge lives in
// `lib/flowstarter/site-preview.ts`, which is `server-only` and must not be
// pulled into a client bundle. The two constants are asserted together by the
// preview route's test, which checks the served document against these names.
const PREVIEW_MESSAGE_SOURCE = 'flowstarter-site-preview';
const EDITOR_MESSAGE_SOURCE = 'flowstarter-site-editor';

type Tab = 'text' | 'images' | 'history';

interface Proposal {
  targetId: string;
  originalContent: string;
  replacementContent: string;
}

export function SiteEditor({
  workspaceId,
  initial,
}: {
  workspaceId: string;
  initial: EditorState;
}) {
  const base = editorApiBase(workspaceId);
  const frame = useRef<HTMLIFrameElement | null>(null);

  const [tab, setTab] = useState<Tab>('text');
  const [targets, setTargets] = useState<EditorTarget[]>(initial.targets);
  const [versions, setVersions] = useState<EditorVersion[]>(initial.versions);
  const [version, setVersion] = useState(initial.site.version);
  const [used, setUsed] = useState(initial.allowance.used);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.targets[0]?.id ?? null
  );
  const [instruction, setInstruction] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState<'edit' | 'apply' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState(0);

  const contentPolicy = initial.policy.content;
  const canEdit = contentPolicy.action === 'inline_content_agent';
  const selected = useMemo(
    () => targets.find((target) => target.id === selectedId) ?? null,
    [targets, selectedId]
  );

  // The frame is sandboxed, so its origin is opaque and `event.origin` is the
  // useless string "null" for every such frame. Identity comes from the window
  // handle we created instead.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as { source?: string; type?: string; targetId?: string };
      if (data?.source !== PREVIEW_MESSAGE_SOURCE) return;
      if (data.type === 'select' && typeof data.targetId === 'string') {
        setSelectedId(data.targetId);
        setProposal(null);
        setError(null);
        setTab('text');
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Selecting from the list highlights the same block in the frame, so the two
  // halves never disagree about what "this" means.
  useEffect(() => {
    if (!selectedId) return;
    frame.current?.contentWindow?.postMessage(
      { source: EDITOR_MESSAGE_SOURCE, type: 'select', targetId: selectedId },
      '*'
    );
  }, [selectedId]);

  const refreshState = useCallback(async () => {
    const state = await requestEditor<EditorState>(base);
    setTargets(state.targets);
    setVersions(state.versions);
    setVersion(state.site.version);
    setUsed(state.allowance.used);
  }, [base]);

  async function propose() {
    if (!selected || !instruction.trim()) return;
    setBusy('edit');
    setError(null);
    setNotice(null);
    try {
      const result = await requestEditor<Proposal & { allowance: { used: number } }>(
        `${base}/edit`,
        {
          method: 'POST',
          body: JSON.stringify({
            targetId: selected.id,
            instruction: instruction.trim(),
          }),
        }
      );
      setProposal({
        targetId: result.targetId,
        originalContent: result.originalContent,
        replacementContent: result.replacementContent,
      });
      setUsed(result.allowance.used);
    } catch (caught) {
      setError(
        caught instanceof EditorRequestError
          ? caught.message
          : 'That did not work. Please try again.'
      );
    } finally {
      setBusy(null);
    }
  }

  async function apply() {
    if (!proposal) return;
    setBusy('apply');
    setError(null);
    try {
      const result = await requestEditor<{
        version: number;
        targets: EditorTarget[];
      }>(`${base}/apply`, {
        method: 'POST',
        body: JSON.stringify(proposal),
      });
      setTargets(result.targets);
      setVersion(result.version);
      setProposal(null);
      setInstruction('');
      setNotice(`Saved as version ${result.version}.`);
      setFrameKey((key) => key + 1);
      await refreshState();
    } catch (caught) {
      setError(
        caught instanceof EditorRequestError
          ? caught.message
          : 'That change could not be saved.'
      );
      // A stale original means the site moved on; the frame and the list have
      // to be re-read before another attempt can mean anything.
      if (caught instanceof EditorRequestError && caught.status === 409) {
        setProposal(null);
        setFrameKey((key) => key + 1);
        await refreshState().catch(() => {});
      }
    } finally {
      setBusy(null);
    }
  }

  const sections = useMemo(() => {
    const grouped = new Map<string, EditorTarget[]>();
    for (const target of targets) {
      const list = grouped.get(target.section);
      if (list) list.push(target);
      else grouped.set(target.section, [target]);
    }
    return Array.from(grouped.entries());
  }, [targets]);

  return (
    <div className="flex min-h-screen w-full flex-col gap-4 px-4 py-6 lg:flex-row lg:px-6">
      <section className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--fs-ink)]/10 bg-white/70">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--fs-ink)]/10 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-[var(--fs-ink)]">
              {initial.site.name}
            </p>
            <p className="text-xs text-[var(--fs-ink)]/55">
              {initial.site.rendersBuiltHtml
                ? `Your site · version ${version || 1}`
                : `Content preview · version ${version || 1}${
                    initial.site.templateSlug
                      ? ` · ${initial.site.templateSlug} template`
                      : ''
                  }`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFrameKey((key) => key + 1)}
            className="rounded-full border border-[var(--fs-ink)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--fs-ink)]/70 hover:bg-[var(--fs-ink)]/5"
          >
            Refresh
          </button>
        </header>
        <iframe
          key={frameKey}
          ref={frame}
          data-testid="site-preview-frame"
          title={`${initial.site.name} preview`}
          src={`${base}/preview`}
          // Opaque origin: the frame renders the client's own site content from
          // our domain, and must not be able to touch the dashboard's session.
          sandbox="allow-scripts"
          className="h-full min-h-[420px] w-full flex-1 border-0 bg-white"
        />
      </section>

      <aside className="flex w-full flex-col gap-4 lg:w-[420px]">
        <nav className="flex gap-1 rounded-full border border-[var(--fs-ink)]/10 bg-white/70 p-1 text-sm">
          {(
            [
              ['text', 'Words'],
              ['images', 'Pictures'],
              ['history', 'History'],
            ] as Array<[Tab, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              data-testid={`editor-tab-${value}`}
              className={`flex-1 rounded-full px-3 py-1.5 font-semibold transition-colors ${
                tab === value
                  ? 'bg-[var(--fs-ink)] text-white'
                  : 'text-[var(--fs-ink)]/65 hover:bg-[var(--fs-ink)]/5'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === 'text' ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--fs-ink)]/10 bg-white/70 px-4 py-4">
            <PolicyNotice decision={contentPolicy} />

            <div>
              <label
                htmlFor="editor-target"
                className="text-xs font-semibold uppercase tracking-widest text-[var(--fs-ink)]/50"
              >
                What are you changing?
              </label>
              <select
                id="editor-target"
                data-testid="editor-target-select"
                value={selectedId ?? ''}
                onChange={(event) => {
                  setSelectedId(event.target.value || null);
                  setProposal(null);
                }}
                className="mt-1 w-full rounded-xl border border-[var(--fs-ink)]/15 bg-white px-3 py-2 text-sm text-[var(--fs-ink)]"
              >
                <option value="">Click something in your site…</option>
                {sections.map(([section, group]) => (
                  <optgroup key={section} label={section}>
                    {group.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.key}: {target.content.slice(0, 60)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {selected ? (
              <div className="rounded-xl bg-[var(--fs-ink)]/[0.04] px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--fs-ink)]/45">
                  {selected.section} · {selected.key}
                </p>
                <p
                  data-testid="editor-current-text"
                  className="mt-1 whitespace-pre-wrap text-sm text-[var(--fs-ink)]"
                >
                  {selected.content}
                </p>
              </div>
            ) : null}

            <div>
              <label
                htmlFor="editor-instruction"
                className="text-xs font-semibold uppercase tracking-widest text-[var(--fs-ink)]/50"
              >
                What should it say instead?
              </label>
              <textarea
                id="editor-instruction"
                data-testid="editor-instruction"
                value={instruction}
                maxLength={initial.allowance.maxInstructionChars}
                onChange={(event) => setInstruction(event.target.value)}
                rows={3}
                disabled={!canEdit || !selected}
                placeholder="Warmer, and mention that we open on Saturdays"
                className="mt-1 w-full rounded-xl border border-[var(--fs-ink)]/15 bg-white px-3 py-2 text-sm text-[var(--fs-ink)] disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-[var(--fs-ink)]/50">
                {used} of {initial.allowance.cap} changes used today.
              </p>
            </div>

            <button
              type="button"
              data-testid="editor-propose"
              onClick={propose}
              disabled={!canEdit || !selected || !instruction.trim() || busy !== null}
              className="rounded-full bg-[var(--fs-ink)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy === 'edit' ? 'Writing…' : 'Suggest a change'}
            </button>

            {proposal ? (
              <div
                data-testid="editor-proposal"
                className="flex flex-col gap-3 rounded-xl border border-[var(--fs-ink)]/15 px-3 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fs-ink)]/50">
                  Before you save
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {diffWords(
                    proposal.originalContent,
                    proposal.replacementContent
                  ).map((part, index) => (
                    <span
                      key={index}
                      className={
                        part.kind === 'removed'
                          ? 'bg-red-100 text-red-900 line-through'
                          : part.kind === 'added'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'text-[var(--fs-ink)]/80'
                      }
                    >
                      {part.text}
                    </span>
                  ))}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-testid="editor-apply"
                    onClick={apply}
                    disabled={busy !== null}
                    className="rounded-full bg-[var(--fs-ink)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {busy === 'apply' ? 'Saving…' : 'Use this'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProposal(null)}
                    className="rounded-full border border-[var(--fs-ink)]/15 px-5 py-2 text-sm font-semibold text-[var(--fs-ink)]/70"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ) : null}

            {error ? (
              <p
                data-testid="editor-error"
                className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="text-sm text-[var(--fs-ink)]/60">{notice}</p>
            ) : null}
          </div>
        ) : null}

        {tab === 'images' ? (
          <ImageSlotsPanel
            base={base}
            policy={initial.policy.image}
            onChanged={async () => {
              setFrameKey((key) => key + 1);
              await refreshState().catch(() => {});
            }}
          />
        ) : null}

        {tab === 'history' ? (
          <VersionHistoryPanel
            base={base}
            versions={versions}
            currentVersion={version}
            policy={contentPolicy}
            onChanged={async () => {
              setFrameKey((key) => key + 1);
              await refreshState().catch(() => {});
            }}
          />
        ) : null}

        <Link
          href={`/dashboard/projects/${workspaceId}`}
          className="text-sm font-semibold text-[var(--fs-ink)]/60 underline underline-offset-4"
        >
          Back to your project
        </Link>
      </aside>
    </div>
  );
}
